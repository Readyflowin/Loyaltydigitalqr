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
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId } from '../lib/ids';
import { actorLabel } from '../lib/actor';
import { businessService } from './businessService';
import { loyaltyService } from './loyaltyService';
import { localDateKey, isLocalToday } from '../utils/dates';

interface GymBundle {
  plans: GymMembershipPlan[];
  members: GymMemberRecord[];
  checkIns: GymCheckInEvent[];
  classes: GymClass[];
}

/**
 * Gym plans, members, check-ins and classes (members only), persisted per business:
 *   businesses/{id}/gymPlans, gymMembers, gymCheckIns, gymClasses
 */
export const GYM_SPEC: ModuleSpec<GymBundle> = {
  name: 'gym',
  arrays: [
    { key: 'plans', collection: 'gymPlans' },
    { key: 'members', collection: 'gymMembers' },
    {
      key: 'checkIns',
      collection: 'gymCheckIns',
      recent: { orderBy: 'timestamp', max: 1000 },
      sort: (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')),
    },
    { key: 'classes', collection: 'gymClasses' },
  ],
  empty: () => ({ plans: [], members: [], checkIns: [], classes: [] }),
};
bizStore.register(GYM_SPEC);

class GymService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): Record<string, GymBundle> {
    return bizStore.getAll(GYM_SPEC);
  }

  private saveData(data: Record<string, GymBundle>): void {
    bizStore.saveAll(GYM_SPEC, data);
    this.notifyListeners();
  }

  private getBundle(businessId: string): GymBundle {
    return bizStore.getBundle(GYM_SPEC, businessId);
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
      id: `plan_${newId()}`,
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

    const business = businessService.getBusinessById(businessId);
    const locationId = input.locationId || business?.activeLocationId || 'loc_gym_main';

    const startDate = input.startDate || localDateKey();
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
      id: `mem_${newId()}`,
      businessId,
      locationId,
      customerId: input.customerId,
      customerName: input.customerName || 'Fitness Member',
      pricePaidMinor: plan.price,
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
    if (input.staffPin && !businessService.verifyStaffPin(businessId, input.staffPin)) {
      return { success: false, error: 'Invalid staff PIN.' };
    }

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
    const todayStr = localDateKey();
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
          idempotencyKey,
        });
        loyaltyIssued = res.success;
      } catch (e) {
        console.warn('Loyalty gym check-in stamp notice:', e);
      }

      const checkInEvent: GymCheckInEvent = {
        id: `chk_${newId()}`,
        businessId,
        locationId: member.locationId,
        locationName: 'Downtown Training Center',
        memberId: member.id,
        customerId: member.customerId,
        memberName: member.customerName,
        membershipId: member.id,
        planName: member.planName,
        timestamp: now,
        staffActor: actorLabel('Front Desk'),
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
      id: `cls_${newId()}`,
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
    const todayStr = localDateKey();

    const activeMemberships = bundle.members.filter((m) => m.status === 'active').length;
    const visitsToday = bundle.checkIns.filter((c) => isLocalToday(c.timestamp)).length;

    // Expiring memberships: active with endDate within 7 days
    const nextWeekStr = localDateKey(new Date(Date.now() + 86400000 * 7));
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
