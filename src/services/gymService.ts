import type {
  GymMembershipPlan,
  GymMemberRecord,
  GymCheckInEvent,
  GymClass,
  GymMetrics,
  CreatePlanInput,
  AssignMembershipInput,
  RecordCheckInInput,
  CreateClassInput,
} from '../types/gym';
import { businessService } from './businessService';
import { loyaltyService } from './loyaltyService';

const STORAGE_KEY = 'loyalty_mock_gym_v1';

interface GymBundle {
  plans: GymMembershipPlan[];
  members: GymMemberRecord[];
  checkIns: GymCheckInEvent[];
  classes: GymClass[];
}

class GymService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  private loadData(): Record<string, GymBundle> {
    if (typeof window === 'undefined') return this.getInitialData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const init = this.getInitialData();
        this.saveData(init);
        return init;
      }
      return JSON.parse(raw);
    } catch {
      return this.getInitialData();
    }
  }

  private saveData(data: Record<string, GymBundle>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save gym store to localStorage:', e);
    }
  }

  private getInitialData(): Record<string, GymBundle> {
    const bizId = 'biz_gym_demo';
    const now = new Date().toISOString();
    const today = new Date();

    // Seeded Plans
    const plans: GymMembershipPlan[] = [
      {
        id: 'plan_monthly',
        businessId: bizId,
        name: 'Monthly Unlimited Access',
        description: 'Full cardio, strength floor, locker rooms, and sauna. 30 days recurring membership.',
        planType: 'recurring_monthly',
        durationDays: 30,
        price: 6500, // $65.00
        currency: 'USD',
        hasClassAccess: true,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'plan_punch',
        businessId: bizId,
        name: '10-Visit Punch Pass',
        description: 'Prepaid 10 gym floor entries with 6-month validity. Great for traveling fitness regulars.',
        planType: 'visit_pass',
        includedVisits: 10,
        price: 9000, // $90.00
        currency: 'USD',
        hasClassAccess: false,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'plan_class_pack',
        businessId: bizId,
        name: 'Studio Class 8-Pack',
        description: 'Admission to any 8 instructor-led boutique classes (Yoga, HIIT, Spin, Strength).',
        planType: 'class_pack',
        includedVisits: 8,
        price: 12000, // $120.00
        currency: 'USD',
        hasClassAccess: true,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'plan_annual',
        businessId: bizId,
        name: 'Annual VIP All-Access',
        description: 'Full facility and all-studio class access for 365 days with guest passes included.',
        planType: 'recurring_annual',
        durationDays: 365,
        price: 65000, // $650.00
        currency: 'USD',
        hasClassAccess: true,
        isActive: true,
        createdAt: now,
      },
    ];

    // Seeded Members
    const members: GymMemberRecord[] = [
      {
        id: 'mem_sarah',
        businessId: bizId,
        locationId: 'loc_gym_main',
        customerId: 'cust_sarah_01',
        customerName: 'Sarah Miller',
        customerEmail: 'sarah.m@example.com',
        customerPhone: '+1 (555) 234-5678',
        planId: 'plan_monthly',
        planName: 'Monthly Unlimited Access',
        planType: 'recurring_monthly',
        startDate: new Date(today.getTime() - 86400000 * 10).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 20).toISOString().split('T')[0],
        status: 'active',
        lastCheckInAt: new Date(today.getTime() - 86400000 * 1).toISOString(),
        createdAt: now,
      },
      {
        id: 'mem_david',
        businessId: bizId,
        locationId: 'loc_gym_main',
        customerId: 'cust_david_02',
        customerName: 'David Kim',
        customerEmail: 'david.k@example.com',
        customerPhone: '+1 (555) 567-8901',
        planId: 'plan_punch',
        planName: '10-Visit Punch Pass',
        planType: 'visit_pass',
        startDate: new Date(today.getTime() - 86400000 * 14).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 160).toISOString().split('T')[0],
        totalVisitsAllowed: 10,
        remainingVisits: 7,
        status: 'active',
        lastCheckInAt: new Date(today.getTime() - 86400000 * 2).toISOString(),
        createdAt: now,
      },
      {
        id: 'mem_chloe',
        businessId: bizId,
        locationId: 'loc_gym_main',
        customerId: 'cust_chloe_03',
        customerName: 'Chloe Bennett',
        customerEmail: 'chloe.b@example.com',
        customerPhone: '+1 (555) 456-7890',
        planId: 'plan_class_pack',
        planName: 'Studio Class 8-Pack',
        planType: 'class_pack',
        startDate: new Date(today.getTime() - 86400000 * 5).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 90).toISOString().split('T')[0],
        totalVisitsAllowed: 8,
        remainingVisits: 6,
        status: 'active',
        lastCheckInAt: new Date(today.getTime() - 86400000 * 3).toISOString(),
        createdAt: now,
      },
      {
        id: 'mem_marcus',
        businessId: bizId,
        locationId: 'loc_gym_main',
        customerId: 'cust_marcus_09',
        customerName: 'Marcus Lee',
        customerEmail: 'marcus.l@example.com',
        planId: 'plan_monthly',
        planName: 'Monthly Unlimited Access',
        planType: 'recurring_monthly',
        startDate: new Date(today.getTime() - 86400000 * 45).toISOString().split('T')[0],
        endDate: new Date(today.getTime() - 86400000 * 15).toISOString().split('T')[0],
        status: 'expired',
        lastCheckInAt: new Date(today.getTime() - 86400000 * 16).toISOString(),
        createdAt: now,
      },
    ];

    // Seeded Classes
    const classes: GymClass[] = [
      {
        id: 'cls_hiit',
        businessId: bizId,
        locationId: 'loc_gym_main',
        name: 'HIIT Power Surge',
        description: 'High-intensity interval training focusing on functional athleticism and endurance.',
        instructorName: 'Coach Alex',
        room: 'Studio A (Main Turf)',
        startTime: '08:00 AM',
        endTime: '09:00 AM',
        dayOfWeek: today.getDay(),
        capacity: 12,
        enrolledMemberIds: ['mem_sarah'],
        enrolledMembers: [
          { memberId: 'mem_sarah', memberName: 'Sarah Miller', enrolledAt: now },
        ],
        status: 'published',
        createdAt: now,
      },
      {
        id: 'cls_yoga',
        businessId: bizId,
        locationId: 'loc_gym_main',
        name: 'Sunset Vinyasa Yoga',
        description: 'Dynamic flow synchronizing breath with movement. Deep hip and shoulder openers.',
        instructorName: 'Maya Lin',
        room: 'Zen Studio 2',
        startTime: '06:30 PM',
        endTime: '07:30 PM',
        dayOfWeek: today.getDay(),
        capacity: 15,
        enrolledMemberIds: ['mem_chloe'],
        enrolledMembers: [
          { memberId: 'mem_chloe', memberName: 'Chloe Bennett', enrolledAt: now },
        ],
        status: 'published',
        createdAt: now,
      },
    ];

    // Seeded Check-In
    const checkIns: GymCheckInEvent[] = [
      {
        id: 'chk_seed_101',
        businessId: bizId,
        locationId: 'loc_gym_main',
        locationName: 'Downtown Training Center',
        memberId: 'mem_sarah',
        customerId: 'cust_sarah_01',
        memberName: 'Sarah Miller',
        membershipId: 'mem_sarah',
        planName: 'Monthly Unlimited Access',
        timestamp: new Date(today.getTime() - 3600000 * 2).toISOString(),
        staffActor: 'Front Desk',
        checkInSource: 'front_desk',
        loyaltyIssued: true,
        idempotencyKey: 'chk_seed_sarah_today',
      },
    ];

    return {
      [bizId]: {
        plans,
        members,
        checkIns,
        classes,
      },
      biz_user_primary: { plans: [], members: [], checkIns: [], classes: [] },
      biz_salon_demo: { plans: [], members: [], checkIns: [], classes: [] },
      biz_retail_demo: { plans: [], members: [], checkIns: [], classes: [] },
    };
  }

  private getBundle(businessId: string): GymBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = {
        plans: [],
        members: [],
        checkIns: [],
        classes: [],
      };
      this.saveData(data);
    }
    return data[businessId];
  }

  // =========================================================================
  // MEMBERSHIP PLANS
  // =========================================================================

  getPlans(businessId: string): GymMembershipPlan[] {
    return this.getBundle(businessId).plans.filter((p) => p.isActive);
  }

  getAllPlans(businessId: string): GymMembershipPlan[] {
    return this.getBundle(businessId).plans;
  }

  createPlan(input: CreatePlanInput): { success: boolean; plan?: GymMembershipPlan; error?: string } {
    if (!input.name.trim()) {
      return { success: false, error: 'Plan name is required.' };
    }
    if (input.price < 0 || isNaN(input.price)) {
      return { success: false, error: 'Valid plan price is required.' };
    }

    const data = this.loadData();
    const bundle = data[input.businessId] || this.getBundle(input.businessId);

    const newPlan: GymMembershipPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      name: input.name.trim(),
      description: input.description.trim(),
      planType: input.planType,
      durationDays: input.durationDays,
      includedVisits: input.includedVisits,
      price: Math.round(input.price),
      currency: input.currency || 'USD',
      hasClassAccess: input.hasClassAccess ?? false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    bundle.plans.push(newPlan);
    data[input.businessId] = bundle;
    this.saveData(data);

    return { success: true, plan: newPlan };
  }

  // =========================================================================
  // MEMBERS
  // =========================================================================

  getMembers(
    businessId: string,
    search?: string,
    statusFilter?: string
  ): GymMemberRecord[] {
    const bundle = this.getBundle(businessId);
    let list = bundle.members;

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.customerName.toLowerCase().includes(q) ||
          m.planName.toLowerCase().includes(q) ||
          (m.customerEmail && m.customerEmail.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getMember(businessId: string, memberId: string): GymMemberRecord | null {
    const bundle = this.getBundle(businessId);
    return bundle.members.find((m) => m.id === memberId) || null;
  }

  assignMembership(
    businessId: string,
    input: AssignMembershipInput
  ): { success: boolean; member?: GymMemberRecord; error?: string } {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const plan = bundle.plans.find((p) => p.id === input.planId);

    if (!plan) {
      return { success: false, error: 'Membership plan not found.' };
    }

    const business = businessService.getAllBusinesses().find((b) => b.id === businessId);
    const locationId = input.locationId || business?.activeLocationId || 'loc_gym_main';

    const startDate = input.startDate || new Date().toISOString().split('T')[0];
    let endDate: string | undefined = undefined;

    if (plan.durationDays) {
      const startObj = new Date(startDate);
      const endObj = new Date(startObj.getTime() + plan.durationDays * 86400000);
      endDate = endObj.toISOString().split('T')[0];
    } else if (plan.planType === 'visit_pass' || plan.planType === 'class_pack') {
      // 180 days validity default for prepaid passes
      const startObj = new Date(startDate);
      const endObj = new Date(startObj.getTime() + 180 * 86400000);
      endDate = endObj.toISOString().split('T')[0];
    }

    const newMember: GymMemberRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      locationId,
      customerId: input.customerId,
      customerName: input.customerName || 'Fitness Member',
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      planId: plan.id,
      planName: plan.name,
      planType: plan.planType,
      startDate,
      endDate,
      totalVisitsAllowed: plan.includedVisits,
      remainingVisits: plan.includedVisits,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    bundle.members.unshift(newMember);
    data[businessId] = bundle;
    this.saveData(data);

    return { success: true, member: newMember };
  }

  // =========================================================================
  // VISIT CHECK-IN SYSTEM
  // =========================================================================

  recordCheckIn(
    businessId: string,
    input: RecordCheckInInput
  ): {
    success: boolean;
    checkIn?: GymCheckInEvent;
    remainingVisits?: number;
    error?: string;
  } {
    const member = this.getMember(businessId, input.memberId);
    if (!member) {
      return { success: false, error: 'Member record not found.' };
    }

    // 1. Membership status validation
    if (member.status !== 'active') {
      return {
        success: false,
        error: `Check-in denied: Membership is currently ${member.status.toUpperCase()}.`,
      };
    }

    // 2. Expiration date validation
    const todayStr = new Date().toISOString().split('T')[0];
    if (member.endDate && member.endDate < todayStr) {
      return {
        success: false,
        error: `Check-in denied: Membership expired on ${member.endDate}.`,
      };
    }

    // 3. Visit Allowance validation (Punch Pass / Class Pack)
    if (member.remainingVisits !== undefined) {
      if (member.remainingVisits <= 0) {
        return {
          success: false,
          error: 'Check-in denied: Pass has 0 remaining visits.',
        };
      }
    }

    // 4. Duplicate submission protection (prevent double-clicks or multiple check-ins within 5 min)
    const idempotencyKey =
      input.idempotencyKey ||
      `chk_${member.id}_${todayStr}_${Math.floor(Date.now() / 300000)}`; // 5-min bucket

    const lockKey = `${businessId}_${idempotencyKey}`;
    if (this.inFlightOperations.has(lockKey)) {
      return {
        success: false,
        error: 'Duplicate check-in processing. Please wait a moment.',
      };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const data = this.loadData();
      const bundle = data[businessId] || this.getBundle(businessId);

      // Check if duplicate already exists
      const duplicate = bundle.checkIns.find(
        (c) => c.idempotencyKey === idempotencyKey
      );
      if (duplicate) {
        return {
          success: false,
          error: `Duplicate check-in prevented: ${member.customerName} was already checked in today at ${new Date(duplicate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        };
      }

      // Update remaining visits for pass/pack
      const memIndex = bundle.members.findIndex((m) => m.id === member.id);
      let remainingVisitsAfter: number | undefined = undefined;

      if (member.remainingVisits !== undefined) {
        const newRemaining = member.remainingVisits - 1;
        bundle.members[memIndex].remainingVisits = newRemaining;
        remainingVisitsAfter = newRemaining;
        if (newRemaining === 0) {
          bundle.members[memIndex].status = 'expired';
        }
      }

      const now = new Date().toISOString();
      bundle.members[memIndex].lastCheckInAt = now;

      // Check loyalty stamp issuance
      let loyaltyIssued = false;
      try {
        const res = loyaltyService.issueStamp({
          businessId,
          customerId: member.customerId,
          locationId: member.locationId,
          staffPin: input.staffPin || '8831',
          idempotencyKey,
        });
        loyaltyIssued = res.success;
      } catch (e) {
        console.warn('Loyalty gym check-in stamp notice:', e);
      }

      const checkInEvent: GymCheckInEvent = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId,
        locationId: member.locationId,
        locationName: 'Downtown Training Center',
        memberId: member.id,
        customerId: member.customerId,
        memberName: member.customerName,
        membershipId: member.id,
        planName: member.planName,
        timestamp: now,
        staffActor: input.staffPin ? `Staff PIN: ${input.staffPin}` : 'Front Desk',
        checkInSource: input.checkInSource || 'front_desk',
        remainingVisitsAfter,
        loyaltyIssued,
        idempotencyKey,
      };

      bundle.checkIns.unshift(checkInEvent);
      data[businessId] = bundle;
      this.saveData(data);

      return {
        success: true,
        checkIn: checkInEvent,
        remainingVisits: remainingVisitsAfter,
      };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  getCheckIns(businessId: string): GymCheckInEvent[] {
    return this.getBundle(businessId).checkIns;
  }

  // =========================================================================
  // CLASS SCHEDULING & ENROLLMENT
  // =========================================================================

  getClasses(businessId: string): GymClass[] {
    return this.getBundle(businessId).classes;
  }

  createClass(input: CreateClassInput): { success: boolean; gymClass?: GymClass; error?: string } {
    if (!input.name.trim()) {
      return { success: false, error: 'Class title is required.' };
    }
    if (input.capacity <= 0 || isNaN(input.capacity)) {
      return { success: false, error: 'Valid class capacity is required.' };
    }

    const data = this.loadData();
    const bundle = data[input.businessId] || this.getBundle(input.businessId);

    const newClass: GymClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      locationId: input.locationId || 'loc_gym_main',
      name: input.name.trim(),
      description: input.description.trim(),
      instructorName: input.instructorName.trim(),
      room: input.room?.trim() || 'Studio A',
      startTime: input.startTime,
      endTime: input.endTime,
      dayOfWeek: input.dayOfWeek ?? new Date().getDay(),
      capacity: input.capacity,
      enrolledMemberIds: [],
      enrolledMembers: [],
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    bundle.classes.push(newClass);
    data[input.businessId] = bundle;
    this.saveData(data);

    return { success: true, gymClass: newClass };
  }

  cancelClass(businessId: string, classId: string): boolean {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const index = bundle.classes.findIndex((c) => c.id === classId);
    if (index === -1) return false;

    bundle.classes[index].status = 'cancelled';
    data[businessId] = bundle;
    this.saveData(data);
    return true;
  }

  enrollInClass(
    businessId: string,
    classId: string,
    memberId: string
  ): { success: boolean; error?: string } {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const clsIndex = bundle.classes.findIndex((c) => c.id === classId);
    const member = bundle.members.find((m) => m.id === memberId);

    if (clsIndex === -1) {
      return { success: false, error: 'Class not found.' };
    }
    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    const cls = bundle.classes[clsIndex];

    if (cls.status === 'cancelled') {
      return { success: false, error: 'Cannot enroll in a cancelled class.' };
    }

    // Capacity limit enforcement
    if (cls.enrolledMemberIds.length >= cls.capacity) {
      return { success: false, error: `Class is fully booked (capacity: ${cls.capacity}).` };
    }

    // Duplicate enrollment prevention
    if (cls.enrolledMemberIds.includes(memberId)) {
      return { success: false, error: `${member.customerName} is already enrolled in this class.` };
    }

    cls.enrolledMemberIds.push(memberId);
    cls.enrolledMembers.push({
      memberId: member.id,
      memberName: member.customerName,
      enrolledAt: new Date().toISOString(),
    });

    bundle.classes[clsIndex] = cls;
    data[businessId] = bundle;
    this.saveData(data);

    return { success: true };
  }

  // =========================================================================
  // OVERVIEW METRICS
  // =========================================================================

  getGymMetrics(businessId: string): GymMetrics {
    const bundle = this.getBundle(businessId);
    const todayStr = new Date().toISOString().split('T')[0];

    const activeMemberships = bundle.members.filter((m) => m.status === 'active').length;
    const visitsToday = bundle.checkIns.filter((c) => c.timestamp.startsWith(todayStr)).length;

    // Expiring memberships: active with endDate within 7 days
    const nextWeekStr = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const expiringMemberships = bundle.members.filter(
      (m) => m.status === 'active' && m.endDate && m.endDate >= todayStr && m.endDate <= nextWeekStr
    ).length;

    const upcomingClasses = bundle.classes.filter((c) => c.status === 'published').length;

    const totalCap = bundle.classes.reduce((acc, c) => acc + c.capacity, 0);
    const totalEnrolled = bundle.classes.reduce((acc, c) => acc + c.enrolledMemberIds.length, 0);
    const classOccupancyPercent = totalCap > 0 ? Math.round((totalEnrolled / totalCap) * 100) : 0;

    return {
      activeMemberships,
      visitsToday,
      expiringMemberships,
      upcomingClasses,
      classOccupancyPercent,
    };
  }

  // =========================================================================
  // PUBSUB REACTIVE SUBSCRIPTION
  // =========================================================================

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in gymService listener:', e);
      }
    }
  }
}

export const gymService = new GymService();
