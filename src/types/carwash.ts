/**
 * Car Wash Management Type Definitions
 * Integers are used for all monetary amounts in minor units (cents/paise).
 */

export type CarWashTier = 'express' | 'deluxe' | 'ultimate' | 'detailing';

export interface CarWashService {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number; // minor currency units (cents/paise)
  durationMinutes: number;
  tier: CarWashTier;
  isActive: boolean;
  createdAt: string;
}

export type CarWashBundleType = 'visit_pack' | 'monthly_pass';

export interface CarWashBundle {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number; // minor currency units
  bundleType: CarWashBundleType;
  totalVisits?: number; // e.g. 5 washes, or undefined if unlimited
  validityDays: number; // e.g. 30, 90, 365
  includedServices: string[];
  isActive: boolean;
  createdAt: string;
}

export type CarWashPassStatus = 'active' | 'exhausted' | 'expired' | 'paused';

export interface CarWashCustomerPass {
  id: string;
  businessId: string;
  locationId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehiclePlate?: string;
  vehicleMakeModel?: string;
  bundleId: string;
  bundleName: string;
  bundleType: CarWashBundleType;
  startDate: string;
  endDate?: string;
  totalVisits?: number;
  remainingVisits?: number;
  status: CarWashPassStatus;
  lastRedeemedAt?: string;
  pricePaidMinor?: number; // Integer minor currency units (optional recorded transaction amount)
  purchasedAt?: string;
  createdAt: string;
}

export interface CarWashVisitEvent {
  id: string;
  businessId: string;
  locationId: string;
  locationName: string;
  passId?: string;
  customerId: string;
  customerName: string;
  vehiclePlate?: string;
  serviceOrBundleName: string;
  timestamp: string;
  washType: 'pass_redemption' | 'single_service';
  remainingVisitsAfter?: number;
  staffActor?: string;
  loyaltyIssued: boolean;
  idempotencyKey: string;
}

export interface CarWashMetrics {
  activePasses: number;
  washesToday: number;
  expiringPasses: number;
  popularTier: string;
  totalWashRevenueCents: number;
}
