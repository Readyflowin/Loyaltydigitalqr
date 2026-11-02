/**
 * Types for Loyalty Engine, QR Studio & Customer CRM.
 * Scoped to active business workspaces.
 */

export type LoyaltyProgramType = 'stamp_card' | 'visit_reward' | 'points_program';

export type LoyaltyProgramStatus = 'active' | 'paused';

/** Whether a contact field is collected on the self sign-up form, and if it is mandatory. */
export type EnrollmentFieldRule = 'required' | 'optional' | 'off';

/**
 * Which contact details the business owner asks customers for when they join
 * via the counter QR code. Name is always required. At least one of mobile or
 * email must be 'required' (enforced in the editor and on self sign-up).
 */
export interface EnrollmentConfig {
  mobile: EnrollmentFieldRule;
  email: EnrollmentFieldRule;
}

export const DEFAULT_ENROLLMENT: EnrollmentConfig = { mobile: 'required', email: 'optional' };

export interface LoyaltyProgramConfig {
  id: string;
  businessId: string;
  name: string;
  type: LoyaltyProgramType;
  stampsRequired: number; // 5, 6, 8, 10, or 12
  rewardDescription: string;
  rewardExpiry?: string; // e.g. "Never expires"
  terms?: string;
  accentColor: string;
  status: LoyaltyProgramStatus;
  /** Contact fields the self sign-up form collects. Falls back to DEFAULT_ENROLLMENT. */
  enrollment?: EnrollmentConfig;
  createdAt: string;
  updatedAt: string;
}

export type StampRequestStatus = 'pending' | 'approved' | 'declined';

/**
 * A customer standing at the counter asking for a stamp. Created (unauthenticated)
 * from the customer's live card page and resolved by a staff member in the dashboard.
 * Lives at businesses/{bizId}/stampRequests/{id}; the id is unguessable so the
 * customer can watch their own request without being able to list others'.
 */
export interface StampRequest {
  id: string;
  businessId: string;
  memberId: string; // the customer's id (also their memberCard id)
  customerName: string;
  status: StampRequestStatus;
  source: 'qr_scan' | 'button';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** Set when approved: the stamp balance after the stamp landed, and whether it unlocked a reward. */
  resultBalance?: number;
  rewardUnlocked?: boolean;
}

export type CustomerStatus = 'active' | 'archived';

export interface CustomerReward {
  id: string;
  rewardDescription: string;
  unlockedAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedByStaff?: string;
  voucherCode: string;
}

export interface CustomerRecord {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  enrolledAt: string;
  lastVisitAt?: string;
  totalVisits: number;
  currentStamps: number; // progress towards next reward (0 to stampsRequired - 1)
  lifetimeStamps: number;
  rewards: CustomerReward[];
  status: CustomerStatus;
  notes?: string;
  marketingConsent?: {
    email: boolean;
    sms: boolean;
    consentDate?: string;
  };
}

export type LoyaltyEventType =
  | 'stamp_issued'
  | 'reward_unlocked'
  | 'reward_redeemed'
  | 'customer_enrolled'
  | 'program_updated';

export interface LoyaltyEvent {
  id: string;
  businessId: string;
  locationId?: string;
  customerId?: string;
  customerName?: string;
  programId?: string;
  type: LoyaltyEventType;
  timestamp: string;
  staffIdentifier: string; // e.g. "Counter PIN 4821" or "Alex Merchant"
  stampsIssued?: number;
  rewardDescription?: string;
  voucherCode?: string;
  idempotencyKey?: string;
  details: string;
}

export type QrDestinationType =
  | 'loyalty_enrollment' // e.g. Customer digital wallet enrollment page
  | 'business_landing'   // e.g. Storefront homepage or industry landing
  | 'counter_display';   // e.g. Counter QR standee / info sheet

export interface QrCodeDefinition {
  id: string;
  businessId: string;
  locationId?: string;
  name: string;
  displayLabel?: string;
  destinationType: QrDestinationType;
  targetUrl: string;
  previewUrl: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}
