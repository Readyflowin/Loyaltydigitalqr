/**
 * Generic Service Business Type Definitions
 * Integers are used for all monetary amounts in minor units (cents/paise).
 */

export interface GenericServiceItem {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number; // minor currency units (cents/paise)
  category: string;
  estimatedMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface GenericServiceJobEvent {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amountCharged: number; // minor currency units
  notes?: string;
  timestamp: string;
  status: 'completed' | 'in_progress';
  loyaltyIssued: boolean;
  idempotencyKey: string;
}

export interface GenericServiceMetrics {
  totalServices: number;
  jobsCompletedToday: number;
  totalServiceRevenueCents: number;
  activeJobsCount: number;
}
