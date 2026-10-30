import type { BusinessType, OperatingRegion } from './onboarding';

export interface MockLocation {
  id: string;
  name: string;
  address: string;
  isPrimary: boolean;
  staffPin: string;
}

export interface MockBusiness {
  id: string;
  name: string;
  businessType: BusinessType;
  region: OperatingRegion;
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  planName: string;
  planPrice: string;
  accentColor: string;
  logoInitial: string;
  timeZone: string;
  contactEmail: string;
  phoneNumber?: string;
  locations: MockLocation[];
  activeLocationId: string;
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  selectedModules: string[];
  isDemoSample?: boolean;
}

export interface MockMetrics {
  totalCustomers: number;
  loyaltyVisits: number;
  rewardsRedeemed: number;
  repeatRate: number; // e.g. 68%
  activeStamps: number;
}

export interface MockActivity {
  id: string;
  type: 'customer_joined' | 'stamp_added' | 'reward_unlocked' | 'pin_verified' | 'offer_redeemed';
  title: string;
  subtitle: string;
  timeAgo: string;
  badge?: string;
}

export interface MockChecklistItem {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  targetView: string;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
}
