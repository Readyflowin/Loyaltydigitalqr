/**
 * Business workspaces, membership and public profiles (Firestore).
 *
 *   businesses/{businessId}                 private: members only (rules)
 *   businesses/{businessId}/invites/{email} pending team invites
 *   publicProfiles/{businessId}             public: name, colours, locations (no PINs)
 *   slugs/{slug}                            public: slug -> businessId (unique)
 *
 * A signed-in user only ever loads businesses whose memberUids contain their
 * uid. Visitors (menu, booking, catalogue, loyalty card, tracking pages) only
 * load the public profile of the one business they are viewing.
 */

import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayRemove,
  arrayUnion,
  deleteField,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { bizStore } from '../lib/bizStore';
import { newId, randomString } from '../lib/ids';
import { authService } from './authService';
import { loyaltyService } from './loyaltyService';
import type {
  Business,
  BusinessLocation,
  BusinessMetrics,
  BusinessActivity,
  ChecklistItem,
  BusinessNotification,
  BusinessInvite,
  BusinessMemberInfo,
  SocialLinksConfig,
} from '../types/business';
import type { OnboardingData } from '../types/onboarding';
import type { TeamRole } from '../types/growth';
import { generateBusinessSlug } from '../utils/qrUrlBuilder';

const ACTIVE_BIZ_KEY = 'loyalty_active_business_id';
const ACTIVE_LOCATIONS_KEY = 'loyalty_active_locations_map';
const TRIAL_DAYS = 30;

export type BusinessLoadState = 'idle' | 'loading' | 'ready' | 'error';

/** Fields copied to publicProfiles/{id}. Never add PINs, emails or member data here. */
function toPublicProfile(biz: Business): Record<string, unknown> {
  return {
    id: biz.id,
    slug: biz.slug,
    name: biz.name,
    businessType: biz.businessType,
    region: biz.region,
    country: biz.country || (biz.region === 'india' ? 'India' : 'United States'),
    currency: biz.currency,
    currencySymbol: biz.currencySymbol,
    accentColor: biz.accentColor,
    logoInitial: biz.logoInitial,
    logoUrl: (biz as Business & { logoUrl?: string }).logoUrl || null,
    rewardExpiry: biz.rewardExpiry || 'Never expires',
    socialLinks: biz.socialLinks || {
      googleReviewEnabled: false,
      googleReviewUrl: '',
      instagramEnabled: false,
      instagramHandleOrUrl: '',
      tiktokEnabled: false,
      tiktokHandleOrUrl: '',
      thankYouScreensCount: 0,
      googleTaps: 0,
      instagramTaps: 0,
      tiktokTaps: 0,
    },
    timeZone: biz.timeZone,
    phoneNumber: biz.phoneNumber || null,
    locations: biz.locations.map((l) => ({ id: l.id, name: l.name, address: l.address, isPrimary: l.isPrimary })),
    programName: biz.programName,
    stampsRequired: biz.stampsRequired,
    rewardDescription: biz.rewardDescription,
    selectedModules: biz.selectedModules,
  };
}

function profileToBusiness(data: Record<string, unknown>): Business {
  const locations = ((data.locations as BusinessLocation[]) || []).map((l) => ({ ...l, staffPin: '' }));
  return {
    ...(data as unknown as Business),
    locations,
    activeLocationId: locations[0]?.id || '',
    planName: '',
    planPrice: '',
    contactEmail: '',
    createdAt: '',
    trialEndsAt: '',
    isPublicProfile: true,
  };
}

function randomPin(): string {
  return randomString(4, '0123456789');
}

