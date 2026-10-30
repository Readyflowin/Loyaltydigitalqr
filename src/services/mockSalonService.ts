import type {
  SalonService,
  StaffProfile,
  SalonAppointment,
  AppointmentStatus,
  CreateAppointmentInput,
  SalonMetrics,
  PublicAppointmentView,
  TimeSlot,
  StaffWorkingHours,
} from '../types/salon';
import { VALID_APPOINTMENT_TRANSITIONS } from '../types/salon';
import {
  calculateAvailableSlots,
  validateSlotAvailability,
  combineDateAndTimeToIso,
  minutesToTime,
  timeToMinutes,
} from '../utils/salonScheduling';
import { mockBusinessService } from './mockBusinessService';
import { mockLoyaltyService } from './mockLoyaltyService';
import { generateBusinessSlug } from '../utils/qrUrlBuilder';

const STORAGE_KEY = 'loyalty_mock_salon_v1';

export interface BusinessSalonBundle {
  services: SalonService[];
  staff: StaffProfile[];
  appointments: SalonAppointment[];
}

type SalonStorageSchema = {
  [businessId: string]: BusinessSalonBundle;
};

class MockSalonService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = this.getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }

  private loadData(): SalonStorageSchema {
    if (typeof window === 'undefined') {
      return this.getSeedData();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.getSeedData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as SalonStorageSchema;
    } catch {
      return this.getSeedData();
    }
  }

  private saveData(data: SalonStorageSchema): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to save salon mock data to localStorage:', err);
      }
    }
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
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = {
        services: [],
        staff: [],
        appointments: [],
      };
      this.saveData(data);
    }
    return data[businessId];
  }

  // =========================================================================
  // SEED DATA GENERATOR
  // =========================================================================

  private getSeedData(): SalonStorageSchema {
    const bizId = 'biz_salon_demo';
    const locFlagship = 'loc_salon_flagship';
    const locWestEnd = 'loc_salon_sub';

    const defaultSchedule: StaffWorkingHours[] = [
      { dayOfWeek: 0, isOpen: false, startTime: '10:00', endTime: '16:00', breaks: [] },
      {
        dayOfWeek: 1,
        isOpen: true,
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: 'brk_1', name: 'Lunch Break', startTime: '13:00', endTime: '14:00' }],
      },
      {
        dayOfWeek: 2,
        isOpen: true,
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: 'brk_2', name: 'Lunch Break', startTime: '13:00', endTime: '14:00' }],
      },
      {
        dayOfWeek: 3,
        isOpen: true,
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: 'brk_3', name: 'Lunch Break', startTime: '13:00', endTime: '14:00' }],
      },
      {
        dayOfWeek: 4,
        isOpen: true,
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: 'brk_4', name: 'Lunch Break', startTime: '13:00', endTime: '14:00' }],
      },
      {
        dayOfWeek: 5,
        isOpen: true,
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: 'brk_5', name: 'Lunch Break', startTime: '13:00', endTime: '14:00' }],
      },
      {
        dayOfWeek: 6,
        isOpen: true,
        startTime: '09:00',
        endTime: '17:00',
        breaks: [{ id: 'brk_6', name: 'Midday Rest', startTime: '12:30', endTime: '13:30' }],
      },
    ];

    // Seeded Staff Profiles
    const staff: StaffProfile[] = [
      {
        id: 'stf_marcus',
        businessId: bizId,
        locationId: locFlagship,
        displayName: 'Marcus Vance',
        role: 'Master Barber & Founder',
        isActive: true,
        assignedServiceIds: ['srv_classic_cut', 'srv_beard_sculpt', 'srv_combo_deluxe', 'srv_royal_treatment'],
        schedule: defaultSchedule,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'stf_elena',
        businessId: bizId,
        locationId: locFlagship,
        displayName: 'Elena Rostova',
        role: 'Senior Stylist & Grooming Specialist',
        isActive: true,
        assignedServiceIds: ['srv_classic_cut', 'srv_scalp_therapy', 'srv_royal_treatment', 'srv_combo_deluxe'],
        schedule: defaultSchedule,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'stf_damon',
        businessId: bizId,
        locationId: locWestEnd,
        displayName: 'Damon Reed',
        role: 'Precision Fade & Texture Specialist',
        isActive: true,
        assignedServiceIds: ['srv_classic_cut', 'srv_beard_sculpt', 'srv_combo_deluxe'],
        schedule: defaultSchedule,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
    ];

    // Seeded Services
    const services: SalonService[] = [
      {
        id: 'srv_classic_cut',
        businessId: bizId,
        locationId: locFlagship,
        name: 'Signature Haircut & Style',
        description: 'Precision scissor and clipper cut, hot lather neck shave, and custom pomade finish.',
        durationMinutes: 45,
        price: 4500, // $45.00
        currency: 'USD',
        isEnabled: true,
        assignedStaffIds: ['stf_marcus', 'stf_elena', 'stf_damon'],
        bufferAfterMinutes: 5,
        category: 'Haircuts',
        displayOrder: 1,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'srv_beard_sculpt',
        businessId: bizId,
        locationId: locFlagship,
        name: 'Beard Trim & Razor Lineup',
        description: 'Detailed beard shaping, straight razor edge lining, and soothing sandalwood oil treatment.',
        durationMinutes: 30,
        price: 3000, // $30.00
        currency: 'USD',
        isEnabled: true,
        assignedStaffIds: ['stf_marcus', 'stf_damon'],
        bufferAfterMinutes: 5,
        category: 'Beard & Shave',
        displayOrder: 2,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'srv_royal_treatment',
        businessId: bizId,
        locationId: locFlagship,
        name: 'The Royal Shave & Hot Towel',
        description: 'Multi-step traditional hot towel treatment, pre-shave aromatic oil, badger brush lather, and straight-razor glide.',
        durationMinutes: 45,
        price: 5000, // $50.00
        currency: 'USD',
        isEnabled: true,
        assignedStaffIds: ['stf_marcus', 'stf_elena'],
        bufferAfterMinutes: 10,
        category: 'Beard & Shave',
        displayOrder: 3,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'srv_combo_deluxe',
        businessId: bizId,
        locationId: locFlagship,
        name: 'Haircut & Beard Sculpt Combo',
        description: 'Full signature haircut styling paired with complete beard grooming and steam towel finish.',
        durationMinutes: 60,
        price: 7000, // $70.00
        currency: 'USD',
        isEnabled: true,
        assignedStaffIds: ['stf_marcus', 'stf_elena', 'stf_damon'],
        bufferAfterMinutes: 10,
        category: 'Packages',
        displayOrder: 4,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: 'srv_scalp_therapy',
        businessId: bizId,
        locationId: locFlagship,
        name: 'Revitalizing Scalp Treatment',
        description: 'Invigorating tea tree scalp massage, deep follicle cleanse, and therapeutic steam therapy.',
        durationMinutes: 30,
        price: 3500, // $35.00
        currency: 'USD',
        isEnabled: true,
        assignedStaffIds: ['stf_elena'],
        bufferAfterMinutes: 5,
        category: 'Treatments',
        displayOrder: 5,
        isDemoSample: true,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
    ];

    // Build today's date for realistic appointment seeds
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today.getTime() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Seeded Appointments
    const appointments: SalonAppointment[] = [
      {
        id: 'apt_1001_s9a1',
        appointmentNumber: '#APT-1001',
        businessId: bizId,
        locationId: locFlagship,
        locationName: 'Flagship Studio (Uptown)',
        bookingToken: 'trk_apex_1001_s9a1',
        customerName: 'Sarah Miller',
        customerEmail: 'sarah.m@example.com',
        customerPhone: '+1 (555) 234-5678',
        customerId: 'cust_sarah_01',
        serviceId: 'srv_classic_cut',
        serviceSnapshot: {
          serviceId: 'srv_classic_cut',
          name: 'Signature Haircut & Style',
          durationMinutes: 45,
          price: 4500,
          currency: 'USD',
          bufferAfterMinutes: 5,
        },
        staffId: 'stf_marcus',
        staffName: 'Marcus Vance',
        startIso: `${todayStr}T10:00:00`,
        endIso: `${todayStr}T10:45:00`,
        businessTimeZone: 'America/New_York',
        price: 4500,
        currency: 'USD',
        bookingSource: 'public_web',
        status: 'confirmed',
        customerNotes: 'Please trim sides slightly shorter than usual',
        internalNotes: 'Client prefers matte pomade. VIP regular.',
        statusHistory: [
          { status: 'requested', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), actor: 'Customer' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), actor: 'Staff' },
        ],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'apt_1002_d8f2',
        appointmentNumber: '#APT-1002',
        businessId: bizId,
        locationId: locFlagship,
        locationName: 'Flagship Studio (Uptown)',
        bookingToken: 'trk_apex_1002_d8f2',
        customerName: 'Liam Chen',
        customerEmail: 'liam.c@example.com',
        customerPhone: '+1 (555) 345-6789',
        customerId: 'cust_liam_04',
        serviceId: 'srv_beard_sculpt',
        serviceSnapshot: {
          serviceId: 'srv_beard_sculpt',
          name: 'Beard Trim & Razor Lineup',
          durationMinutes: 30,
          price: 3000,
          currency: 'USD',
          bufferAfterMinutes: 5,
        },
        staffId: 'stf_damon',
        staffName: 'Damon Reed',
        startIso: `${todayStr}T11:00:00`,
        endIso: `${todayStr}T11:30:00`,
        businessTimeZone: 'America/New_York',
        price: 3000,
        currency: 'USD',
        bookingSource: 'walk_in',
        status: 'checked_in',
        customerNotes: 'Walk-in guest, waiting in reception chair 2',
        statusHistory: [
          { status: 'requested', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), actor: 'Front Desk' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), actor: 'Front Desk' },
          { status: 'checked_in', timestamp: new Date(Date.now() - 1800000).toISOString(), actor: 'Front Desk' },
        ],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'apt_1003_c4b9',
        appointmentNumber: '#APT-1003',
        businessId: bizId,
        locationId: locFlagship,
        locationName: 'Flagship Studio (Uptown)',
        bookingToken: 'trk_apex_1003_c4b9',
        customerName: 'Chloe Bennett',
        customerEmail: 'chloe.b@example.com',
        customerPhone: '+1 (555) 456-7890',
        customerId: 'cust_chloe_03',
        serviceId: 'srv_scalp_therapy',
        serviceSnapshot: {
          serviceId: 'srv_scalp_therapy',
          name: 'Revitalizing Scalp Treatment',
          durationMinutes: 30,
          price: 3500,
          currency: 'USD',
          bufferAfterMinutes: 5,
        },
        staffId: 'stf_elena',
        staffName: 'Elena Rostova',
        startIso: `${yesterdayStr}T14:00:00`,
        endIso: `${yesterdayStr}T14:30:00`,
        businessTimeZone: 'America/New_York',
        price: 3500,
        currency: 'USD',
        bookingSource: 'public_web',
        status: 'completed',
        loyaltyIssued: true,
        statusHistory: [
          { status: 'requested', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Customer' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Staff' },
          { status: 'checked_in', timestamp: `${yesterdayStr}T13:55:00.000Z`, actor: 'Staff' },
          { status: 'in_service', timestamp: `${yesterdayStr}T14:00:00.000Z`, actor: 'Elena Rostova' },
          { status: 'completed', timestamp: `${yesterdayStr}T14:30:00.000Z`, actor: 'Elena Rostova', note: 'Service finished. Scalp feeling revitalized.' },
        ],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: `${yesterdayStr}T14:30:00.000Z`,
      },
      {
        id: 'apt_1004_m7k3',
        appointmentNumber: '#APT-1004',
        businessId: bizId,
        locationId: locFlagship,
        locationName: 'Flagship Studio (Uptown)',
        bookingToken: 'trk_apex_1004_m7k3',
        customerName: 'David Kim',
        customerEmail: 'david.k@example.com',
        customerPhone: '+1 (555) 567-8901',
        customerId: 'cust_david_02',
        serviceId: 'srv_royal_treatment',
        serviceSnapshot: {
          serviceId: 'srv_royal_treatment',
          name: 'The Royal Shave & Hot Towel',
          durationMinutes: 45,
          price: 5000,
          currency: 'USD',
          bufferAfterMinutes: 10,
        },
        staffId: 'stf_marcus',
        staffName: 'Marcus Vance',
        startIso: `${tomorrowStr}T14:00:00`,
        endIso: `${tomorrowStr}T14:45:00`,
        businessTimeZone: 'America/New_York',
        price: 5000,
        currency: 'USD',
        bookingSource: 'public_web',
        status: 'requested',
        customerNotes: 'First time visiting Apex, preparing for wedding anniversary',
        statusHistory: [
          { status: 'requested', timestamp: new Date().toISOString(), actor: 'Customer' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      [bizId]: {
        services,
        staff,
        appointments,
      },
      biz_user_primary: { services: [], staff: [], appointments: [] }, // Strict café isolation
      biz_retail_demo: { services: [], staff: [], appointments: [] },
    };
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

    const newId = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newService: SalonService = {
      ...input,
      id: newId,
      businessId,
      displayOrder: bundle.services.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    bundle.services.push(newService);

    // Also update assigned staff profiles if staff IDs were provided
    if (input.assignedStaffIds && input.assignedStaffIds.length > 0) {
      bundle.staff.forEach((stf) => {
        if (input.assignedStaffIds.includes(stf.id) && !stf.assignedServiceIds.includes(newId)) {
          stf.assignedServiceIds.push(newId);
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

    const newId = `stf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newStaff: StaffProfile = {
      ...input,
      id: newId,
      businessId,
      createdAt: now,
      updatedAt: now,
    };

    bundle.staff.push(newStaff);

    // Synchronize with services
    if (input.assignedServiceIds && input.assignedServiceIds.length > 0) {
      bundle.services.forEach((srv) => {
        if (input.assignedServiceIds.includes(srv.id) && !srv.assignedStaffIds.includes(newId)) {
          srv.assignedStaffIds.push(newId);
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
    const businesses = mockBusinessService.getAllBusinesses();

    for (const bizId of Object.keys(data)) {
      const apt = data[bizId].appointments.find((a) => a.bookingToken === bookingToken);
      if (apt) {
        const business = businesses.find((b) => b.id === bizId);
        const loc = business?.locations.find((l) => l.id === apt.locationId) || {
          name: apt.locationName,
          address: 'Main Salon Floor',
        };

        const isTerminal = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';

        return {
          id: apt.id,
          appointmentNumber: apt.appointmentNumber,
          businessName: business?.name || 'Salon & Grooming Studio',
          businessSlug: generateBusinessSlug(business?.name || 'salon'),
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
          cancellationPolicyNotice: 'Free cancellation up to 2 hours prior to scheduled appointment time.',
          canCancelOrReschedule: !isTerminal,
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

    const business = mockBusinessService.getAllBusinesses().find((b) => b.id === businessId);
    const locationId =
      input.locationId ||
      service.locationId ||
      business?.activeLocationId ||
      business?.locations[0]?.id ||
      'loc_main';
    const locationName =
      business?.locations.find((l) => l.id === locationId)?.name || 'Main Salon Floor';

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

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const aptCounter = 1000 + bundle.appointments.length + 1;
    const aptNumber = `#APT-${aptCounter}`;
    const token = `trk_${generateBusinessSlug(business?.name || 'salon')}_${aptCounter}_${randomSuffix}`;
    const now = new Date().toISOString();

    // Check if customer exists in customer CRM
    let matchedCustomerId: string | undefined;
    const customers = mockLoyaltyService.getCustomers(businessId);
    const existing = customers.find(
      (c) =>
        (input.customerEmail && c.email && c.email.toLowerCase() === input.customerEmail.toLowerCase()) ||
        (input.customerPhone && c.phoneNumber && c.phoneNumber === input.customerPhone)
    );
    if (existing) {
      matchedCustomerId = existing.id;
    }

    const newAppointment: SalonAppointment = {
      id: `apt_${Date.now()}_${randomSuffix}`,
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
            const customers = mockLoyaltyService.getCustomers(bizId);
            let customer = customers.find(
              (c) =>
                (apt.customerEmail && c.email && c.email.toLowerCase() === apt.customerEmail.toLowerCase()) ||
                (apt.customerPhone && c.phoneNumber && c.phoneNumber === apt.customerPhone)
            );
            if (!customer) {
              const res = mockLoyaltyService.addCustomer(bizId, {
                name: apt.customerName,
                email: apt.customerEmail || 'client@example.com',
                phoneNumber: apt.customerPhone || '+1 (555) 000-0000',
              });
              if (res.success && res.customer) {
                customer = res.customer;
              }
            }
            if (customer) {
              mockLoyaltyService.issueStamp({
                businessId: bizId,
                customerId: customer.id,
                staffPin: '7392',
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
    const businesses = mockBusinessService.getAllBusinesses();
    const target = slugOrId.toLowerCase().trim();

    const business = businesses.find((b) => {
      const slug = generateBusinessSlug(b.name).toLowerCase();
      const normTarget = target.replace(/-and-/g, '-');
      const normSlug = slug.replace(/-and-/g, '-');
      // Match exact ID or generated slug or variations (e.g. apex-barbershop-grooming or apex-barbershop-and-grooming)
      return (
        b.id === slugOrId ||
        slug === target ||
        normSlug === normTarget ||
        slug.replace(/-/g, '') === target.replace(/-/g, '') ||
        normTarget.includes(normSlug) ||
        normSlug.includes(normTarget)
      );
    });

    if (!business || business.businessType !== 'salon') {
      return null;
    }

    const enabledServices = this.getServices(business.id).filter((s) => s.isEnabled);
    const activeStaff = this.getStaff(business.id).filter((stf) => stf.isActive);
    const primaryLoc = business.locations[0] || {
      address: 'Downtown Studio',
      phoneNumber: business.phoneNumber,
    };

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: generateBusinessSlug(business.name),
        accentColor: business.accentColor || '#E4C174',
        logoInitial: business.logoInitial || business.name.charAt(0).toUpperCase(),
        currency: business.currency || 'USD',
        currencySymbol: business.currencySymbol || '$',
        timeZone: business.timeZone || 'America/New_York',
        address: primaryLoc.address,
        phoneNumber: business.phoneNumber || '(555) 345-6789',
        cancellationPolicy: 'Appointments may be cancelled or rescheduled up to 2 hours in advance.',
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

export const mockSalonService = new MockSalonService();
