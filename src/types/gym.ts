/**
 * Gym & Fitness Domain Types for Loyaltydigitalqr
 * Minor currency units (cents/paise) used for all monetary values.
 */

export type GymPlanType =
  | 'recurring_monthly'
  | 'recurring_annual'
  | 'visit_pass'
  | 'class_pack';

export interface GymMembershipPlan {
  id: string;
  businessId: string;
  name: string;
  description: string;
  planType: GymPlanType;
  durationDays?: number; // e.g. 30 for monthly, 365 for annual
  includedVisits?: number; // e.g. 10 for 10-visit punch pass, undefined for unlimited
  price: number; // Integer minor currency units (e.g. 6500 for $65.00)
  currency: string;
  hasClassAccess: boolean;
  isActive: boolean;
  createdAt: string;
}

export type GymMembershipStatus = 'active' | 'expired' | 'suspended' | 'cancelled';

export interface GymMemberRecord {
  id: string;
  businessId: string;
  locationId: string;
  customerId: string; // Linked CRM customer ID
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  planId: string;
  planName: string;
  planType: GymPlanType;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  totalVisitsAllowed?: number; // e.g. 10
  remainingVisits?: number;    // e.g. 7
  status: GymMembershipStatus;
  lastCheckInAt?: string;
  pricePaidMinor?: number; // Integer minor currency units (optional recorded transaction amount)
  purchasedAt?: string;
  createdAt: string;
}

export interface GymCheckInEvent {
  id: string;
  businessId: string;
  locationId: string;
  locationName: string;
  memberId: string;
  customerId: string;
  memberName: string;
  membershipId: string;
  planName: string;
  timestamp: string; // ISO string
  staffActor: string;
  checkInSource: 'front_desk' | 'qr_kiosk';
  remainingVisitsAfter?: number;
  loyaltyIssued?: boolean;
  loyaltyEventId?: string;
  idempotencyKey: string;
}

export interface GymClass {
  id: string;
  businessId: string;
  locationId: string;
  name: string; // e.g. "HIIT Power Surge"
  description: string;
  instructorName: string;
  room: string;
  startTime: string; // e.g. "07:30 AM" or "07:30"
  endTime: string;   // e.g. "08:30 AM" or "08:30"
  dayOfWeek: number; // 0-6 (0 = Sun, 1 = Mon...)
  capacity: number;  // Max members allowed
  enrolledMemberIds: string[];
  enrolledMembers: {
    memberId: string;
    memberName: string;
    enrolledAt: string;
  }[];
  status: 'published' | 'cancelled';
  createdAt: string;
}

export interface GymMetrics {
  activeMemberships: number;
  visitsToday: number;
  expiringMemberships: number;
  upcomingClasses: number;
  classOccupancyPercent: number;
}

export interface CreatePlanInput {
  businessId: string;
  name: string;
  description: string;
  planType: GymPlanType;
  durationDays?: number;
  includedVisits?: number;
  price: number; // minor units
  currency?: string;
  hasClassAccess?: boolean;
}

export interface AssignMembershipInput {
  businessId: string;
  locationId?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  planId: string;
  startDate?: string;
}

export interface RecordCheckInInput {
  businessId: string;
  locationId?: string;
  memberId: string;
  staffPin?: string;
  checkInSource?: 'front_desk' | 'qr_kiosk';
  idempotencyKey?: string;
}

export interface CreateClassInput {
  businessId: string;
  locationId?: string;
  name: string;
  description: string;
  instructorName: string;
  room?: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
  capacity: number;
}