class BusinessService {
  private listeners: (() => void)[] = [];
  private memberBusinesses: Business[] = [];
  private publicProfiles = new Map<string, Business>();
  private slugToId = new Map<string, string>();
  private loadState: BusinessLoadState = 'idle';
  private loadError: string | null = null;
  private unsubBusinesses: Unsubscribe | null = null;
  private pendingInvites: BusinessInvite[] = [];
  private currentUid: string | null = null;

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
    authService.subscribe((user) => this.handleAuthChange(user?.id || null));
  }

  // ---------------------------------------------------------------------------
  // Session wiring
  // ---------------------------------------------------------------------------

  /** Called once after auth init and on every sign-in / sign-out. */
  handleAuthChange(uid: string | null): void {
    if (uid === this.currentUid) return;
    this.currentUid = uid;

    this.unsubBusinesses?.();
    this.unsubBusinesses = null;
    this.memberBusinesses = [];
    this.pendingInvites = [];
    for (const id of bizStore.attachedIds()) {
      if (bizStore.getMode(id) === 'member') bizStore.detach(id);
    }

    if (!uid) {
      this.loadState = 'idle';
      this.notifyListeners();
      return;
    }

    this.loadState = 'loading';
    this.loadError = null;
    this.notifyListeners();

    this.unsubBusinesses = onSnapshot(
      query(collection(db, 'businesses'), where('memberUids', 'array-contains', uid)),
      (snap) => {
        this.memberBusinesses = snap.docs
          .map((d) => ({ ...(d.data() as Business), id: d.id }))
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        this.loadState = 'ready';
        this.attachActive();
        this.notifyListeners();
      },
      (err) => {
        console.error('Failed to load businesses', err);
        this.loadState = 'error';
        this.loadError = err.message;
        this.notifyListeners();
      }
    );

    void this.refreshInvites();
  }

  getLoadState(): BusinessLoadState {
    return this.loadState;
  }

  getLoadError(): string | null {
    return this.loadError;
  }

  /** Keep exactly the active business attached as a member. */
  private attachActive(): void {
    const active = this.getActiveBusiness();
    for (const id of bizStore.attachedIds()) {
      if (bizStore.getMode(id) === 'member' && id !== active?.id) bizStore.detach(id);
    }
    if (active) bizStore.attach(active.id, 'member');
  }

  // ---------------------------------------------------------------------------
  // Member businesses
  // ---------------------------------------------------------------------------

  /** Businesses the signed-in user belongs to. */
  getAllBusinesses(): Business[] {
    const saved = this.getSavedLocationsMap();
    return this.memberBusinesses.map((b) => ({
      ...b,
      activeLocationId:
        (saved[b.id] && b.locations.some((l) => l.id === saved[b.id]) ? saved[b.id] : b.locations[0]?.id) || '',
    }));
  }

  /** Member business or (for visitors) the loaded public profile. */
  getBusinessById(id: string): Business | undefined {
    return this.getAllBusinesses().find((b) => b.id === id) || this.publicProfiles.get(id);
  }

  /** Resolve a slug against loaded businesses / public profiles (sync). */
  findBusinessBySlug(slugOrId: string): Business | undefined {
    const target = slugOrId.toLowerCase().trim();
    const id = this.slugToId.get(target);
    if (id) return this.getBusinessById(id);
    return (
      this.getAllBusinesses().find((b) => b.id === slugOrId || b.slug === target) ||
      [...this.publicProfiles.values()].find((b) => b.id === slugOrId || b.slug === target)
    );
  }

  hasBusinesses(): boolean {
    return this.memberBusinesses.length > 0;
  }

  getActiveBusiness(): Business | null {
    const businesses = this.getAllBusinesses();
    if (businesses.length === 0) return null;
    let activeId: string | null = null;
    try {
      activeId = localStorage.getItem(ACTIVE_BIZ_KEY);
    } catch {
      activeId = null;
    }
    return businesses.find((b) => b.id === activeId) || businesses[0];
  }

  setActiveBusiness(businessId: string): void {
    try {
      localStorage.setItem(ACTIVE_BIZ_KEY, businessId);
    } catch {
      // ignore
    }
    this.attachActive();
    this.notifyListeners();
  }

  private getSavedLocationsMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(ACTIVE_LOCATIONS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  setActiveLocation(businessId: string, locationId: string): void {
    const saved = this.getSavedLocationsMap();
    saved[businessId] = locationId;
    try {
      localStorage.setItem(ACTIVE_LOCATIONS_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  getMyRole(businessId: string): TeamRole | null {
    const uid = this.currentUid;
    if (!uid) return null;
    const biz = this.memberBusinesses.find((b) => b.id === businessId);
    return biz?.members?.[uid]?.role || null;
  }

  // ---------------------------------------------------------------------------
  // Creation (end of onboarding)
  // ---------------------------------------------------------------------------

  private async reserveSlug(baseName: string, businessId: string): Promise<string> {
    const base = generateBusinessSlug(baseName).slice(0, 40) || 'business';
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = attempt === 0 ? base : `${base}-${randomString(4)}`;
      const ref = doc(db, 'slugs', candidate);
      const taken = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) return true;
        tx.set(ref, { businessId });
        return false;
      });
      if (!taken) return candidate;
    }
    throw new Error('Could not reserve a unique link for this business name. Please try a slightly different name.');
  }

  async createBusiness(data: OnboardingData): Promise<Business> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Please sign in before creating a business.');

    await authService.ensureFreshToken();
    const businessId = newId();
    const name = data.businessName.trim();
    const isIndia = data.region === 'india' || data.country?.toLowerCase() === 'india';
    const currency = data.currency || (isIndia ? 'INR' : 'USD');
    const currencySymbol = data.currencySymbol || (currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$');
    const country = data.country || (isIndia ? 'India' : 'United States');
    const now = new Date();
    const createdAt = now.toISOString();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86400000).toISOString();

    // Business doc first (owner membership), then the slug that points at it.
    const slugPlaceholder = '';
    const member: BusinessMemberInfo = {
      role: 'owner',
      email: user.email,
      displayName: data.displayName?.trim() || user.displayName,
      joinedAt: createdAt,
    };

    const initialSocialLinks: SocialLinksConfig = {
      googleReviewEnabled: false,
      googleReviewUrl: '',
      instagramEnabled: false,
      instagramHandleOrUrl: '',
      tiktokEnabled: false,
      tiktokHandleOrUrl: '',
      thankYouScreensCount: 0,
      googleTaps: 0,
      instagramTaps: 0,
      tiktokTaps: 0,
    };

    const business: Business = {
      id: businessId,
      name,
      slug: slugPlaceholder,
      businessType: data.businessType,
      region: data.region,
      country,
      currency,
      currencySymbol,
      planName: 'Starter',
      planPrice: isIndia ? '₹99/mo' : '$10/mo',
      accentColor: data.accentColor || '#3027F5',
      logoInitial: name.charAt(0).toUpperCase() || 'B',
      logoUrl: data.logoUrl || null,
      rewardExpiry: data.rewardExpiry || 'Never expires',
      socialLinks: initialSocialLinks,
      timeZone: data.timeZone,
      contactEmail: data.contactEmail.trim(),
      phoneNumber: data.phoneNumber?.trim() || undefined,
      locations: [
        {
          id: `loc_${randomString(8)}`,
          name: 'Main Location',
          address: data.address?.trim() || '',
          isPrimary: true,
          staffPin: randomPin(),
        },
      ],
      activeLocationId: '',
      programName: data.programName.trim(),
      stampsRequired: data.stampsRequired,
      rewardDescription: data.rewardDescription.trim(),
      selectedModules: data.selectedModules,
      createdAt,
      trialEndsAt,
      ownerUid: user.id,
      memberUids: [user.id],
      members: { [user.id]: member },
    };

    const { activeLocationId: _ignored, ...stored } = business;
    void _ignored;
    await setDoc(doc(db, 'businesses', businessId), JSON.parse(JSON.stringify(stored)));

    const slug = await this.reserveSlug(name, businessId);
    business.slug = slug;
    await updateDoc(doc(db, 'businesses', businessId), { slug });
    await setDoc(doc(db, 'publicProfiles', businessId), toPublicProfile(business));

    await setDoc(doc(db, 'businesses', businessId, 'config', 'loyaltyProgram'), {
      id: `prog_${businessId}`,
      businessId,
      name: business.programName,
      type: 'stamp_card',
      stampsRequired: business.stampsRequired,
      rewardDescription: business.rewardDescription,
      rewardExpiry: business.rewardExpiry || 'Never expires',
      terms: 'Not redeemable for cash. One stamp per qualifying visit.',
      accentColor: business.accentColor,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });

    try {
      localStorage.setItem(ACTIVE_BIZ_KEY, businessId);
    } catch {
      // ignore
    }
    authService.clearOnboardingDraft();
    return business;
  }

  // ---------------------------------------------------------------------------
  // Settings updates (owner / manager)
  // ---------------------------------------------------------------------------

  async updateBusiness(
    businessId: string,
    patch: Partial<
      Pick<
        Business,
        | 'name'
        | 'accentColor'
        | 'timeZone'
        | 'contactEmail'
        | 'phoneNumber'
        | 'locations'
        | 'programName'
        | 'stampsRequired'
        | 'rewardDescription'
        | 'selectedModules'
        | 'rewardExpiry'
        | 'socialLinks'
      > & { logoUrl?: string | null }
    >
  ): Promise<void> {
    const current = this.memberBusinesses.find((b) => b.id === businessId);
    if (!current) throw new Error('Business not found.');

    for (const loc of patch.locations || []) {
      if (!/^\d{4,6}$/.test(loc.staffPin)) throw new Error(`Staff PIN for "${loc.name}" must be 4 to 6 digits.`);
      if (!loc.name.trim()) throw new Error('Every location needs a name.');
    }

    const update: Record<string, unknown> = JSON.parse(JSON.stringify(patch));
    if (patch.name) update.logoInitial = patch.name.trim().charAt(0).toUpperCase();
    await updateDoc(doc(db, 'businesses', businessId), update);

    const next = { ...current, ...patch, ...(update.logoInitial ? { logoInitial: update.logoInitial as string } : {}) } as Business;
    await setDoc(doc(db, 'publicProfiles', businessId), toPublicProfile(next));
  }

  // ---------------------------------------------------------------------------
  // Social links & click tracking
  // ---------------------------------------------------------------------------

  getSocialLinks(businessId: string): SocialLinksConfig {
    const biz = this.getBusinessById(businessId) || this.findBusinessBySlug(businessId);
    if (biz?.socialLinks) return biz.socialLinks;
    const key = `social_links_${businessId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      googleReviewEnabled: false,
      googleReviewUrl: '',
      instagramEnabled: false,
      instagramHandleOrUrl: '',
      tiktokEnabled: false,
      tiktokHandleOrUrl: '',
      thankYouScreensCount: 0,
      googleTaps: 0,
      instagramTaps: 0,
      tiktokTaps: 0,
    };
  }

  async updateSocialLinks(businessId: string, patch: Partial<SocialLinksConfig>): Promise<void> {
    const current = this.getSocialLinks(businessId);
    const updated: SocialLinksConfig = { ...current, ...patch };
    const key = `social_links_${businessId}`;
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const biz = this.memberBusinesses.find((b) => b.id === businessId) || this.getBusinessById(businessId);
    if (biz) {
      biz.socialLinks = updated;
      try {
        await updateDoc(doc(db, 'businesses', businessId), { socialLinks: updated });
        await setDoc(doc(db, 'publicProfiles', businessId), toPublicProfile(biz));
      } catch {
        // offline or mock
      }
      this.notifyListeners();
    }
  }

  /**
   * Record one tap on a social/review button, or one thank-you screen view.
   *
   * Counts live in per-platform counter documents
   * (businesses/{id}/socialTaps/{platform}) because the people who generate
   * these taps are signed-out customers on the public loyalty card — they are
   * not members of the business, so Firestore rules reject any write to the
   * business or public-profile document. The rules do allow a public +1 on
   * these counter docs only. FieldValue.increment is also atomic, so two
   * simultaneous taps are never lost (a full-object overwrite would clobber one).
   */
  async recordSocialTap(businessId: string, platform: 'google' | 'instagram' | 'tiktok' | 'thank_you'): Promise<void> {
    const docId = platform === 'thank_you' ? 'thankYou' : platform;
    try {
      await setDoc(
        doc(db, 'businesses', businessId, 'socialTaps', docId),
        { count: increment(1) },
        { merge: true }
      );
    } catch {
      // Offline or blocked — taps are best-effort analytics, never block the UI.
    }
  }

  /** Live per-platform tap counters (lifetime totals). */
  watchSocialTaps(
    businessId: string,
    cb: (counts: { google: number; instagram: number; tiktok: number; thankYou: number }) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'businesses', businessId, 'socialTaps'),
      (snap) => {
        const counts = { google: 0, instagram: 0, tiktok: 0, thankYou: 0 };
        snap.forEach((d) => {
          const n = (d.data() as { count?: number }).count || 0;
          if (d.id in counts) counts[d.id as keyof typeof counts] = n;
        });
        cb(counts);
      },
      () => cb({ google: 0, instagram: 0, tiktok: 0, thankYou: 0 })
    );
  }

  // ---------------------------------------------------------------------------
  // Team: real members + pending invites
  // ---------------------------------------------------------------------------

  getMembers(businessId: string): Array<BusinessMemberInfo & { uid: string }> {
    const biz = this.memberBusinesses.find((b) => b.id === businessId);
    return Object.entries(biz?.members || {}).map(([uid, info]) => ({ uid, ...info }));
  }

  async listInvites(businessId: string): Promise<BusinessInvite[]> {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'invites'));
    return snap.docs.map((d) => d.data() as BusinessInvite);
  }

  async inviteMember(businessId: string, email: string, role: TeamRole): Promise<void> {
    const user = authService.getCurrentUser();
    const biz = this.memberBusinesses.find((b) => b.id === businessId);
    if (!user || !biz) throw new Error('Business not found.');
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Please enter a valid email address.');
    if (role === 'owner') throw new Error('Ownership cannot be granted by invite.');
    if (Object.values(biz.members || {}).some((m) => m.email.toLowerCase() === clean)) {
      throw new Error('This person is already a member of the team.');
    }
    const invite: BusinessInvite = {
      email: clean,
      role,
      businessId,
      businessName: biz.name,
      invitedByUid: user.id,
      invitedByName: user.displayName,
      invitedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'businesses', businessId, 'invites', clean), invite);
  }

  async revokeInvite(businessId: string, email: string): Promise<void> {
    await deleteDoc(doc(db, 'businesses', businessId, 'invites', email.trim().toLowerCase()));
  }

  async updateMemberRole(businessId: string, uid: string, role: TeamRole): Promise<void> {
    const biz = this.memberBusinesses.find((b) => b.id === businessId);
    if (!biz) throw new Error('Business not found.');
    if (uid === biz.ownerUid) throw new Error("The owner's role cannot be changed.");
    if (role === 'owner') throw new Error('Ownership transfer is not supported from the dashboard.');
    await updateDoc(doc(db, 'businesses', businessId), { [`members.${uid}.role`]: role });
  }

  async removeMember(businessId: string, uid: string): Promise<void> {
    const biz = this.memberBusinesses.find((b) => b.id === businessId);
    if (!biz) throw new Error('Business not found.');
    if (uid === biz.ownerUid) throw new Error('The owner cannot be removed.');
    await updateDoc(doc(db, 'businesses', businessId), {
      memberUids: arrayRemove(uid),
      [`members.${uid}`]: deleteField(),
    });
  }

  /** Invites addressed to the signed-in user's email (shown on the dashboard). */
  getPendingInvites(): BusinessInvite[] {
    return this.pendingInvites;
  }

  async refreshInvites(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user?.email) {
      this.pendingInvites = [];
      return;
    }
    try {
      const snap = await getDocs(
        query(collectionGroup(db, 'invites'), where('email', '==', user.email.toLowerCase()))
      );
      this.pendingInvites = snap.docs
        .map((d) => d.data() as BusinessInvite)
        .filter((inv) => !this.memberBusinesses.some((b) => b.id === inv.businessId));
    } catch (err) {
      console.warn('Could not load invites', err);
      this.pendingInvites = [];
    }
    this.notifyListeners();
  }

  async acceptInvite(invite: BusinessInvite): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Please sign in first.');
    if (!user.emailVerified && user.email) {
      // Google accounts are verified; email/password accounts must verify first.
      throw new Error('Please verify your email address before joining a team.');
    }
    await authService.ensureFreshToken();
    const bizRef = doc(db, 'businesses', invite.businessId);
    const inviteRef = doc(db, 'businesses', invite.businessId, 'invites', invite.email);
    const member: BusinessMemberInfo = {
      role: invite.role,
      email: user.email.toLowerCase(),
      displayName: user.displayName,
      joinedAt: new Date().toISOString(),
    };
    // The invitee cannot read the business yet; rules allow appending only
    // their own uid while a matching invite exists, in the same batch that
    // consumes the invite.
    const batch = writeBatch(db);
    batch.update(bizRef, {
      memberUids: arrayUnion(user.id),
      [`members.${user.id}`]: member,
    });
    batch.delete(inviteRef);
    await batch.commit();
    this.pendingInvites = this.pendingInvites.filter((i) => i.businessId !== invite.businessId);
    this.setActiveBusiness(invite.businessId);
  }

  async declineInvite(invite: BusinessInvite): Promise<void> {
    await deleteDoc(doc(db, 'businesses', invite.businessId, 'invites', invite.email));
    this.pendingInvites = this.pendingInvites.filter((i) => i.businessId !== invite.businessId);
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Visitors: resolve a public link to a business and attach read-only
  // ---------------------------------------------------------------------------

  async loadPublicBusiness(slugOrId: string): Promise<Business | null> {
    const key = slugOrId.toLowerCase().trim();
    if (!key || key.includes('/')) return null;

    let businessId = this.slugToId.get(key) || null;
    if (!businessId) {
      const slugSnap = await getDoc(doc(db, 'slugs', key));
      if (slugSnap.exists()) {
        businessId = (slugSnap.data() as { businessId: string }).businessId;
      } else {
        businessId = slugOrId; // tracking links carry the business id directly
      }
    }

    const member = this.getAllBusinesses().find((b) => b.id === businessId);
    if (member) {
      this.slugToId.set(key, member.id);
      bizStore.attach(member.id, 'member');
      return member;
    }

    const profileSnap = await getDoc(doc(db, 'publicProfiles', businessId));
    if (!profileSnap.exists()) return null;
    const profile = profileToBusiness(profileSnap.data());
    this.publicProfiles.set(profile.id, profile);
    this.slugToId.set(key, profile.id);
    if (profile.slug) this.slugToId.set(profile.slug, profile.id);
    bizStore.attach(profile.id, 'public');
    this.notifyListeners();
    return profile;
  }

  // ---------------------------------------------------------------------------
  // Staff PIN
  // ---------------------------------------------------------------------------

  verifyStaffPin(businessId: string, pin: string, locationId?: string): boolean {
    if (!pin || typeof pin !== 'string') return false;
    const cleanPin = pin.trim();
    if (!cleanPin) return false;

    const business = this.memberBusinesses.find((b) => b.id === businessId);
    if (!business) return false;

    if (locationId) {
      const loc = business.locations.find((l) => l.id === locationId);
      if (loc && loc.staffPin) return loc.staffPin === cleanPin;
    }
    return business.locations.some((l) => l.staffPin === cleanPin);
  }

  // ---------------------------------------------------------------------------
  // Overview data (all derived from real records)
  // ---------------------------------------------------------------------------

  getMetrics(businessId: string): BusinessMetrics {
    const computed = loyaltyService.getComputedMetrics(businessId);
    return {
      totalCustomers: computed.totalCustomers,
      loyaltyVisits: computed.loyaltyVisits,
      rewardsRedeemed: computed.rewardsRedeemed,
      repeatRate: computed.repeatRate,
      activeStamps: computed.activeStamps,
    };
  }

  getActivities(businessId: string): BusinessActivity[] {
    const events = loyaltyService.getEvents(businessId, 6);
    return events.map((e) => {
      let type: BusinessActivity['type'] = 'stamp_added';
      let badge = 'Visit Stamp';
      if (e.type === 'reward_unlocked') {
        type = 'reward_unlocked';
        badge = 'Reward Ready';
      } else if (e.type === 'reward_redeemed') {
        type = 'offer_redeemed';
        badge = 'Redeemed';
      } else if (e.type === 'customer_enrolled') {
        type = 'customer_joined';
        badge = 'New Member';
      } else if (e.type === 'program_updated') {
        type = 'pin_verified';
        badge = 'Config';
      }

      return {
        id: e.id,
        type,
        title: e.details,
        subtitle: `${e.staffIdentifier || 'Counter Staff'} · ${e.customerName || 'Loyalty Member'}`,
        timeAgo: this.formatTimeAgo(e.timestamp),
        badge,
      };
    });
  }

  private formatTimeAgo(timestamp: string): string {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  /** Getting-started checklist computed from the business's actual records. */
  getChecklist(businessId: string): ChecklistItem[] {
    const biz = this.getBusinessById(businessId);
    const program = loyaltyService.getProgram(businessId);
    const customers = loyaltyService.getCustomers(businessId);
    const qrCodes = loyaltyService.getQrCodes(businessId);
    const events = loyaltyService.getEvents(businessId, 50);

    return [
      {
        id: 'check_biz_profile',
        title: 'Business profile configured',
        description: 'Name, contact details, time zone and location address.',
        isDone: !!biz && !!biz.contactEmail && biz.locations.every((l) => !!l.address),
        targetView: 'settings',
      },
      {
        id: 'check_loyalty_rule',
        title: 'Loyalty reward set up',
        description: 'Stamps required and the reward customers unlock.',
        isDone: !!program && program.status === 'active' && program.stampsRequired > 0,
        targetView: 'loyalty',
      },
      {
        id: 'check_qr_stand',
        title: 'Create your counter QR code',
        description: 'Customers scan it to join your loyalty card.',
        isDone: qrCodes.length > 0,
        targetView: 'qr-studio',
      },
      {
        id: 'check_first_member',
        title: 'Enrol your first customer',
        description: 'Add a customer at the counter or let them scan your QR code.',
        isDone: customers.length > 0,
        targetView: 'customers',
      },
      {
        id: 'check_first_stamp',
        title: 'Issue your first stamp',
        description: 'Use your staff PIN (Settings) to stamp a customer card.',
        isDone: events.some((e) => e.type === 'stamp_issued'),
        targetView: 'customers',
      },
    ];
  }

  /** Notifications derived from real state only. */
  getNotifications(businessId?: string): BusinessNotification[] {
    const out: BusinessNotification[] = [];
    const biz = businessId ? this.getBusinessById(businessId) : this.getActiveBusiness();
    if (biz?.trialEndsAt) {
      const daysLeft = Math.ceil((new Date(biz.trialEndsAt).getTime() - Date.now()) / 86400000);
      if (daysLeft <= 7) {
        out.push({
          id: 'notif_trial',
          title: daysLeft > 0 ? `Free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Free trial has ended',
          message: 'Contact us to continue on the Starter plan.',
          timeAgo: '',
          isRead: false,
        });
      }
    }
    for (const invite of this.pendingInvites) {
      out.push({
        id: `notif_invite_${invite.businessId}`,
        title: `Team invite from ${invite.businessName}`,
        message: `${invite.invitedByName} invited you as ${invite.role}.`,
        timeAgo: this.formatTimeAgo(invite.invitedAt),
        isRead: false,
      });
    }
    return out;
  }

  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }
}

export const businessService = new BusinessService();
