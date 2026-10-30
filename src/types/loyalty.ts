/**
 * Types for Task 4: Loyalty Engine, QR Studio & Customer CRM
 * Scoped to active business workspaces and prepared for Firebase migration in Task 10.
 */

export type LoyaltyProgramType = 'stamp_card' | 'visit_reward' | 'points_program';

export type LoyaltyProgramStatus = 'active' | 'paused';

export interface LoyaltyProgramConfig {
  id: string;
  businessId: string;
  name: string;
  type: LoyaltyProgramType;
  stampsRequired: number; // 5, 6, 8, 10, or 12
  rewardDescription: string;
  terms?: string;
  accentColor: string;
  status: LoyaltyProgramStatus;
  createdAt: string;
  updatedAt: string;
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
