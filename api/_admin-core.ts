/**
 * Framework-agnostic core for the master-admin API. Used by both the Vercel
 * serverless function (api/admin.ts, production) and the Vite dev-server
 * middleware (vite.config.ts, local `npm run dev`), exactly like _r2-upload.ts.
 *
 * Security model
 *   - The admin username/password and the JWT signing secret live ONLY on the
 *     server (no VITE_ prefix), so they are never shipped to the browser. The
 *     "secret slug" that opens the console is just obscurity; this credential
 *     check is the real gate.
 *   - On a correct login we mint a short-lived HS256 session token (jose). Every
 *     other action must present it as `Authorization: Bearer <token>`.
 *   - Reads/writes across all businesses go through the Firebase Admin SDK
 *     (service account), which bypasses Firestore rules — the only way to list
 *     every business, since the client SDK is restricted to a user's own.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Firestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Firebase Admin SDK bootstrap
//
// The master dashboard must read EVERY business, which the client SDK can never
// do — Firestore rules only return a business document to its own members. The
// Admin SDK runs with a service account and bypasses those rules, so it lives
// only here on the server and is reached exclusively through this authenticated
// endpoint. Credentials come from server-only env vars (no VITE_ prefix):
//   FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL,
//   FIREBASE_PRIVATE_KEY (the multi-line key; "\n" escapes are un-escaped).
// ---------------------------------------------------------------------------

export interface ServiceAccountEnv {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function readServiceAccount(src: Record<string, string | undefined>): ServiceAccountEnv | null {
  const projectId = src.FIREBASE_PROJECT_ID || src.VITE_FIREBASE_PROJECT_ID || '';
  const clientEmail = src.FIREBASE_CLIENT_EMAIL || '';
  let privateKey = src.FIREBASE_PRIVATE_KEY || '';
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

type AdminFirestore = typeof import('firebase-admin/firestore');

let cached: { db: Firestore; AggregateField: AdminFirestore['AggregateField'] } | null = null;

/**
 * Loads firebase-admin lazily, only when a data action actually needs it.
 * firebase-admin is a heavy CommonJS package; importing it at module load
 * crashes this ESM serverless function on Vercel's Node runtime, which would
 * break even the (Firebase-free) login. Deferring the import here keeps login
 * and module evaluation clean, and any load/credential failure is caught and
 * reported as JSON rather than an opaque 500.
 */
async function getAdmin(sa: ServiceAccountEnv) {
  if (cached) return cached;
  const [{ cert, getApps, initializeApp }, { getFirestore, AggregateField }] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/firestore'),
  ]);
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId: sa.projectId, clientEmail: sa.clientEmail, privateKey: sa.privateKey }),
      });
  cached = { db: getFirestore(app), AggregateField };
  return cached;
}

export interface AdminEnv {
  username: string;
  password: string;
  jwtSecret: string;
  serviceAccount: ServiceAccountEnv | null;
}

export interface AdminResult {
  status: number;
  body: Record<string, unknown>;
}

/** Reads admin config from an env map. Returns null if the core secrets are unset. */
export function readAdminEnv(src: Record<string, string | undefined>): AdminEnv | null {
  const username = src.ADMIN_USERNAME || '';
  const password = src.ADMIN_PASSWORD || '';
  const jwtSecret = src.ADMIN_JWT_SECRET || '';
  if (!username || !password || !jwtSecret) return null;
  return { username, password, jwtSecret, serviceAccount: readServiceAccount(src) };
}

/** Constant-time string compare (hash first so length never leaks or throws). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function secretKey(env: AdminEnv): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret);
}

async function signSession(env: AdminEnv): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(env.username)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey(env));
}

async function verifySession(env: AdminEnv, authHeader: string): Promise<boolean> {
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(env));
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Revenue aggregation
// ---------------------------------------------------------------------------

/**
 * Transaction-volume revenue a business has run through the platform, in minor
 * currency units. Summed server-side with aggregation queries (no document
 * downloads). Collections that don't exist for a module simply return 0.
 */
const REVENUE_SOURCES: Array<{ collection: string; field: string; status?: string }> = [
  { collection: 'orders', field: 'total' },
  { collection: 'appointments', field: 'price', status: 'completed' },
  { collection: 'retailPurchases', field: 'total' },
  { collection: 'carwashVisits', field: 'pricePaidMinor' },
  { collection: 'serviceJobs', field: 'amountCharged', status: 'completed' },
  { collection: 'gymMembers', field: 'pricePaidMinor' },
];

