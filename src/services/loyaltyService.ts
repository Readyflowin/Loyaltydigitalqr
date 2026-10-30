/**
 * Loyalty program, customer CRM, stamp issuance, rewards and QR codes.
 * Persisted per business in Firestore via bizStore:
 *   businesses/{id}/config/loyaltyProgram
 *   businesses/{id}/customers, loyaltyEvents, qrCodes
 */

import type {
  LoyaltyProgramConfig,
  CustomerRecord,
  CustomerReward,
  LoyaltyEvent,
  QrCodeDefinition,
} from '../types/loyalty';
import { doc, setDoc, writeBatch, type DocumentData } from 'firebase/firestore';
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { db, getPublicAppOrigin } from '../lib/firebase';
import { newId, shortCode } from '../lib/ids';
import { businessService } from './businessService';
import { actorLabel } from '../lib/actor';

interface BusinessLoyaltyBundle {
  program: LoyaltyProgramConfig;
  customers: CustomerRecord[];
  events: LoyaltyEvent[];
  qrCodes: QrCodeDefinition[];
}

type StorageSchema = Record<string, BusinessLoyaltyBundle>;

/** Digits only, used as the per-business phone uniqueness key. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * What a customer sees on their own card page (businesses/{id}/memberCards/{memberId}).
 * Deliberately excludes staff notes, contact details and audit data.
 */
export function toMemberCard(customer: DocumentData): DocumentData | null {
  if (!customer || customer.status === 'archived') return null;
  const rewards = Array.isArray(customer.rewards) ? customer.rewards : [];
  return {
    id: customer.id,
    firstName: String(customer.name || '').split(' ')[0],
    currentStamps: customer.currentStamps || 0,
    lifetimeStamps: customer.lifetimeStamps || 0,
    totalVisits: customer.totalVisits || 0,
    enrolledAt: customer.enrolledAt || null,
    lastVisitAt: customer.lastVisitAt || null,
    rewards: rewards.map((r: DocumentData) => ({
      id: r.id,
      rewardDescription: r.rewardDescription,
      voucherCode: r.voucherCode,
      unlockedAt: r.unlockedAt,
      isRedeemed: !!r.isRedeemed,
      redeemedAt: r.redeemedAt || null,
    })),
  };
}

