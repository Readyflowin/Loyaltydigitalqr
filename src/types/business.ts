import type { BusinessType, OperatingRegion } from './onboarding';
import type { TeamRole } from './growth';

export interface SocialLinksConfig {
  googleReviewEnabled: boolean;
  googleReviewUrl: string;
  instagramEnabled: boolean;
  instagramHandleOrUrl: string;
  tiktokEnabled: boolean;
  tiktokHandleOrUrl: string;
  thankYouScreensCount: number;
  googleTaps: number;
  instagramTaps: number;
  tiktokTaps: number;
}

export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  isPrimary: boolean;
  staffPin: string;
}

export interface Business {
  id: string;
  name: string;
  businessType: BusinessType;
  region: OperatingRegion;
  country?: string;
  currency: 'USD' | 'INR' | string;
  currencySymbol: '$' | '₹' | string;
  planName: string;
  planPrice: string;
  accentColor: string;
  logoInitial: string;
  logoUrl?: string | null;
  rewardExpiry?: string; // e.g. "Never expires", "Expires in 30 days"
  socialLinks?: SocialLinksConfig;
  timeZone: string;
  contactEmail: string;
  phoneNumber?: string;
  locations: BusinessLocation[];
  activeLocationId: string;
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  selectedModules: string[];
  /** Unique public URL slug (menu, booking, catalogue and loyalty card links). */
  slug: string;
  createdAt: string;
  /** End of the free trial (createdAt + 30 days). Billing is not automated yet. */
  trialEndsAt: string;
  /**
   * Set by the master-admin console. 'revoked' locks the owner out of the
   * workspace. Absent on older documents — treated as active (see the gate in
   * DashboardPage). Only ever written server-side via the Admin SDK.
   */
  subscriptionStatus?: 'trial' | 'active' | 'revoked';
  /** Present only on member-visible documents (never on public profiles). */
  ownerUid?: string;
  memberUids?: string[];
  members?: Record<string, BusinessMemberInfo>;
  /** True when this object is the public profile seen by a visitor. */
  isPublicProfile?: boolean;
}

export interface BusinessMemberInfo {
  role: TeamRole;
  email: string;
  displayName: string;
  joinedAt: string;
}

export interface BusinessInvite {
  email: string;
  role: TeamRole;
  businessId: string;
  businessName: string;
  invitedByUid: string;
  invitedByName: string;
  invitedAt: string;
}

export interface BusinessMetrics {
  totalCustomers: number;
  loyaltyVisits: number;
  rewardsRedeemed: number;
  repeatRate: number; // e.g. 68%
  activeStamps: number;
}

export interface BusinessActivity {
  id: string;
  type: 'customer_joined' | 'stamp_added' | 'reward_unlocked' | 'pin_verified' | 'offer_redeemed';
  title: string;
  subtitle: string;
  timeAgo: string;
  badge?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  targetView: string;
}

export interface BusinessNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
}