async function sumCollection(
  db: Firestore,
  AggregateField: AdminFirestore['AggregateField'],
  businessId: string,
  source: { collection: string; field: string; status?: string }
): Promise<number> {
  try {
    const base = db.collection('businesses').doc(businessId).collection(source.collection);
    const query = source.status ? base.where('status', '==', source.status) : base;
    const snap = await query.aggregate({ total: AggregateField.sum(source.field) }).get();
    const total = snap.data().total;
    return typeof total === 'number' && Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

async function countCustomers(db: Firestore, businessId: string): Promise<number> {
  try {
    const snap = await db
      .collection('businesses')
      .doc(businessId)
      .collection('customers')
      .count()
      .get();
    return snap.data().count || 0;
  } catch {
    return 0;
  }
}

interface AdminSocialLinks {
  googleReviewEnabled: boolean;
  googleReviewUrl: string;
  instagramEnabled: boolean;
  instagramHandleOrUrl: string;
  tiktokEnabled: boolean;
  tiktokHandleOrUrl: string;
}

interface AdminLocation {
  name: string;
  address: string;
  isPrimary: boolean;
}

interface BusinessRow {
  id: string;
  name: string;
  ownerEmail: string;
  region: string;
  country: string;
  businessType: string;
  planName: string;
  planPrice: string;
  subscriptionStatus: 'trial' | 'active' | 'revoked';
  currency: string;
  currencySymbol: string;
  slug: string;
  phoneNumber: string;
  createdAt: string;
  trialEndsAt: string;
  memberCount: number;
  customerCount: number;
  revenueMinor: number;
  socialLinks: AdminSocialLinks;
  locations: AdminLocation[];
}

function resolveSubscriptionStatus(data: Record<string, unknown>): 'trial' | 'active' | 'revoked' {
  const raw = data.subscriptionStatus;
  if (raw === 'revoked' || raw === 'active' || raw === 'trial') return raw;
  // No explicit status yet: infer from the trial window, else treat as active.
  const trialEndsAt = typeof data.trialEndsAt === 'string' ? Date.parse(data.trialEndsAt) : NaN;
  if (!Number.isNaN(trialEndsAt) && trialEndsAt > Date.now()) return 'trial';
  return 'active';
}

async function listBusinesses(
  db: Firestore,
  AggregateField: AdminFirestore['AggregateField']
): Promise<BusinessRow[]> {
  const snap = await db.collection('businesses').get();

  const rows = await Promise.all(
    snap.docs.map(async (doc): Promise<BusinessRow> => {
      const data = doc.data() as Record<string, unknown>;
      const ownerUid = typeof data.ownerUid === 'string' ? data.ownerUid : '';
      const members = (data.members as Record<string, { email?: string }> | undefined) || {};
      const ownerEmail =
        (ownerUid && members[ownerUid]?.email) ||
        (typeof data.contactEmail === 'string' ? data.contactEmail : '') ||
        '';

      const [sums, customerCount] = await Promise.all([
        Promise.all(REVENUE_SOURCES.map((s) => sumCollection(db, AggregateField, doc.id, s))),
        countCustomers(db, doc.id),
      ]);
      const revenueMinor = sums.reduce((a, b) => a + b, 0);

      const social = (data.socialLinks as Record<string, unknown> | undefined) || {};
      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      const socialLinks: AdminSocialLinks = {
        googleReviewEnabled: !!social.googleReviewEnabled,
        googleReviewUrl: str(social.googleReviewUrl),
        instagramEnabled: !!social.instagramEnabled,
        instagramHandleOrUrl: str(social.instagramHandleOrUrl),
        tiktokEnabled: !!social.tiktokEnabled,
        tiktokHandleOrUrl: str(social.tiktokHandleOrUrl),
      };
      // Locations identify who the business is; drop the staff PIN (sensitive).
      const locations: AdminLocation[] = Array.isArray(data.locations)
        ? (data.locations as Array<Record<string, unknown>>).map((l) => ({
            name: str(l.name),
            address: str(l.address),
            isPrimary: !!l.isPrimary,
          }))
        : [];

      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : '(unnamed)',
        ownerEmail,
        region: typeof data.region === 'string' ? data.region : '',
        country: str(data.country),
        businessType: typeof data.businessType === 'string' ? data.businessType : '',
        planName: typeof data.planName === 'string' ? data.planName : '',
        planPrice: typeof data.planPrice === 'string' ? data.planPrice : '',
        subscriptionStatus: resolveSubscriptionStatus(data),
        currency: typeof data.currency === 'string' ? data.currency : 'USD',
        currencySymbol: typeof data.currencySymbol === 'string' ? data.currencySymbol : '$',
        slug: typeof data.slug === 'string' ? data.slug : '',
        phoneNumber: str(data.phoneNumber),
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
        trialEndsAt: typeof data.trialEndsAt === 'string' ? data.trialEndsAt : '',
        memberCount: Array.isArray(data.memberUids) ? data.memberUids.length : 0,
        customerCount,
        revenueMinor,
        socialLinks,
        locations,
      };
    })
  );

  rows.sort((a, b) => b.revenueMinor - a.revenueMinor);
  return rows;
}

// ---------------------------------------------------------------------------
// Site config (editable homepage hero)
// ---------------------------------------------------------------------------

const SITE_CONFIG_DOC = ['siteConfig', 'home'] as const;

interface HeroConfig {
  eyebrow: string;
  headline: string; // may contain line breaks (\n)
  highlight: string; // the coloured / underlined phrase shown under the headline
  paragraph: string;
}

function sanitizeHero(input: unknown): HeroConfig {
  const h = (input || {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  return {
    eyebrow: str(h.eyebrow, 80),
    headline: str(h.headline, 200),
    highlight: str(h.highlight, 80),
    paragraph: str(h.paragraph, 400),
  };
}

async function getSiteConfig(db: Firestore): Promise<Record<string, unknown>> {
  const snap = await db.collection(SITE_CONFIG_DOC[0]).doc(SITE_CONFIG_DOC[1]).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

export async function handleAdminRequest(opts: {
  env: AdminEnv;
  action: string;
  body: Record<string, unknown>;
  authHeader: string;
}): Promise<AdminResult> {
  const { env, action, body, authHeader } = opts;

  // Login is the only unauthenticated action.
  if (action === 'login') {
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const ok = safeEqual(username, env.username) && safeEqual(password, env.password);
    if (!ok) return { status: 401, body: { error: 'Invalid username or password' } };
    return { status: 200, body: { token: await signSession(env) } };
  }

  // Everything below requires a valid session.
  if (!(await verifySession(env, authHeader))) {
    return { status: 401, body: { error: 'Not authorized' } };
  }

  // Data actions need the Admin SDK (service account).
  if (!env.serviceAccount) {
    return {
      status: 500,
      body: {
        error:
          'Server is missing the Firebase service account (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / FIREBASE_PROJECT_ID).',
      },
    };
  }
  try {
    const { db, AggregateField } = await getAdmin(env.serviceAccount);

    switch (action) {
      case 'businesses': {
        const businesses = await listBusinesses(db, AggregateField);
        return { status: 200, body: { businesses } };
      }

      case 'setSubscription': {
        const businessId = typeof body.businessId === 'string' ? body.businessId : '';
        const status = body.status;
        if (!businessId || (status !== 'active' && status !== 'revoked')) {
          return { status: 400, body: { error: 'businessId and status (active|revoked) are required' } };
        }
        const ref = db.collection('businesses').doc(businessId);
        const exists = (await ref.get()).exists;
        if (!exists) return { status: 404, body: { error: 'Business not found' } };
        await ref.update({ subscriptionStatus: status });
        return { status: 200, body: { businessId, subscriptionStatus: status } };
      }

      case 'getSiteConfig': {
        return { status: 200, body: { config: await getSiteConfig(db) } };
      }

      case 'setSiteConfig': {
        const hero = sanitizeHero(body.hero);
        await db
          .collection(SITE_CONFIG_DOC[0])
          .doc(SITE_CONFIG_DOC[1])
          .set({ hero, updatedAt: new Date().toISOString() }, { merge: true });
        return { status: 200, body: { config: { hero } } };
      }

      default:
        return { status: 400, body: { error: `Unknown action: ${action}` } };
    }
  } catch (err) {
    // Surface the real cause (bad service-account key, firebase-admin load
    // failure, Firestore error) instead of an opaque platform 500.
    return { status: 500, body: { error: `Admin SDK error: ${err instanceof Error ? err.message : String(err)}` } };
  }
}
