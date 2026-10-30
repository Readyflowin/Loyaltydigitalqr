/**
 * Mock Loyalty Service & Repository
 * 
 * NOTE: This persistence is for client-side demonstration, testing, and prototype
 * workflows only. In Task 10, all methods here will be replaced by secured cloud
 * persistence and Cloud Functions via Firebase (Firestore & Firebase Auth).
 * 
 * No confidential passwords, secret keys, or real payment credentials are stored.
 */

import type {
  LoyaltyProgramConfig,
  CustomerRecord,
  CustomerReward,
  LoyaltyEvent,
  QrCodeDefinition,
} from '../types/loyalty';
import { mockAuthService } from './mockAuthService';

const STORAGE_KEY = 'loyalty_mock_loyalty_data_v1';

interface BusinessLoyaltyBundle {
  program: LoyaltyProgramConfig;
  customers: CustomerRecord[];
  events: LoyaltyEvent[];
  qrCodes: QrCodeDefinition[];
}

type StorageSchema = Record<string, BusinessLoyaltyBundle>;

class MockLoyaltyService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  /**
   * Generates initial seed data for demonstration workspaces
   */
  private getSeedData(): StorageSchema {
    const completed = mockAuthService.getCompletedOnboarding();
    const draft = mockAuthService.getOnboardingDraft();
    const activeData = completed || (draft && draft.businessName ? draft : null);

    const isIndia = activeData?.region === 'india';
    const primaryProgramName = activeData?.programName || 'Coffee Regulars Club';
    const primaryMilestone = activeData?.stampsRequired || 8;
    const primaryRewardDesc = activeData?.rewardDescription || (isIndia ? 'Buy 8 coffees, get your 9th drink free' : 'Buy 8 coffees, get your 9th drink free');
    const primaryAccent = activeData?.accentColor || '#3027F5';

    // 1. Primary Business (Coffee / Cafe)
    const primaryBundle: BusinessLoyaltyBundle = {
      program: {
        id: 'prog_user_primary',
        businessId: 'biz_user_primary',
        name: primaryProgramName,
        type: 'stamp_card',
        stampsRequired: primaryMilestone,
        rewardDescription: primaryRewardDesc,
        terms: 'Valid at all participating counters. Not redeemable for cash.',
        accentColor: primaryAccent,
        status: 'active',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      customers: [
        {
          id: 'cust_c1',
          businessId: 'biz_user_primary',
          name: 'Sarah Miller',
          email: 'sarah.m@example.com',
          phoneNumber: '+1 (555) 234-8891',
          enrolledAt: '2026-02-14T09:15:00Z',
          lastVisitAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          totalVisits: 15,
          currentStamps: Math.min(primaryMilestone - 1, 7), // 1 stamp away from reward!
          lifetimeStamps: 23,
          rewards: [],
          status: 'active',
          notes: 'Prefers oat milk latte. Visits weekday mornings around 8:30 AM.',
          marketingConsent: {
            email: true,
            sms: true,
            consentDate: '2026-02-14T09:15:00Z',
          },
        },
        {
          id: 'cust_c2',
          businessId: 'biz_user_primary',
          name: 'David Kim',
          email: 'david.kim@example.com',
          phoneNumber: '+1 (555) 456-1120',
          enrolledAt: '2026-01-20T14:30:00Z',
          lastVisitAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          totalVisits: 18,
          currentStamps: 0,
          lifetimeStamps: 24,
          rewards: [
            {
              id: 'rew_unlocked_d1',
              rewardDescription: primaryRewardDesc,
              unlockedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
              isRedeemed: false,
              voucherCode: 'FREE-892',
            },
          ],
          status: 'active',
          notes: 'Reward unlocked on recent counter visit. Ready for barista redemption.',
          marketingConsent: {
            email: true,
            sms: false,
            consentDate: '2026-01-20T14:30:00Z',
          },
        },
        {
          id: 'cust_c3',
          businessId: 'biz_user_primary',
          name: 'Chloe Watson',
          email: 'chloe.w@example.com',
          phoneNumber: '+1 (555) 890-3344',
          enrolledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          lastVisitAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          totalVisits: 1,
          currentStamps: 1,
          lifetimeStamps: 1,
          rewards: [],
          status: 'active',
          notes: 'Enrolled via counter standee QR scan. Added card to Apple Wallet.',
          marketingConsent: {
            email: false,
            sms: true,
            consentDate: '2026-03-01T10:00:00Z',
          },
        },
        {
          id: 'cust_c4',
          businessId: 'biz_user_primary',
          name: 'Liam Patel',
          email: 'liam.patel@example.com',
          phoneNumber: '+1 (555) 678-9901',
          enrolledAt: '2026-02-01T11:00:00Z',
          lastVisitAt: new Date(Date.now() - 42 * 86400 * 1000).toISOString(),
          totalVisits: 3,
          currentStamps: 3,
          lifetimeStamps: 3,
          rewards: [],
          status: 'active',
          notes: 'Regular cold brew subscriber. Works remotely on Thursdays.',
          marketingConsent: {
            email: true,
            sms: true,
            consentDate: '2026-02-01T11:00:00Z',
          },
        },
        {
          id: 'cust_c5',
          businessId: 'biz_user_primary',
          name: 'Emma Vance',
          email: 'emma.v@example.com',
          phoneNumber: '+1 (555) 901-2244',
          enrolledAt: '2026-01-10T16:20:00Z',
          lastVisitAt: new Date(Date.now() - 65 * 86400 * 1000).toISOString(),
          totalVisits: 14,
          currentStamps: 6,
          lifetimeStamps: 22,
          rewards: [
            {
              id: 'rew_past_e1',
              rewardDescription: primaryRewardDesc,
              unlockedAt: '2026-02-10T12:00:00Z',
              isRedeemed: true,
              redeemedAt: '2026-02-12T15:30:00Z',
              redeemedByStaff: 'Counter PIN 4821',
              voucherCode: 'FREE-104',
            },
          ],
          status: 'active',
          notes: 'Loyal customer since soft opening.',
          marketingConsent: {
            email: false,
            sms: false,
          },
        },
      ],
      events: [
        {
          id: 'evt_p1',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          customerId: 'cust_c1',
          customerName: 'Sarah Miller',
          programId: 'prog_user_primary',
          type: 'stamp_issued',
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          staffIdentifier: 'Counter PIN 4821',
          stampsIssued: 1,
          details: 'Recorded stamp 7 of 8 for Sarah Miller at Downtown Main Counter.',
        },
        {
          id: 'evt_p2',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          customerId: 'cust_c2',
          customerName: 'David Kim',
          programId: 'prog_user_primary',
          type: 'reward_unlocked',
          timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          staffIdentifier: 'System Auto-Check',
          rewardDescription: primaryRewardDesc,
          voucherCode: 'FREE-892',
          details: `Milestone reached (${primaryMilestone} stamps). Reward voucher #FREE-892 generated.`,
        },
        {
          id: 'evt_p3',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          customerId: 'cust_c3',
          customerName: 'Chloe Watson',
          programId: 'prog_user_primary',
          type: 'customer_enrolled',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          staffIdentifier: 'Self-Enrollment QR',
          details: 'Customer joined loyalty program via counter standee QR code.',
        },
      ],
      qrCodes: [
        {
          id: 'qr_c1',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          name: 'Main Counter Standee QR',
          displayLabel: 'Scan to Join & Earn Free Coffee',
          destinationType: 'counter_display',
          targetUrl: '/signup?ref=counter_main',
          previewUrl: 'https://loyaltydigitalqr.com/signup?ref=counter_main',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'qr_c2',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          name: 'Window Sticker Digital Pass',
          displayLabel: 'Add Loyalty Card to Apple & Google Wallet',
          destinationType: 'loyalty_enrollment',
          targetUrl: '/signup?ref=window_sticker',
          previewUrl: 'https://loyaltydigitalqr.com/signup?ref=window_sticker',
          status: 'active',
          createdAt: '2026-03-02T11:00:00Z',
          updatedAt: '2026-03-02T11:00:00Z',
        },
        {
          id: 'qr_c3',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          name: 'Public Web Portal & Menu',
          displayLabel: 'Explore Roast & Brew Specials',
          destinationType: 'business_landing',
          targetUrl: '/industries/cafes',
          previewUrl: 'https://loyaltydigitalqr.com/industries/cafes',
          status: 'active',
          createdAt: '2026-03-03T12:00:00Z',
          updatedAt: '2026-03-03T12:00:00Z',
        },
      ],
    };

    // 2. Secondary Salon Business
    const salonBundle: BusinessLoyaltyBundle = {
      program: {
        id: 'prog_salon_demo',
        businessId: 'biz_salon_demo',
        name: 'VIP Grooming Pass',
        type: 'stamp_card',
        stampsRequired: 6,
        rewardDescription: 'Free scalp treatment or 15% off styling products',
        terms: 'Valid on haircut and styling appointments. Cannot be combined with package deals.',
        accentColor: '#E4C174',
        status: 'active',
        createdAt: '2026-02-15T09:00:00Z',
        updatedAt: '2026-02-15T09:00:00Z',
      },
      customers: [
        {
          id: 'cust_s1',
          businessId: 'biz_salon_demo',
          name: 'Marcus Lee',
          email: 'marcus.l@example.com',
          phoneNumber: '+1 (555) 321-9988',
          enrolledAt: '2026-02-18T10:00:00Z',
          lastVisitAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          totalVisits: 5,
          currentStamps: 5, // 1 visit away from free scalp treatment!
          lifetimeStamps: 5,
          rewards: [],
          status: 'active',
          notes: 'Barber: Jack. Prefers skin fade and hot towel treatment.',
        },
        {
          id: 'cust_s2',
          businessId: 'biz_salon_demo',
          name: 'Elena Rostova',
          email: 'elena.r@example.com',
          phoneNumber: '+1 (555) 765-4321',
          enrolledAt: '2026-01-15T13:00:00Z',
          lastVisitAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          totalVisits: 6,
          currentStamps: 0,
          lifetimeStamps: 6,
          rewards: [
            {
              id: 'rew_unlocked_s2',
              rewardDescription: 'Free scalp treatment or 15% off styling products',
              unlockedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              isRedeemed: false,
              voucherCode: 'GROOM-440',
            },
          ],
          status: 'active',
          notes: 'Unlocked VIP reward. Returning for blowout on Saturday.',
        },
        {
          id: 'cust_s3',
          businessId: 'biz_salon_demo',
          name: 'Tyler Davis',
          email: 'tyler.d@example.com',
          phoneNumber: '+1 (555) 888-2345',
          enrolledAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          lastVisitAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          totalVisits: 1,
          currentStamps: 1,
          lifetimeStamps: 1,
          rewards: [],
          status: 'active',
          notes: 'Walk-in client enrolled via reception QR standee.',
        },
      ],
      events: [
        {
          id: 'evt_s1',
          businessId: 'biz_salon_demo',
          locationId: 'loc_salon_flagship',
          customerId: 'cust_s1',
          customerName: 'Marcus Lee',
          programId: 'prog_salon_demo',
          type: 'stamp_issued',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          staffIdentifier: 'Stylist Jack (PIN 7392)',
          stampsIssued: 1,
          details: 'Recorded visit 5/6 for Marcus Lee at Flagship Studio.',
        },
      ],
      qrCodes: [
        {
          id: 'qr_s1',
          businessId: 'biz_salon_demo',
          locationId: 'loc_salon_flagship',
          name: 'Reception Desk QR Stand',
          displayLabel: 'Scan for VIP Grooming Stamps',
          destinationType: 'counter_display',
          targetUrl: '/signup?ref=salon_reception',
          previewUrl: 'https://loyaltydigitalqr.com/signup?ref=salon_reception',
          status: 'active',
          createdAt: '2026-02-15T09:00:00Z',
          updatedAt: '2026-02-15T09:00:00Z',
        },
      ],
    };

    // 3. Secondary Retail Business
    const retailBundle: BusinessLoyaltyBundle = {
      program: {
        id: 'prog_retail_demo',
        businessId: 'biz_retail_demo',
        name: 'VIP Shopper Circle',
        type: 'stamp_card',
        stampsRequired: 10,
        rewardDescription: '$20 voucher towards next purchase',
        terms: 'Valid on full-price apparel and accessories.',
        accentColor: '#059669',
        status: 'active',
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      customers: [
        {
          id: 'cust_r1',
          businessId: 'biz_retail_demo',
          name: 'Olivia Chen',
          email: 'olivia.c@example.com',
          phoneNumber: '+1 (555) 443-1199',
          enrolledAt: '2026-02-05T12:00:00Z',
          lastVisitAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          totalVisits: 9,
          currentStamps: 9,
          lifetimeStamps: 19,
          rewards: [],
          status: 'active',
          notes: 'Frequent weekend shopper.',
        },
      ],
      events: [],
      qrCodes: [
        {
          id: 'qr_r1',
          businessId: 'biz_retail_demo',
          locationId: 'loc_retail_main',
          name: 'Checkout Register QR Standee',
          displayLabel: 'Join Velvet & Vine VIP Circle',
          destinationType: 'counter_display',
          targetUrl: '/signup?ref=retail_checkout',
          previewUrl: 'https://loyaltydigitalqr.com/signup?ref=retail_checkout',
          status: 'active',
          createdAt: '2026-02-01T10:00:00Z',
          updatedAt: '2026-02-01T10:00:00Z',
        },
      ],
    };

    return {
      biz_user_primary: primaryBundle,
      biz_salon_demo: salonBundle,
      biz_retail_demo: retailBundle,
    };
  }

  /**
   * Loads the full storage schema from localStorage or defaults to fresh seeds
   */
  private loadData(): StorageSchema {
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
      return JSON.parse(raw) as StorageSchema;
    } catch {
      const fallback = this.getSeedData();
      return fallback;
    }
  }

  /**
   * Persists updated storage schema
   */
  private saveData(data: StorageSchema): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to save loyalty mock data to localStorage:', err);
      }
    }
    this.notifyListeners();
  }

  /**
   * Helper to ensure bundle exists for a given business ID
   */
  private getBundle(businessId: string): BusinessLoyaltyBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      // Fallback create minimal bundle for newly added businesses
      data[businessId] = {
        program: {
          id: `prog_${businessId}`,
          businessId,
          name: 'Customer Loyalty Club',
          type: 'stamp_card',
          stampsRequired: 8,
          rewardDescription: '1 free item or signature service',
          terms: 'Standard terms apply.',
          accentColor: '#3027F5',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        customers: [],
        events: [],
        qrCodes: [],
      };
      this.saveData(data);
    }
    return data[businessId];
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
      id: `evt_prog_${Date.now()}`,
      businessId,
      programId: updated.id,
      type: 'program_updated',
      timestamp: new Date().toISOString(),
      staffIdentifier: 'Merchant Admin',
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
      const dupPhone = bundle.customers.find((c) => c.phoneNumber === cleanPhone);
      if (dupPhone) {
        return {
          success: false,
          error: `A member with phone number "${cleanPhone}" is already enrolled (${dupPhone.name}).`,
        };
      }
    }

    const newCustomer: CustomerRecord = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
      id: `evt_enr_${Date.now()}`,
      businessId,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      programId: bundle.program.id,
      type: 'customer_enrolled',
      timestamp: new Date().toISOString(),
      staffIdentifier: 'Counter Staff',
      details: `Enrolled new member: ${newCustomer.name}.`,
    });

    data[businessId] = bundle;
    this.saveData(data);
    return { success: true, customer: newCustomer };
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

      // Staff PIN verification against configured location PINs
      if (staffPin !== undefined && staffPin.trim().length > 0) {
        const allowedPins: Record<string, string[]> = {
          biz_user_primary: ['4821', '1904'],
          biz_salon_demo: ['7392', '5510'],
          biz_retail_demo: ['2049'],
          biz_gym_demo: ['8831'],
          biz_carwash_demo: ['6147'],
          biz_service_demo: ['3391'],
        };
        const validForBiz = allowedPins[businessId] || ['4821'];
        if (!validForBiz.includes(staffPin.trim())) {
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
          id: `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          rewardDescription: program.rewardDescription,
          unlockedAt: new Date().toISOString(),
          isRedeemed: false,
          voucherCode: `REW-${Math.floor(100 + Math.random() * 900)}`,
        };
        customer.rewards.unshift(newReward);

        // Record reward unlocked event
        bundle.events.unshift({
          id: `evt_rew_${Date.now()}`,
          businessId,
          locationId,
          customerId: customer.id,
          customerName: customer.name,
          programId: program.id,
          type: 'reward_unlocked',
          timestamp: new Date().toISOString(),
          staffIdentifier: staffPin ? `Staff PIN: ${staffPin}` : 'Counter Staff',
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
      const eventId = `evt_st_${Date.now()}`;
      bundle.events.unshift({
        id: eventId,
        businessId,
        locationId,
        customerId: customer.id,
        customerName: customer.name,
        programId: program.id,
        type: 'stamp_issued',
        timestamp: new Date().toISOString(),
        staffIdentifier: staffPin ? `Staff PIN: ${staffPin}` : 'Counter Staff',
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

    // Mark as redeemed
    reward.isRedeemed = true;
    reward.redeemedAt = new Date().toISOString();
    reward.redeemedByStaff = staffPin ? `Staff PIN: ${staffPin}` : 'Counter Staff';

    // Record redemption audit event
    bundle.events.unshift({
      id: `evt_rdm_${Date.now()}`,
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

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loyaltydigitalqr.com';
    const cleanTarget = data.targetUrl.startsWith('/') ? data.targetUrl : `/${data.targetUrl}`;

    const newQr: QrCodeDefinition = {
      id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

export const mockLoyaltyService = new MockLoyaltyService();
