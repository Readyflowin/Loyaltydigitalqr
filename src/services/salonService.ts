/**
 * Salon services, staff schedules and appointments.
 * Persisted per business in Firestore via bizStore:
 *   businesses/{id}/salonServices, salonStaff      (public: booking page)
 *   businesses/{id}/appointments                   (members; visitors create / read own by id)
 *   businesses/{id}/appointmentSlots               (public projection: times only, no customer data)
 *
 * Tracking links look like /appointment/{businessId}.{appointmentId}.
 */

import type {
  SalonService,
  StaffProfile,
  SalonAppointment,
  AppointmentStatus,
  CreateAppointmentInput,
  SalonMetrics,
  PublicAppointmentView,
  TimeSlot,
} from '../types/salon';
import { VALID_APPOINTMENT_TRANSITIONS } from '../types/salon';
import {
  calculateAvailableSlots,
  validateSlotAvailability,
  combineDateAndTimeToIso,
  minutesToTime,
  timeToMinutes,
} from '../utils/salonScheduling';
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId, shortCode } from '../lib/ids';
import { businessService } from './businessService';
import { loyaltyService } from './loyaltyService';
import type { DocumentData } from 'firebase/firestore';

export interface BusinessSalonBundle {
  services: SalonService[];
  staff: StaffProfile[];
  appointments: SalonAppointment[];
}

type SalonStorageSchema = {
  [businessId: string]: BusinessSalonBundle;
};

/** Public projection used by the booking page to compute free slots. */
function toAppointmentSlot(apt: DocumentData): DocumentData | null {
  if (!apt) return null;
  return {
    id: apt.id,
    staffId: apt.staffId,
    locationId: apt.locationId || null,
    status: apt.status,
    startIso: apt.startIso,
    endIso: apt.endIso,
    serviceSnapshot: {
      name: apt.serviceSnapshot?.name || 'Appointment',
      bufferBeforeMinutes: apt.serviceSnapshot?.bufferBeforeMinutes || 0,
      bufferAfterMinutes: apt.serviceSnapshot?.bufferAfterMinutes || 0,
    },
  };
}

const byCreated = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(a.createdAt || '').localeCompare(String(b.createdAt || ''));

export const SALON_SPEC: ModuleSpec<BusinessSalonBundle> = {
  name: 'salon',
  arrays: [
    { key: 'services', collection: 'salonServices', public: true, sort: byCreated },
    { key: 'staff', collection: 'salonStaff', public: true, sort: byCreated },
    {
      key: 'appointments',
      collection: 'appointments',
      publicSource: 'appointmentSlots',
      mirror: { collection: 'appointmentSlots', project: toAppointmentSlot },
      sort: (a, b) => String(a.startIso || '').localeCompare(String(b.startIso || '')),
    },
  ],
  empty: () => ({ services: [], staff: [], appointments: [] }),
};
bizStore.register(SALON_SPEC);

/** Split an appointment tracking token into business id and appointment id. */
export function parseAppointmentToken(token: string): { businessId: string; appointmentId: string } | null {
  const clean = (token || '').trim();
  const dot = clean.indexOf('.');
  if (dot <= 0 || dot === clean.length - 1) return null;
  const businessId = clean.slice(0, dot);
  const appointmentId = clean.slice(dot + 1);
  if (!/^[a-z0-9]{8,64}$/i.test(businessId) || !/^[a-z0-9_]{16,64}$/i.test(appointmentId)) return null;
  return { businessId, appointmentId };
}

