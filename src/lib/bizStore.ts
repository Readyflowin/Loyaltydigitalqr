/**
 * Business-scoped Firestore cache.
 *
 * Every module service keeps its synchronous read API: reads come from an
 * in-memory cache that is kept live by Firestore onSnapshot listeners, and
 * writes are computed by diffing the bundle a service hands back against the
 * cached documents (only changed documents are written).
 *
 * Layout:  businesses/{businessId}/{collection}/{docId}
 *          businesses/{businessId}/config/{docId}      (single documents)
 *
 * A business is "attached" either as a member (full access, enforced by
 * Firestore rules) or as a public visitor (only collections flagged public).
 * Nothing is ever read across businesses: every listener is scoped to one
 * businessId, and the rules reject anything else.
 */

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

export type AccessMode = 'member' | 'public';

export interface MirrorSpec {
  /** Collection that receives a projected copy of each document. */
  collection: string;
  /** Returns the public projection, or null to remove the mirror document. */
  project: (docData: DocumentData) => DocumentData | null;
}

export interface ArraySpec {
  /** Property name on the service bundle, e.g. "customers". */
  key: string;
  /** Firestore sub-collection under businesses/{id}. */
  collection: string;
  /** Visitors (not signed-in members) may read this collection. */
  public?: boolean;
  /** For visitors, build this array from another (public) collection instead. */
  publicSource?: string;
  /** Only keep the newest N documents live (append-only logs). */
  recent?: { orderBy: string; max: number };
  /** Maintain a projected copy in another collection on every write. */
  mirror?: MirrorSpec;
  sort?: (a: DocumentData, b: DocumentData) => number;
}

export interface SingleSpec {
  key: string;
  /** Document id under businesses/{id}/config. */
  docId: string;
  public?: boolean;
}

export interface ModuleSpec<B> {
  name: string;
  arrays: ArraySpec[];
  singles?: SingleSpec[];
  /** Empty bundle used before data exists (never written automatically). */
  empty: (businessId: string) => B;
}

interface Entry {
  json: string;
}

interface AttachedBusiness {
  mode: AccessMode;
  collections: Map<string, Map<string, Entry>>;
  singles: Map<string, Entry | null>;
  pendingLoads: Set<string>;
  unsubs: Unsubscribe[];
  pinned: Set<string>;
  errors: string[];
  /** Collections/singles already subscribed, so a late-registered spec never double-listens. */
  subscribedCollections: Set<string>;
  subscribedSingles: Set<string>;
}

export interface StoreError {
  businessId: string;
  message: string;
  at: number;
}

/** Deterministic JSON (sorted keys, undefined dropped) for change detection. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Strip undefined values so Firestore accepts the payload. */
function toFirestoreData(value: unknown): DocumentData {
  return JSON.parse(JSON.stringify(value)) as DocumentData;
}

const SINGLE_KEY = (docId: string) => `config/${docId}`;
const PIN_KEY = (collectionName: string, docId: string) => `${collectionName}/${docId}`;

class BizStore {
  private specs: ModuleSpec<unknown>[] = [];
  private attached = new Map<string, AttachedBusiness>();
  private memo = new Map<string, unknown>();
  private listeners = new Set<() => void>();
  private errorListeners = new Set<(err: StoreError) => void>();
  private notifyScheduled = false;
  private pendingCommits = 0;