const byNewest = (field: string) => (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(b[field] || '').localeCompare(String(a[field] || ''));

function defaultProgram(businessId: string): LoyaltyProgramConfig {
  const biz = businessService.getBusinessById(businessId);
  return {
    id: `prog_${businessId}`,
    businessId,
    name: biz?.programName || 'Loyalty Club',
    type: 'stamp_card',
    stampsRequired: biz?.stampsRequired || 8,
    rewardDescription: biz?.rewardDescription || '1 free item',
    terms: 'Not redeemable for cash. One stamp per qualifying visit.',
    accentColor: biz?.accentColor || '#3027F5',
    status: 'active',
    createdAt: biz?.createdAt || new Date().toISOString(),
    updatedAt: biz?.createdAt || new Date().toISOString(),
  };
}

export const LOYALTY_SPEC: ModuleSpec<BusinessLoyaltyBundle> = {
  name: 'loyalty',
  arrays: [
    {
      key: 'customers',
      collection: 'customers',
      sort: byNewest('enrolledAt'),
      mirror: { collection: 'memberCards', project: toMemberCard },
    },
    {
      key: 'events',
      collection: 'loyaltyEvents',
      sort: byNewest('timestamp'),
      recent: { orderBy: 'timestamp', max: 1000 },
    },
    { key: 'qrCodes', collection: 'qrCodes', sort: byNewest('createdAt') },
  ],
  singles: [{ key: 'program', docId: 'loyaltyProgram', public: true }],
  empty: (businessId) => ({
    program: defaultProgram(businessId),
    customers: [],
    events: [],
    qrCodes: [],
  }),
};
bizStore.register(LOYALTY_SPEC);

class LoyaltyService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): StorageSchema {
    return bizStore.getAll(LOYALTY_SPEC);
  }

  private saveData(data: StorageSchema): void {
    bizStore.saveAll(LOYALTY_SPEC, data);
    this.notifyListeners();
  }

  private getBundle(businessId: string): BusinessLoyaltyBundle {
    return bizStore.getBundle(LOYALTY_SPEC, businessId);
  }

  // =========================================================================
  // PROGRAM CONFIGURATION
  // =========================================================================

  getProgram(businessId: string): LoyaltyProgramConfig {
    return this.getBundle(businessId).program;
  }

  saveProgram(businessId: string, updates: Partial<LoyaltyProgramConfig>): LoyaltyProgramConfig {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);

    const updated: LoyaltyProgramConfig = {
      ...bundle.program,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    bundle.program = updated;

    // Record an audit event for program updates
    bundle.events.unshift({
      id: `evt_prog_${newId()}`,
      businessId,
      programId: updated.id,
      type: 'program_updated',
      timestamp: new Date().toISOString(),
      staffIdentifier: actorLabel('Owner'),
      details: `Program updated: ${updated.name} (${updated.stampsRequired} visits to earn ${updated.rewardDescription}).`,
    });

    data[businessId] = bundle;
    this.saveData(data);
    return updated;
  }

  // =========================================================================
  // CUSTOMER CRM
  // =========================================================================

  getCustomers(businessId: string): CustomerRecord[] {
    return this.getBundle(businessId).customers;
  }

  getCustomer(businessId: string, customerId: string): CustomerRecord | null {
    const customers = this.getCustomers(businessId);
    return customers.find((c) => c.id === customerId) || null;
  }

  addCustomer(
    businessId: string,
    customerData: {
      name: string;
      email?: string;
      phoneNumber?: string;
      notes?: string;
    }
  ): { success: boolean; customer?: CustomerRecord; error?: string } {
    const cleanName = customerData.name?.trim();
    if (!cleanName) {
      return { success: false, error: 'Customer name is required.' };
    }

    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);

    // Duplicate check: match by email or phone
    const cleanEmail = customerData.email?.trim().toLowerCase();
    const cleanPhone = customerData.phoneNumber?.trim();

    if (cleanEmail) {
      const dupEmail = bundle.customers.find((c) => c.email?.toLowerCase() === cleanEmail);
      if (dupEmail) {
        return {
          success: false,
          error: `A member with email "${cleanEmail}" is already enrolled (${dupEmail.name}).`,
        };
      }
    }

    if (cleanPhone) {
      const dupPhone = bundle.customers.find(
        (c) => c.phoneNumber && normalizePhone(c.phoneNumber) === normalizePhone(cleanPhone)
      );
      if (dupPhone) {
        return {
          success: false,
          error: `A member with phone number "${cleanPhone}" is already enrolled (${dupPhone.name}).`,
        };
      }
    }

    const newCustomer: CustomerRecord = {
      id: `cust_${newId()}`,
      businessId,
      name: cleanName,
      email: cleanEmail || undefined,
      phoneNumber: cleanPhone || undefined,
      enrolledAt: new Date().toISOString(),
      totalVisits: 0,
      currentStamps: 0,
      lifetimeStamps: 0,
      rewards: [],
      status: 'active',
      notes: customerData.notes?.trim() || undefined,
    };

    bundle.customers.unshift(newCustomer);

    // Record enrollment audit event
    bundle.events.unshift({
      id: `evt_enr_${newId()}`,
      businessId,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      programId: bundle.program.id,
      type: 'customer_enrolled',
      timestamp: new Date().toISOString(),
      staffIdentifier: actorLabel('Counter Staff'),
      details: `Enrolled new member: ${newCustomer.name}.`,
    });

    data[businessId] = bundle;
    this.saveData(data);
    if (newCustomer.phoneNumber) {
      // Reserve the number so the same customer cannot self-enrol twice via QR.
      setDoc(doc(db, 'businesses', businessId, 'customerPhones', normalizePhone(newCustomer.phoneNumber)), {
        customerId: newCustomer.id,
      }).catch((err) => console.warn('Could not index customer phone', err));
    }
    return { success: true, customer: newCustomer };
  }

  /**
   * Customer joins from the public loyalty card page (scanned QR code).
   * Runs as one batch so a phone number that is already registered fails
   * the whole enrolment (rules only allow creating, never overwriting, the index).
   */
  async selfEnroll(
    businessId: string,
    input: { name: string; phoneNumber: string; email?: string; marketingConsent: boolean }
  ): Promise<{ success: true; memberId: string } | { success: false; error: string; alreadyMember?: boolean }> {
    const name = input.name.trim();
    const phone = input.phoneNumber.trim();
    const phoneKey = normalizePhone(phone);
    if (name.length < 2) return { success: false, error: 'Please enter your name.' };
    if (phoneKey.length < 7) return { success: false, error: 'Please enter a valid phone number.' };
    const email = input.email?.trim().toLowerCase() || undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid email address or leave it blank.' };
    }

    const program = this.getProgram(businessId);
    if (program.status !== 'active') {
      return { success: false, error: 'This loyalty program is paused right now. Please ask at the counter.' };
    }

    const now = new Date().toISOString();
    const customer: CustomerRecord = {
      id: `cust_${newId()}`,
      businessId,
      name,
      email,
      phoneNumber: phone,
      enrolledAt: now,
      totalVisits: 0,
      currentStamps: 0,
      lifetimeStamps: 0,
      rewards: [],
      status: 'active',
      marketingConsent: {
        email: input.marketingConsent && !!email,
        sms: input.marketingConsent,
        consentDate: input.marketingConsent ? now : undefined,
      },
    };
    const event: LoyaltyEvent = {
      id: `evt_enr_${newId()}`,
      businessId,
      customerId: customer.id,
      customerName: name,
      programId: program.id,
      type: 'customer_enrolled',
      timestamp: now,
      staffIdentifier: 'Self sign-up (QR)',
      details: `${name} joined via QR code.`,
    };

    const clean = <T,>(v: T) => JSON.parse(JSON.stringify(v));
    const batch = writeBatch(db);
    batch.set(doc(db, 'businesses', businessId, 'customerPhones', phoneKey), { customerId: customer.id });
    batch.set(doc(db, 'businesses', businessId, 'customers', customer.id), clean(customer));
    batch.set(doc(db, 'businesses', businessId, 'memberCards', customer.id), toMemberCard(clean(customer)));
    batch.set(doc(db, 'businesses', businessId, 'loyaltyEvents', event.id), clean(event));
    try {
      await batch.commit();
      return { success: true, memberId: customer.id };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'permission-denied') {
        return {
          success: false,
          alreadyMember: true,
          error: 'This phone number is already registered. Show your number at the counter to collect stamps.',
        };
      }
      return { success: false, error: 'Could not complete sign-up. Please check your connection and try again.' };
    }
  }

  updateCustomer(
    businessId: string,
    customerId: string,
    updates: Partial<CustomerRecord>
  ): { success: boolean; customer?: CustomerRecord; error?: string } {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const index = bundle.customers.findIndex((c) => c.id === customerId);

    if (index === -1) {
      return { success: false, error: 'Customer not found.' };
    }

    // Check duplicate email or phone if changing
    const cleanEmail = updates.email?.trim().toLowerCase();
    const cleanPhone = updates.phoneNumber?.trim();

    if (cleanEmail) {
      const dup = bundle.customers.find((c) => c.id !== customerId && c.email?.toLowerCase() === cleanEmail);
      if (dup) {
        return { success: false, error: `Another member already uses email "${cleanEmail}".` };
      }
    }

    if (cleanPhone) {
      const dup = bundle.customers.find((c) => c.id !== customerId && c.phoneNumber === cleanPhone);
      if (dup) {
        return { success: false, error: `Another member already uses phone "${cleanPhone}".` };
      }
    }

    const updated: CustomerRecord = {
      ...bundle.customers[index],
      ...updates,
      name: updates.name ? updates.name.trim() : bundle.customers[index].name,
      email: cleanEmail !== undefined ? (cleanEmail || undefined) : bundle.customers[index].email,
      phoneNumber: cleanPhone !== undefined ? (cleanPhone || undefined) : bundle.customers[index].phoneNumber,
    };

    bundle.customers[index] = updated;
    data[businessId] = bundle;
    this.saveData(data);
    return { success: true, customer: updated };
  }

  archiveCustomer(businessId: string, customerId: string): boolean {
    const res = this.updateCustomer(businessId, customerId, { status: 'archived' });
    return res.success;
  }

  // =========================================================================
  // ATOMIC STAMP ISSUANCE & REWARD UNLOCKING
  // =========================================================================

  issueStamp(params: {
    businessId: string;
    locationId?: string;
    customerId: string;
    staffPin?: string;
    stampsCount?: number;
    idempotencyKey?: string;
  }): {
    success: boolean;
    updatedBalance?: number;
    rewardUnlocked?: boolean;
    error?: string;
  } {
    const { businessId, locationId, customerId, staffPin, idempotencyKey } = params;
    const stampsToAdd = Math.max(1, params.stampsCount || 1);

    // Concurrency / double-click protection via inFlight lock
    const lockKey = `${businessId}_${customerId}_stamp`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'A stamp issuance is already processing for this customer.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const data = this.loadData();
      const bundle = data[businessId] || this.getBundle(businessId);
      const customer = bundle.customers.find((c) => c.id === customerId);

      if (!customer) {
        return { success: false, error: 'Customer not found.' };
      }

      if (customer.status === 'archived') {
        return { success: false, error: 'Cannot issue stamps to an archived customer profile.' };
      }

      const program = bundle.program;
      if (program.status === 'paused') {
        return { success: false, error: 'Loyalty program is currently paused. Resume program to issue stamps.' };
      }

      // Staff PIN verification against the business's configured location PINs
      if (staffPin !== undefined && staffPin.trim().length > 0) {
        if (!businessService.verifyStaffPin(businessId, staffPin, locationId)) {
          return { success: false, error: 'Invalid staff validation PIN. Access denied.' };
        }
      }

      // Check idempotency if provided
      if (idempotencyKey) {
        const existingEvent = bundle.events.find((e) => e.idempotencyKey === idempotencyKey);
        if (existingEvent) {
          return {
            success: true,
            updatedBalance: customer.currentStamps,
            rewardUnlocked: false,
          };
        }
      }

      const required = program.stampsRequired;
      const prevStamps = customer.currentStamps;
      const totalNewStamps = prevStamps + stampsToAdd;

      let rewardUnlocked = false;
      let newBalance = totalNewStamps;

      if (totalNewStamps >= required) {
        rewardUnlocked = true;
        newBalance = totalNewStamps % required; // remaining overflow towards next cycle

        const newReward: CustomerReward = {
          id: `rew_${newId()}`,
          rewardDescription: program.rewardDescription,
          unlockedAt: new Date().toISOString(),
          isRedeemed: false,
          voucherCode: `REW-${shortCode(5)}`,
        };
        customer.rewards.unshift(newReward);

        // Record reward unlocked event
        bundle.events.unshift({
          id: `evt_rew_${newId()}`,
          businessId,
          locationId,
          customerId: customer.id,
          customerName: customer.name,
          programId: program.id,
          type: 'reward_unlocked',
          timestamp: new Date().toISOString(),
          staffIdentifier: actorLabel('Counter Staff'),
          rewardDescription: program.rewardDescription,
          voucherCode: newReward.voucherCode,
          details: `Milestone reached! Voucher #${newReward.voucherCode} (${program.rewardDescription}) unlocked.`,
        });
      }

      // Update customer record
      customer.currentStamps = newBalance;
      customer.lifetimeStamps += stampsToAdd;
      customer.totalVisits += 1;
      customer.lastVisitAt = new Date().toISOString();

      // Record stamp event
      const eventId = `evt_st_${newId()}`;
      bundle.events.unshift({
        id: eventId,
        businessId,
        locationId,
        customerId: customer.id,
        customerName: customer.name,
        programId: program.id,
        type: 'stamp_issued',
        timestamp: new Date().toISOString(),
        staffIdentifier: actorLabel('Counter Staff'),
        stampsIssued: stampsToAdd,
        idempotencyKey,
        details: `Issued ${stampsToAdd} stamp to ${customer.name}. Progress: ${newBalance}/${required} visits.`,
      });

      data[businessId] = bundle;
      this.saveData(data);

      return {
        success: true,
        updatedBalance: newBalance,
        rewardUnlocked,
      };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  // =========================================================================
  // CONTROLLED REWARD REDEMPTION
  // =========================================================================

  redeemReward(params: {
    businessId: string;
    locationId?: string;
    customerId: string;
    rewardId: string;
    staffPin?: string;
  }): { success: boolean; error?: string } {
    const { businessId, locationId, customerId, rewardId, staffPin } = params;

    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const customer = bundle.customers.find((c) => c.id === customerId);

    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }

    const reward = customer.rewards.find((r) => r.id === rewardId);
    if (!reward) {
      return { success: false, error: 'Reward voucher not found.' };
    }

    if (reward.isRedeemed) {
      return { success: false, error: 'This reward has already been redeemed.' };
    }

    if (staffPin !== undefined && staffPin.trim().length > 0) {
      if (!businessService.verifyStaffPin(businessId, staffPin, locationId)) {
        return { success: false, error: 'Invalid staff validation PIN. Access denied.' };
      }
    }

    // Mark as redeemed
    reward.isRedeemed = true;
    reward.redeemedAt = new Date().toISOString();
    reward.redeemedByStaff = actorLabel('Counter Staff');

    // Record redemption audit event
    bundle.events.unshift({
      id: `evt_rdm_${newId()}`,
      businessId,
      locationId,
      customerId: customer.id,
      customerName: customer.name,
      programId: bundle.program.id,
      type: 'reward_redeemed',
      timestamp: new Date().toISOString(),
      staffIdentifier: reward.redeemedByStaff,
      rewardDescription: reward.rewardDescription,
      voucherCode: reward.voucherCode,
      details: `Redeemed voucher #${reward.voucherCode} (${reward.rewardDescription}) for ${customer.name}.`,
    });

    data[businessId] = bundle;
    this.saveData(data);
    return { success: true };
  }

  // =========================================================================
  // AUDIT EVENTS & RECENT ACTIVITY
  // =========================================================================

  getEvents(businessId: string, limit = 20): LoyaltyEvent[] {
    const events = this.getBundle(businessId).events;
    return events.slice(0, limit);
  }

  // =========================================================================
  // QR STUDIO MANAGEMENT
  // =========================================================================

  getQrCodes(businessId: string): QrCodeDefinition[] {
    return this.getBundle(businessId).qrCodes;
  }

  createQrCode(
    businessId: string,
    data: {
      name: string;
      displayLabel?: string;
      destinationType: QrCodeDefinition['destinationType'];
      targetUrl: string;
      locationId?: string;
    }
  ): QrCodeDefinition {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);

    const baseUrl = getPublicAppOrigin();
    const cleanTarget = data.targetUrl.startsWith('/') ? data.targetUrl : `/${data.targetUrl}`;

    const newQr: QrCodeDefinition = {
      id: `qr_${newId()}`,
      businessId,
      locationId: data.locationId,
      name: data.name.trim(),
      displayLabel: data.displayLabel?.trim() || undefined,
      destinationType: data.destinationType,
      targetUrl: cleanTarget,
      previewUrl: `${baseUrl}${cleanTarget}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bundle.qrCodes.unshift(newQr);
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return newQr;
  }

  updateQrCode(
    businessId: string,
    qrId: string,
    updates: Partial<QrCodeDefinition>
  ): QrCodeDefinition | null {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const index = bundle.qrCodes.findIndex((q) => q.id === qrId);

    if (index === -1) return null;

    const updated: QrCodeDefinition = {
      ...bundle.qrCodes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    bundle.qrCodes[index] = updated;
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return updated;
  }

  toggleQrCodeStatus(businessId: string, qrId: string): QrCodeDefinition | null {
    const qr = this.getQrCodes(businessId).find((q) => q.id === qrId);
    if (!qr) return null;
    const nextStatus = qr.status === 'active' ? 'disabled' : 'active';
    return this.updateQrCode(businessId, qrId, { status: nextStatus });
  }

  deleteQrCode(businessId: string, qrId: string): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const prevLen = bundle.qrCodes.length;
    bundle.qrCodes = bundle.qrCodes.filter((q) => q.id !== qrId);
    if (bundle.qrCodes.length !== prevLen) {
      storageData[businessId] = bundle;
      this.saveData(storageData);
      return true;
    }
    return false;
  }

  // =========================================================================
  // COMPUTED REALTIME METRICS FOR BUSINESS
  // =========================================================================

  getComputedMetrics(businessId: string) {
    const bundle = this.getBundle(businessId);
    const activeCustomers = bundle.customers.filter((c) => c.status === 'active');
    const totalCustomers = activeCustomers.length;

    // Loyalty visits: total recorded visits across all active members
    const loyaltyVisits = activeCustomers.reduce((acc, c) => acc + c.totalVisits, 0);

    // Redeemed rewards: total redeemed reward vouchers
    const rewardsRedeemed = activeCustomers.reduce((acc, c) => acc + c.rewards.filter((r) => r.isRedeemed).length, 0);

    // Active stamps held by active customers
    const activeStamps = activeCustomers.reduce((acc, c) => acc + c.currentStamps, 0);

    // Repeat rate: customers with >= 2 visits
    const repeatCustomers = activeCustomers.filter((c) => c.totalVisits >= 2).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      loyaltyVisits,
      rewardsRedeemed,
      activeStamps,
      repeatRate,
    };
  }

  // =========================================================================
  // SUBSCRIPTION PATTERN
  // =========================================================================

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }
}

export const loyaltyService = new LoyaltyService();
