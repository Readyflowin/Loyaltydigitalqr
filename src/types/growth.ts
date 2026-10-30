/**
 * Growth, Campaigns, Offers, Feedback, Team Roles & Analytics Type Definitions
 * Integers are used for all monetary amounts in minor units (cents/paise).
 * All campaign delivery and invitations remain simulated/mock.
 */

export type OfferType =
  | 'percentage'
  | 'fixed_amount'
  | 'loyalty_bonus'
  | 'targeted_segment'
  | 'winback';

export type OfferStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'expired'
  | 'archived';

export interface Offer {
  id: string;
  businessId: string;
  locationId?: string; // 'all' or specific location ID
  name: string;
  description: string;
  code: string; // e.g. "WELCOME15", "WINBACK20"
  offerType: OfferType;
  discountValue: number; // percentage (e.g. 15 for 15%) or minor units (e.g. 500 for $5.00)
  minimumSpendMinor?: number; // minimum transaction spend in minor units
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetSegmentId?: string;
  perCustomerLimit: number; // e.g. 1
  totalRedemptionLimit?: number;
  redemptionCount: number;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfferRedemption {
  id: string;
  businessId: string;
  offerId: string;
  offerCode: string;
  offerName: string;
  customerId: string;
  customerName: string;
  amountSavedMinor: number;
  redeemedAt: string;
  orderOrTransactionId?: string;
}

export type SegmentCriteriaType =
  | 'all'
  | 'recent_active'
  | 'inactive_dormant'
  | 'repeat_loyal'
  | 'high_stamps'
  | 'consent_email'
  | 'consent_sms'
  | 'by_location';

export interface CustomerSegment {
  id: string;
  businessId: string;
  name: string;
  description: string;
  criteriaType: SegmentCriteriaType;
  inactivityDays?: number; // e.g. 30, 45, 60
  minVisits?: number;
  requiresEmailConsent?: boolean;
  requiresSmsConsent?: boolean;
  locationId?: string;
  isSystemDefault?: boolean;
  createdAt: string;
}

export interface WinBackCampaignConfig {
  businessId: string;
  name: string;
  inactivityDays: number;
  channel: 'email' | 'sms';
  offerId?: string;
  customMessage?: string;
}

export interface CampaignRunRecord {
  id: string;
  businessId: string;
  name: string;
  campaignType: 'win_back' | 'promotional';
  channel: 'email' | 'sms';
  offerId?: string;
  offerName?: string;
  segmentId?: string;
  segmentName?: string;
  inactivityThresholdDays?: number;
  targetAudienceCount: number;
  simulatedSentCount: number;
  simulatedAt: string;
  status: 'simulated';
  simulationNotice: string;
}

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface CustomerFeedback {
  id: string;
  businessId: string;
  locationId?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  rating: FeedbackRating;
  comment: string;
  serviceType: 'cafe' | 'salon' | 'retail' | 'gym' | 'carwash' | 'service' | 'general';
  referenceId?: string; // e.g. order #1041, appointment #APT-1005
  status: 'new' | 'reviewed' | 'archived';
  createdAt: string;
}

export interface FeedbackConfig {
  businessId: string;
  enabled: boolean;
  publicReviewUrl?: string; // Google Maps, Yelp, etc.
  promptMessage: string;
}

export type TeamRole = 'owner' | 'manager' | 'staff' | 'receptionist';

export type TeamPermission =
  | 'manage_offers'
  | 'view_analytics'
  | 'export_data'
  | 'manage_customers'
  | 'issue_loyalty'
  | 'operate_orders'
  | 'manage_team'
  | 'manage_settings'
  | 'manage_billing';

export interface TeamMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: TeamRole;
  assignedLocationId?: string;
  status: 'active' | 'invited_simulated';
  lastActiveAt?: string;
  createdAt: string;
}

export type DateRangeOption = '7d' | '30d' | '90d' | 'all';

export interface GrowthAnalyticsSummary {
  dateRange: DateRangeOption;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  repeatRate: number; // percentage (0-100)
  totalRecordedVisits: number;
  totalLoyaltyStamps: number;
  totalRewardsRedeemed: number;
  offersActiveCount: number;
  offerRedemptionsCount: number;
  totalOfferSavingsMinor: number;
  campaignRunsCount: number;
  feedbackCount: number;
  averageRating: number; // 1.0 - 5.0
  recordedGrossValueMinor: number;
}