  constructor() {
    // A save that hasn't reached Firestore yet is lost if the tab reloads or
    // closes within those few milliseconds, so ask the browser to confirm.
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', (event) => {
        if (this.pendingCommits > 0) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
    }
  }

  register<B>(spec: ModuleSpec<B>): void {
    this.specs.push(spec as ModuleSpec<unknown>);
    // Back-subscribe any already-attached business to this newly registered
    // spec. Module services register their spec on first import, which for a
    // code-split public page happens AFTER the business was attached by the
    // gate — so without this, a visitor would never receive that module's
    // public collections (e.g. a service business's /services page showing no
    // services). These late loads do not block isReady, so the page renders
    // immediately and the data streams in.
    for (const [businessId, state] of this.attached) {
      this.subscribeSpec(businessId, state, spec as ModuleSpec<unknown>, false);
    }
  }

  /** Collections + config singles a spec wants for the given access mode. */
  private specWanted(
    spec: ModuleSpec<unknown>,
    mode: AccessMode
  ): { collections: Map<string, ArraySpec['recent']>; singles: Set<string> } {
    const collections = new Map<string, ArraySpec['recent']>();
    const singles = new Set<string>();
    for (const arr of spec.arrays) {
      if (mode === 'member') collections.set(arr.collection, arr.recent);
      else if (arr.public) collections.set(arr.collection, arr.recent);
      else if (arr.publicSource) collections.set(arr.publicSource, undefined);
    }
    for (const single of spec.singles || []) {
      if (mode === 'member' || single.public) singles.add(single.docId);
    }
    return { collections, singles };
  }

  /** Start listeners for one spec's collections/singles, skipping any already live. */
  private subscribeSpec(
    businessId: string,
    state: AttachedBusiness,
    spec: ModuleSpec<unknown>,
    blockReady: boolean
  ): void {
    const { collections, singles } = this.specWanted(spec, state.mode);
    for (const [name, recent] of collections) {
      if (state.subscribedCollections.has(name)) continue;
      state.subscribedCollections.add(name);
      this.listenCollection(businessId, state, name, recent, 0, blockReady);
    }
    for (const docId of singles) {
      if (state.subscribedSingles.has(docId)) continue;
      state.subscribedSingles.add(docId);
      this.listenSingle(businessId, state, docId, 0, blockReady);
    }
  }

  // ---------------------------------------------------------------------------
  // Attachment lifecycle
  // ---------------------------------------------------------------------------

  /** Start live listeners for one business. Re-attaching in the same mode is a no-op. */
  attach(businessId: string, mode: AccessMode): void {
    const existing = this.attached.get(businessId);
    if (existing && (existing.mode === mode || existing.mode === 'member')) return;
    if (existing) this.detach(businessId);

    const state: AttachedBusiness = {
      mode,
      collections: new Map(),
      singles: new Map(),
      pendingLoads: new Set(),
      unsubs: [],
      pinned: new Set(),
      errors: [],
      subscribedCollections: new Set(),
      subscribedSingles: new Set(),
    };
    this.attached.set(businessId, state);

    // Specs registered by now block the first "ready"; later ones stream in.
    for (const spec of this.specs) {
      this.subscribeSpec(businessId, state, spec, true);
    }

    this.scheduleNotify();
  }

  detach(businessId: string): void {
    const state = this.attached.get(businessId);
    if (!state) return;
    state.unsubs.forEach((u) => u());
    this.attached.delete(businessId);
    this.invalidate(businessId);
    this.scheduleNotify();
  }

  detachAll(): void {
    for (const id of [...this.attached.keys()]) this.detach(id);
  }

  getMode(businessId: string): AccessMode | null {
    return this.attached.get(businessId)?.mode ?? null;
  }

  attachedIds(): string[] {
    return [...this.attached.keys()];
  }

  /** True once every listener for the business delivered its first snapshot. */
  isReady(businessId: string): boolean {
    const state = this.attached.get(businessId);
    return !!state && state.pendingLoads.size === 0;
  }

  getErrors(businessId: string): string[] {
    return this.attached.get(businessId)?.errors ?? [];
  }

  /**
   * Watch a single document (e.g. one order by its unguessable tracking id)
   * and merge it into the collection cache, without list access.
   */
  pinDoc(businessId: string, collectionName: string, docId: string): void {
    const state = this.attached.get(businessId);
    if (!state) throw new Error(`Business ${businessId} is not attached`);
    const key = PIN_KEY(collectionName, docId);
    if (state.pinned.has(key)) return;
    state.pinned.add(key);
    state.pendingLoads.add(key);

    const unsub = onSnapshot(
      doc(db, 'businesses', businessId, collectionName, docId),
      (snap) => {
        const coll = this.ensureCollection(state, collectionName);
        if (snap.exists()) {
          coll.set(snap.id, { json: stableStringify(snap.data()) });
        } else {
          coll.delete(snap.id);
        }
        state.pendingLoads.delete(key);
        this.invalidate(businessId);
        this.scheduleNotify();
      },
      (err) => {
        state.pendingLoads.delete(key);
        this.reportError(businessId, state, `${collectionName}/${docId}: ${err.message}`);
      }
    );
    state.unsubs.push(unsub);
  }

  private ensureCollection(state: AttachedBusiness, name: string): Map<string, Entry> {
    let coll = state.collections.get(name);
    if (!coll) {
      coll = new Map();
      state.collections.set(name, coll);
    }
    return coll;
  }

  /**
   * A permission error right after a workspace is created (or a member joins)
   * usually means the membership write has not reached the server yet. Retry
   * a few times before reporting, keeping the business in "loading" meanwhile.
   */
  private retryOrReport(
    businessId: string,
    state: AttachedBusiness,
    key: string,
    err: { code?: string; message: string },
    attempt: number,
    relisten: (nextAttempt: number) => void
  ): void {
    if (err.code === 'permission-denied' && attempt < 5 && this.attached.get(businessId) === state) {
      setTimeout(() => {
        if (this.attached.get(businessId) === state) relisten(attempt + 1);
      }, 800 * (attempt + 1));
      return;
    }
    state.pendingLoads.delete(key);
    this.reportError(businessId, state, `${key}: ${err.message}`);
  }

  private listenCollection(
    businessId: string,
    state: AttachedBusiness,
    collectionName: string,
    recent: ArraySpec['recent'],
    attempt = 0,
    blockReady = true
  ): void {
    const ref = collection(db, 'businesses', businessId, collectionName);
    const q = recent ? query(ref, orderBy(recent.orderBy, 'desc'), limit(recent.max)) : ref;
    if (blockReady) state.pendingLoads.add(collectionName);
    this.ensureCollection(state, collectionName);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const coll = this.ensureCollection(state, collectionName);
        for (const change of snap.docChanges()) {
          if (change.type === 'removed') {
            coll.delete(change.doc.id);
          } else {
            coll.set(change.doc.id, { json: stableStringify(change.doc.data()) });
          }
        }
        state.pendingLoads.delete(collectionName);
        this.invalidate(businessId);
        this.scheduleNotify();
      },
      (err) =>
        this.retryOrReport(businessId, state, collectionName, err, attempt, (next) =>
          this.listenCollection(businessId, state, collectionName, recent, next, blockReady)
        )
    );
    state.unsubs.push(unsub);
  }

  private listenSingle(
    businessId: string,
    state: AttachedBusiness,
    docId: string,
    attempt = 0,
    blockReady = true
  ): void {
    const key = SINGLE_KEY(docId);
    if (blockReady) state.pendingLoads.add(key);
    const unsub = onSnapshot(
      doc(db, 'businesses', businessId, 'config', docId),
      (snap) => {
        state.singles.set(docId, snap.exists() ? { json: stableStringify(snap.data()) } : null);
        state.pendingLoads.delete(key);
        this.invalidate(businessId);
        this.scheduleNotify();
      },
      (err) =>
        this.retryOrReport(businessId, state, key, err, attempt, (next) =>
          this.listenSingle(businessId, state, docId, next, blockReady)
        )
    );
    state.unsubs.push(unsub);
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  /** Bundle for one attached business (empty bundle when not attached / not loaded). */
  getBundle<B>(spec: ModuleSpec<B>, businessId: string): B {
    const memoKey = `${spec.name}::${businessId}`;
    const cached = this.memo.get(memoKey);
    if (cached) return cached as B;

    const state = this.attached.get(businessId);
    const bundle = spec.empty(businessId) as Record<string, unknown>;
    if (state) {
      for (const arr of spec.arrays) {
        const usesSource = state.mode === 'public' && !arr.public && !!arr.publicSource;
        const coll = state.collections.get(usesSource ? arr.publicSource! : arr.collection);
        const own = usesSource ? state.collections.get(arr.collection) : undefined;
        if (!coll && !own) continue;
        // Visitors see the public projection, overlaid with any full documents
        // they may read (pinned by id) or have just created themselves.
        const merged = new Map<string, Entry>(coll ?? []);
        for (const [id, entry] of own ?? []) merged.set(id, entry);
        const items = [...merged.values()].map((e) => JSON.parse(e.json) as DocumentData);
        if (arr.sort) items.sort(arr.sort);
        bundle[arr.key] = items;
      }
      for (const single of spec.singles || []) {
        const entry = state.singles.get(single.docId);
        if (entry) bundle[single.key] = JSON.parse(entry.json);
      }
    }
    this.memo.set(memoKey, bundle);
    return bundle as B;
  }

  /** Record<businessId, bundle> across every attached business. */
  getAll<B>(spec: ModuleSpec<B>): Record<string, B> {
    const out: Record<string, B> = {};
    for (const id of this.attached.keys()) {
      out[id] = this.getBundle(spec, id);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------------

  /** Persist every changed document in the given bundles. Unattached ids are ignored. */
  saveAll<B>(spec: ModuleSpec<B>, data: Record<string, B>): void {
    for (const [businessId, bundle] of Object.entries(data)) {
      if (!bundle || !this.attached.has(businessId)) continue;
      this.save(spec, businessId, bundle);
    }
  }

  save<B>(spec: ModuleSpec<B>, businessId: string, bundle: B): void {
    const state = this.attached.get(businessId);
    if (!state) return;
    const source = bundle as Record<string, unknown>;
    const ops: Array<{ path: string[]; data: DocumentData | null }> = [];

    for (const arr of spec.arrays) {
      const items = source[arr.key] as DocumentData[] | undefined;
      if (!Array.isArray(items)) continue;

      // Visitors diff against the public source they were given, so untouched
      // projected documents are never written back as real ones.
      const baselineName = state.mode === 'public' && !arr.public && arr.publicSource ? arr.publicSource : arr.collection;
      const baseline = state.collections.get(baselineName) ?? new Map<string, Entry>();
      const target = this.ensureCollection(state, arr.collection);
      const seen = new Set<string>();

      for (const item of items) {
        const id = item?.id;
        if (typeof id !== 'string' || !id || id.includes('/')) continue;
        seen.add(id);
        const json = stableStringify(item);
        const known = target.get(id) ?? baseline.get(id);
        if (known?.json === json) continue;

        const data = toFirestoreData(item);
        ops.push({ path: [arr.collection, id], data });
        target.set(id, { json });
        if (arr.mirror) {
          const projected = arr.mirror.project(data);
          ops.push({ path: [arr.mirror.collection, id], data: projected });
          const mirrorColl = this.ensureCollection(state, arr.mirror.collection);
          if (projected) mirrorColl.set(id, { json: stableStringify(projected) });
          else mirrorColl.delete(id);
        }
      }

      // Deletions only for documents this client actually had loaded.
      if (baselineName === arr.collection) {
        for (const id of [...baseline.keys()]) {
          if (seen.has(id)) continue;
          ops.push({ path: [arr.collection, id], data: null });
          baseline.delete(id);
          if (arr.mirror) ops.push({ path: [arr.mirror.collection, id], data: null });
        }
      }
    }

    for (const single of spec.singles || []) {
      const value = source[single.key];
      if (value === undefined || value === null) continue;
      const json = stableStringify(value);
      if (state.singles.get(single.docId)?.json === json) continue;
      ops.push({ path: ['config', single.docId], data: toFirestoreData(value) });
      state.singles.set(single.docId, { json });
    }

    if (ops.length === 0) return;
    this.invalidate(businessId);
    this.scheduleNotify();
    void this.commit(businessId, ops);
  }

  private async commit(businessId: string, ops: Array<{ path: string[]; data: DocumentData | null }>): Promise<void> {
    const CHUNK = 400;
    this.pendingCommits++;
    try {
      for (let i = 0; i < ops.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + CHUNK)) {
          const ref = doc(db, 'businesses', businessId, ...op.path);
          if (op.data === null) batch.delete(ref);
          else batch.set(ref, op.data);
        }
        try {
          await batch.commit();
        } catch (err) {
          const state = this.attached.get(businessId);
          const message = err instanceof Error ? err.message : String(err);
          if (state) this.reportError(businessId, state, `Save failed: ${message}`);
        }
      }
    } finally {
      this.pendingCommits--;
    }
  }

  /** True while a save has not yet been confirmed by the server. */
  hasPendingWrites(): boolean {
    return this.pendingCommits > 0;
  }

  // ---------------------------------------------------------------------------
  // Change notification
  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onError(listener: (err: StoreError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private reportError(businessId: string, state: AttachedBusiness, message: string): void {
    console.error(`[bizStore] ${businessId}: ${message}`);
    state.errors.push(message);
    const err = { businessId, message, at: Date.now() };
    this.errorListeners.forEach((l) => l(err));
    this.invalidate(businessId);
    this.scheduleNotify();
  }

  private invalidate(businessId: string): void {
    for (const key of [...this.memo.keys()]) {
      if (key.endsWith(`::${businessId}`)) this.memo.delete(key);
    }
  }

  private scheduleNotify(): void {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      this.listeners.forEach((l) => {
        try {
          l();
        } catch (err) {
          console.error('[bizStore] listener error', err);
        }
      });
    });
  }
}

export const bizStore = new BizStore();