class SalonBookingService {
  private listeners: (() => void)[] = [];

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): SalonStorageSchema {
    return bizStore.getAll(SALON_SPEC);
  }

  private saveData(data: SalonStorageSchema): void {
    bizStore.saveAll(SALON_SPEC, data);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Salon listener error:', e);
      }
    });
  }

  private getBundle(businessId: string): BusinessSalonBundle {
    return bizStore.getBundle(SALON_SPEC, businessId);
  }

  /** Visitor tracking page: watch one appointment by its tracking token. */
  watchAppointment(token: string): boolean {
    const parsed = parseAppointmentToken(token);
    if (!parsed || !bizStore.getMode(parsed.businessId)) return false;
    bizStore.pinDoc(parsed.businessId, 'appointments', parsed.appointmentId);
    return true;
  }

  // =========================================================================
  // SERVICE MANAGEMENT METHODS
  // =========================================================================

  getServices(businessId: string, locationId?: string): SalonService[] {
    const bundle = this.getBundle(businessId);
    let list = bundle.services;
    if (locationId && locationId !== 'all') {
      list = list.filter((s) => !s.locationId || s.locationId === locationId);
    }
    return [...list].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getService(businessId: string, serviceId: string): SalonService | null {
    const services = this.getServices(businessId);
    return services.find((s) => s.id === serviceId) || null;
  }

  createService(
    businessId: string,
    input: Omit<SalonService, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
  ): SalonService {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);

    const serviceId = `srv_${newId()}`;
    const now = new Date().toISOString();

    const newService: SalonService = {
      ...input,
      id: serviceId,
      businessId,
      displayOrder: bundle.services.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    bundle.services.push(newService);

    // Also update assigned staff profiles if staff IDs were provided
    if (input.assignedStaffIds && input.assignedStaffIds.length > 0) {
      bundle.staff.forEach((stf) => {
        if (input.assignedStaffIds.includes(stf.id) && !stf.assignedServiceIds.includes(serviceId)) {
          stf.assignedServiceIds.push(serviceId);
          stf.updatedAt = now;
        }
      });
    }

    data[businessId] = bundle;
    this.saveData(data);
    return newService;
  }

  updateService(
    businessId: string,
    serviceId: string,
    updates: Partial<SalonService>
  ): SalonService | null {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);
    const index = bundle.services.findIndex((s) => s.id === serviceId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const updated: SalonService = {
      ...bundle.services[index],
      ...updates,
      updatedAt: now,
    };

    bundle.services[index] = updated;

    // Synchronize staff assignments if updated
    if (updates.assignedStaffIds) {
      bundle.staff.forEach((stf) => {
        const shouldHave = updates.assignedStaffIds!.includes(stf.id);
        const hasIt = stf.assignedServiceIds.includes(serviceId);
        if (shouldHave && !hasIt) {
          stf.assignedServiceIds.push(serviceId);
          stf.updatedAt = now;
        } else if (!shouldHave && hasIt) {
          stf.assignedServiceIds = stf.assignedServiceIds.filter((id) => id !== serviceId);
          stf.updatedAt = now;
        }
      });
    }

    data[businessId] = bundle;
    this.saveData(data);
    return updated;
  }

  duplicateService(businessId: string, serviceId: string): SalonService | null {
    const target = this.getService(businessId, serviceId);
    if (!target) return null;

    return this.createService(businessId, {
      ...target,
      name: `${target.name} (Copy)`,
      isDemoSample: false,
    });
  }

  deleteService(businessId: string, serviceId: string): boolean {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);
    const prevLen = bundle.services.length;

    bundle.services = bundle.services.filter((s) => s.id !== serviceId);

    // Remove from staff profiles
    bundle.staff.forEach((stf) => {
      stf.assignedServiceIds = stf.assignedServiceIds.filter((id) => id !== serviceId);
    });

    data[businessId] = bundle;
    this.saveData(data);
    return bundle.services.length < prevLen;
  }

  // =========================================================================
  // STAFF & AVAILABILITY MANAGEMENT METHODS
  // =========================================================================

  getStaff(businessId: string, locationId?: string): StaffProfile[] {
    const bundle = this.getBundle(businessId);
    let list = bundle.staff;
    if (locationId && locationId !== 'all') {
      list = list.filter((stf) => !stf.locationId || stf.locationId === locationId);
    }
    return list;
  }

  getStaffMember(businessId: string, staffId: string): StaffProfile | null {
    const staffList = this.getStaff(businessId);
    return staffList.find((stf) => stf.id === staffId) || null;
  }

  createStaff(
    businessId: string,
    input: Omit<StaffProfile, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
  ): StaffProfile {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);

    const staffId = `stf_${newId()}`;
    const now = new Date().toISOString();

    const newStaff: StaffProfile = {
      ...input,
      id: staffId,
      businessId,
      createdAt: now,
      updatedAt: now,
    };

    bundle.staff.push(newStaff);

    // Synchronize with services
    if (input.assignedServiceIds && input.assignedServiceIds.length > 0) {
      bundle.services.forEach((srv) => {
        if (input.assignedServiceIds.includes(srv.id) && !srv.assignedStaffIds.includes(staffId)) {
          srv.assignedStaffIds.push(staffId);
          srv.updatedAt = now;
        }
      });
    }

    data[businessId] = bundle;
    this.saveData(data);
    return newStaff;
  }

  updateStaff(
    businessId: string,
    staffId: string,
    updates: Partial<StaffProfile>
  ): StaffProfile | null {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);
    const index = bundle.staff.findIndex((s) => s.id === staffId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const updated: StaffProfile = {
      ...bundle.staff[index],
      ...updates,
      updatedAt: now,
    };

    bundle.staff[index] = updated;

    // Synchronize service assignments if updated
    if (updates.assignedServiceIds) {
      bundle.services.forEach((srv) => {
        const shouldHave = updates.assignedServiceIds!.includes(srv.id);
        const hasIt = srv.assignedStaffIds.includes(staffId);
        if (shouldHave && !hasIt) {
          srv.assignedStaffIds.push(staffId);
          srv.updatedAt = now;
        } else if (!shouldHave && hasIt) {
          srv.assignedStaffIds = srv.assignedStaffIds.filter((id) => id !== staffId);
          srv.updatedAt = now;
        }
      });
    }

    data[businessId] = bundle;
    this.saveData(data);
    return updated;
  }

  deleteStaff(businessId: string, staffId: string): boolean {
    const data = this.loadData();
    const bundle = this.getBundle(businessId);
    const prevLen = bundle.staff.length;

    bundle.staff = bundle.staff.filter((s) => s.id !== staffId);

    // Remove from services
    bundle.services.forEach((srv) => {
      srv.assignedStaffIds = srv.assignedStaffIds.filter((id) => id !== staffId);
    });

    data[businessId] = bundle;
    this.saveData(data);
    return bundle.staff.length < prevLen;
  }

  // =========================================================================
  // SCHEDULING & SLOT CALCULATION METHODS
  // =========================================================================

  getAvailableSlots(
    businessId: string,
    serviceId: string,
    date: string, // YYYY-MM-DD
    staffId?: string
  ): TimeSlot[] {
    const service = this.getService(businessId, serviceId);
    if (!service) return [];

    const staffList = this.getStaff(businessId);
    const bundle = this.getBundle(businessId);

    return calculateAvailableSlots({
      service,
      staffList,
      appointments: bundle.appointments,
      date,
      targetStaffId: staffId,
      slotIntervalMinutes: 15,
    });
  }

  // =========================================================================
  // APPOINTMENT CREATION & MANAGEMENT METHODS
  // =========================================================================

  getAppointments(
    businessId: string,
    filters?: {
      locationId?: string;
      staffId?: string;
      serviceId?: string;
      status?: AppointmentStatus | 'all';
      date?: string; // YYYY-MM-DD
      searchQuery?: string;
    }
  ): SalonAppointment[] {
    const bundle = this.getBundle(businessId);
    let list = bundle.appointments;

    if (filters?.locationId && filters.locationId !== 'all') {
      list = list.filter((a) => a.locationId === filters.locationId);
    }
    if (filters?.staffId && filters.staffId !== 'all') {
      list = list.filter((a) => a.staffId === filters.staffId);
    }
    if (filters?.serviceId && filters.serviceId !== 'all') {
      list = list.filter((a) => a.serviceId === filters.serviceId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.date) {
      list = list.filter((a) => a.startIso.startsWith(filters.date!));
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.customerName.toLowerCase().includes(q) ||
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.customerEmail.toLowerCase().includes(q) ||
          a.customerPhone.includes(q)
      );
    }

    return [...list].sort(
      (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
    );
  }

  getAppointment(appointmentId: string): SalonAppointment | null {
    const data = this.loadData();
    for (const bizId of Object.keys(data)) {
      const apt = data[bizId].appointments.find((a) => a.id === appointmentId);
      if (apt) return apt;
    }
    return null;
  }

  /**
   * Public-facing appointment view (strips staff-only internal notes)
   */
  getAppointmentByToken(bookingToken: string): PublicAppointmentView | null {
    const data = this.loadData();


    for (const bizId of Object.keys(data)) {
      const apt = data[bizId].appointments.find((a) => a.bookingToken === bookingToken);
      if (apt) {
        const business = businessService.getBusinessById(bizId);
        const loc = business?.locations.find((l) => l.id === apt.locationId) || {
          name: apt.locationName,
          address: '',
        };

        const isTerminal = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';

        return {
          id: apt.id,
          appointmentNumber: apt.appointmentNumber,
          businessName: business?.name || '',
          businessSlug: business?.slug || '',
          locationName: loc.name,
          locationAddress: loc.address,
          bookingToken: apt.bookingToken,
          customerName: apt.customerName,
          serviceSnapshot: apt.serviceSnapshot,
          staffName: apt.staffName,
          startIso: apt.startIso,
          endIso: apt.endIso,
          businessTimeZone: apt.businessTimeZone,
          price: apt.price,
          currency: apt.currency,
          status: apt.status,
          customerNotes: apt.customerNotes,
          cancellationReason: apt.cancellationReason,
          cancellationPolicyNotice: 'To cancel, use the button below or contact the business before your appointment time.',
          canCancelOrReschedule: !isTerminal && (apt.status === 'requested' || apt.status === 'confirmed'),
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt,
        };
      }
    }
    return null;
  }

  createAppointment(input: CreateAppointmentInput): {
    success: boolean;
    appointment?: SalonAppointment;
    error?: string;
  } {
    const { businessId, serviceId, date, startTime } = input;
    const bundle = this.getBundle(businessId);
    const service = this.getService(businessId, serviceId);

    if (!service || !service.isEnabled) {
      return { success: false, error: 'The requested service is currently disabled or unavailable.' };
    }

    const business = businessService.getBusinessById(businessId);
    const locationId =
      input.locationId ||
      service.locationId ||
      business?.activeLocationId ||
      business?.locations[0]?.id ||
      'loc_main';
    const locationName =
      business?.locations.find((l) => l.id === locationId)?.name || 'Main Location';

    // Normalize start time to HH:mm
    const timeHhmm = startTime.includes('T')
      ? startTime.split('T')[1].substring(0, 5)
      : startTime;

    // Resolve assigned staff member (specific or "any")
    const allStaff = this.getStaff(businessId);
    let chosenStaff: StaffProfile | null = null;

    if (input.staffId && input.staffId !== 'any') {
      chosenStaff = allStaff.find((s) => s.id === input.staffId) || null;
      if (!chosenStaff) {
        return { success: false, error: 'The selected staff professional was not found.' };
      }
      const validation = validateSlotAvailability({
        service,
        staff: chosenStaff,
        appointments: bundle.appointments,
        date,
        startTimeHhmm: timeHhmm,
      });
      if (!validation.isAvailable) {
        return { success: false, error: validation.conflictReason || 'This time slot is unavailable.' };
      }
    } else {
      // Find any eligible staff who is free
      const eligible = allStaff.filter(
        (s) => s.isActive && s.assignedServiceIds.includes(service.id)
      );
      for (const stf of eligible) {
        const val = validateSlotAvailability({
          service,
          staff: stf,
          appointments: bundle.appointments,
          date,
          startTimeHhmm: timeHhmm,
        });
        if (val.isAvailable) {
          chosenStaff = stf;
          break;
        }
      }
      if (!chosenStaff) {
        return { success: false, error: 'No available professional was found for this time slot.' };
      }
    }

    // Build ISO start and end timestamps
    const startMins = timeToMinutes(timeHhmm);
    const endMins = startMins + service.durationMinutes;
    const startIso = combineDateAndTimeToIso(date, timeHhmm);
    const endIso = combineDateAndTimeToIso(date, minutesToTime(endMins));

    const appointmentId = `${newId()}${newId()}`;
    const aptNumber = `#${shortCode(5)}`;
    const token = `${businessId}.${appointmentId}`;
    const now = new Date().toISOString();

    // Check if customer exists in customer CRM
    let matchedCustomerId: string | undefined;
    const customers = loyaltyService.getCustomers(businessId);
    const existing = customers.find(
      (c) =>
        (input.customerEmail && c.email && c.email.toLowerCase() === input.customerEmail.toLowerCase()) ||
        (input.customerPhone && c.phoneNumber && c.phoneNumber === input.customerPhone)
    );
    if (existing) {
      matchedCustomerId = existing.id;
    }

    const newAppointment: SalonAppointment = {
      id: appointmentId,
      appointmentNumber: aptNumber,
      businessId,
      locationId,
      locationName,
      bookingToken: token,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      customerPhone: input.customerPhone.trim(),
      customerId: matchedCustomerId,
      serviceId: service.id,
      serviceSnapshot: {
        serviceId: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
        currency: service.currency,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
      },
      staffId: chosenStaff.id,
      staffName: chosenStaff.displayName,
      startIso,
      endIso,
      businessTimeZone: business?.timeZone || 'America/New_York',
      price: service.price,
      currency: service.currency,
      bookingSource: input.bookingSource || 'public_web',
      status: 'confirmed', // Confirmed directly for verified slot
      customerNotes: input.customerNotes?.trim() || undefined,
      internalNotes: input.internalNotes?.trim() || undefined,
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: now,
          actor: input.bookingSource === 'dashboard' ? 'Staff' : 'Customer',
          note: 'Appointment confirmed with verified availability slot',
        },
      ],
      loyaltyIssued: false,
      createdAt: now,
      updatedAt: now,
    };

    const data = this.loadData();
    bundle.appointments.push(newAppointment);
    data[businessId] = bundle;
    this.saveData(data);

    return { success: true, appointment: newAppointment };
  }

  updateAppointmentStatus(
    appointmentId: string,
    nextStatus: AppointmentStatus,
    actor: string,
    note?: string
  ): { success: boolean; appointment?: SalonAppointment; error?: string } {
    const data = this.loadData();

    for (const bizId of Object.keys(data)) {
      const bundle = data[bizId];
      const index = bundle.appointments.findIndex((a) => a.id === appointmentId);
      if (index !== -1) {
        const apt = bundle.appointments[index];
        const validNext = VALID_APPOINTMENT_TRANSITIONS[apt.status] || [];

        if (!validNext.includes(nextStatus)) {
          return {
            success: false,
            error: `Invalid transition from ${apt.status} to ${nextStatus}.`,
          };
        }

        const now = new Date().toISOString();
        apt.status = nextStatus;
        apt.updatedAt = now;
        apt.statusHistory.push({
          status: nextStatus,
          timestamp: now,
          actor,
          note,
        });

        if (nextStatus === 'cancelled' && note) {
          apt.cancellationReason = note;
        }

        // Loyalty Integration: If completed and not yet issued, award loyalty stamp/visit
        if (nextStatus === 'completed' && !apt.loyaltyIssued) {
          apt.loyaltyIssued = true;
          try {
            // Find or link customer in loyalty service
            const customers = loyaltyService.getCustomers(bizId);
            let customer = customers.find(
              (c) =>
                (apt.customerEmail && c.email && c.email.toLowerCase() === apt.customerEmail.toLowerCase()) ||
                (apt.customerPhone && c.phoneNumber && c.phoneNumber === apt.customerPhone)
            );
            if (!customer) {
              const res = loyaltyService.addCustomer(bizId, {
                name: apt.customerName,
                email: apt.customerEmail || undefined,
                phoneNumber: apt.customerPhone || undefined,
              });
              if (res.success && res.customer) {
                customer = res.customer;
              }
            }
            if (customer) {
              loyaltyService.issueStamp({
                businessId: bizId,
                customerId: customer.id,
              });
            }
          } catch (e) {
            console.warn('Loyalty issuance note:', e);
          }
        }

        bundle.appointments[index] = apt;
        data[bizId] = bundle;
        this.saveData(data);
        return { success: true, appointment: apt };
      }
    }

    return { success: false, error: 'Appointment not found.' };
  }

  rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTimeHhmm: string,
    actor: string
  ): { success: boolean; appointment?: SalonAppointment; error?: string } {
    const data = this.loadData();

    for (const bizId of Object.keys(data)) {
      const bundle = data[bizId];
      const apt = bundle.appointments.find((a) => a.id === appointmentId);
      if (apt) {
        const service = this.getService(bizId, apt.serviceId);
        const staff = this.getStaffMember(bizId, apt.staffId);

        if (!service || !staff) {
          return { success: false, error: 'Associated service or staff profile no longer exists.' };
        }

        // Validate that new time slot is conflict free (excluding current appointment)
        const validation = validateSlotAvailability({
          service,
          staff,
          appointments: bundle.appointments,
          date: newDate,
          startTimeHhmm: newStartTimeHhmm,
          excludeAppointmentId: appointmentId,
        });

        if (!validation.isAvailable) {
          return {
            success: false,
            error: validation.conflictReason || 'The selected time slot is unavailable.',
          };
        }

        const startMins = timeToMinutes(newStartTimeHhmm);
        const endMins = startMins + service.durationMinutes;
        const now = new Date().toISOString();

        apt.startIso = combineDateAndTimeToIso(newDate, newStartTimeHhmm);
        apt.endIso = combineDateAndTimeToIso(newDate, minutesToTime(endMins));
        apt.updatedAt = now;
        apt.statusHistory.push({
          status: apt.status,
          timestamp: now,
          actor,
          note: `Rescheduled to ${newDate} at ${newStartTimeHhmm}`,
        });

        data[bizId] = bundle;
        this.saveData(data);
        return { success: true, appointment: apt };
      }
    }

    return { success: false, error: 'Appointment not found.' };
  }

  // =========================================================================
  // OVERVIEW METRICS
  // =========================================================================

  getSalonMetrics(businessId: string, locationId?: string): SalonMetrics {
    const bundle = this.getBundle(businessId);
    let list = bundle.appointments;

    if (locationId && locationId !== 'all') {
      list = list.filter((a) => a.locationId === locationId);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayApts = list.filter((a) => a.startIso.startsWith(todayStr));

    const totalAppointmentsToday = todayApts.length;
    const awaitingConfirmation = list.filter((a) => a.status === 'requested').length;
    const upcomingThisWeek = list.filter(
      (a) => a.status === 'confirmed' || a.status === 'requested'
    ).length;
    const inServiceNow = todayApts.filter((a) => a.status === 'in_service').length;
    const completedToday = todayApts.filter((a) => a.status === 'completed').length;
    const cancelledOrNoShowToday = todayApts.filter(
      (a) => a.status === 'cancelled' || a.status === 'no_show'
    ).length;

    return {
      totalAppointmentsToday,
      awaitingConfirmation,
      upcomingThisWeek,
      inServiceNow,
      completedToday,
      cancelledOrNoShowToday,
    };
  }

  // =========================================================================
  // PUBLIC BOOKING DATA RESOLUTION
  // =========================================================================

  getPublicBookingProfile(slugOrId: string): {
    business: {
      id: string;
      name: string;
      slug: string;
      accentColor: string;
      logoInitial: string;
      currency: string;
      currencySymbol: string;
      timeZone: string;
      address: string;
      phoneNumber: string;
      cancellationPolicy: string;
    };
    services: SalonService[];
    staff: StaffProfile[];
  } | null {
    const business = businessService.findBusinessBySlug(slugOrId);

    if (!business || business.businessType !== 'salon') {
      return null;
    }

    const enabledServices = this.getServices(business.id).filter((s) => s.isEnabled);
    const activeStaff = this.getStaff(business.id).filter((stf) => stf.isActive);
    const primaryLoc = business.locations[0] || {
      address: '',
      phoneNumber: business.phoneNumber,
    };

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        accentColor: business.accentColor || '#E4C174',
        logoInitial: business.logoInitial || business.name.charAt(0).toUpperCase(),
        currency: business.currency || 'USD',
        currencySymbol: business.currencySymbol || '$',
        timeZone: business.timeZone || 'America/New_York',
        address: primaryLoc.address,
        phoneNumber: business.phoneNumber || '',
        cancellationPolicy: 'To cancel, use your booking link or contact us before your appointment time.',
      },
      services: enabledServices,
      staff: activeStaff,
    };
  }

  // =========================================================================
  // REACTIVE PUBSUB
  // =========================================================================

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const salonService = new SalonBookingService();
