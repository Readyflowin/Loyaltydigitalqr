/**
 * Salon, Barbershop & Appointment Management Types for Loyaltydigitalqr
 * All monetary calculations use integer minor currency units (cents / paise).
 */

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BookingSource = 'public_web' | 'walk_in' | 'phone' | 'dashboard';

export interface SalonService {
  id: string;
  businessId: string;
  locationId?: string;
  name: string;
  description: string;
  durationMinutes: number; // e.g. 15, 30, 45, 60, 90
  price: number; // Integer minor currency units (e.g. 4500 = $45.00)
  currency: string;
  isEnabled: boolean;
  assignedStaffIds: string[];
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  imageUrl?: string;
  category?: string;
  displayOrder: number;
  isDemoSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BreakPeriod {
  id: string;
  name: string;
  startTime: string; // HH:mm (e.g. '13:00')
  endTime: string;   // HH:mm (e.g. '14:00')
}

export interface StaffWorkingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isOpen: boolean;
  startTime: string; // HH:mm (e.g. '09:00')
  endTime: string;   // HH:mm (e.g. '18:00')
  breaks: BreakPeriod[];
}

export interface StaffBlockedPeriod {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  reason: string;
}

export interface StaffProfile {
  id: string;
  businessId: string;
  locationId: string;
  displayName: string;
  role: string; // e.g. 'Master Barber', 'Senior Stylist'
  avatarUrl?: string;
  isActive: boolean;
  assignedServiceIds: string[];
  schedule: StaffWorkingHours[];
  blockedPeriods?: StaffBlockedPeriod[];
  isDemoSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSnapshot {
  serviceId: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

export interface AppointmentStatusHistoryEntry {
  status: AppointmentStatus;
  timestamp: string; // ISO string
  actor: string;
  note?: string;
}

export interface SalonAppointment {
  id: string;
  appointmentNumber: string; // e.g. '#APT-1001'
  businessId: string;
  locationId: string;
  locationName: string;
  bookingToken: string; // Public tracking identifier
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: string; // Linked CRM customer ID if matched
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  staffId: string;
  staffName: string;
  startIso: string; // ISO string with complete datetime
  endIso: string;   // ISO string with complete datetime
  businessTimeZone: string;
  price: number; // Integer minor currency units
  currency: string;
  bookingSource: BookingSource;
  status: AppointmentStatus;
  customerNotes?: string;
  internalNotes?: string; // STAFF-ONLY: Never exposed on public endpoints
  cancellationReason?: string;
  statusHistory: AppointmentStatusHistoryEntry[];
  loyaltyIssued?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public facing appointment record (safe, sanitized, internalNotes omitted)
 */
export interface PublicAppointmentView {
  id: string;
  appointmentNumber: string;
  businessName: string;
  businessSlug: string;
  locationName: string;
  locationAddress: string;
  bookingToken: string;
  customerName: string;
  serviceSnapshot: ServiceSnapshot;
  staffName: string;
  startIso: string;
  endIso: string;
  businessTimeZone: string;
  price: number;
  currency: string;
  status: AppointmentStatus;
  customerNotes?: string;
  cancellationReason?: string;
  cancellationPolicyNotice?: string;
  canCancelOrReschedule: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  timeLabel: string; // e.g. '10:00 AM'
  timeHhmm?: string; // e.g. '10:00'
  staffId: string;
  staffName: string;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface CreateAppointmentInput {
  businessId: string;
  locationId?: string;
  serviceId: string;
  staffId?: string; // Specific staff or undefined/'any'
  date: string;     // YYYY-MM-DD
  startTime: string;// HH:mm or ISO
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  internalNotes?: string;
  bookingSource?: BookingSource;
}

export interface SalonMetrics {
  totalAppointmentsToday: number;
  awaitingConfirmation: number;
  upcomingThisWeek: number;
  inServiceNow: number;
  completedToday: number;
  cancelledOrNoShowToday: number;
}

export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_service', 'cancelled'],
  in_service: ['completed', 'cancelled'],
  completed: [], // Terminal
  cancelled: [], // Terminal
  no_show: [],   // Terminal
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  in_service: 'In Service',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};
