import type {
  Offer,
  OfferType,
  OfferRedemption,
  CustomerSegment,
  SegmentCriteriaType,
  WinBackCampaignConfig,
  CampaignRunRecord,
  CustomerFeedback,
  FeedbackRating,
  FeedbackConfig,
  TeamRole,
  TeamPermission,
  TeamMember,
  GrowthAnalyticsSummary,
} from '../types/growth';
import type { CustomerRecord } from '../types/loyalty';
import { mockLoyaltyService } from './mockLoyaltyService';
import { mockOrderService } from './mockOrderService';
import { mockSalonService } from './mockSalonService';
import { mockRetailService } from './mockRetailService';
import { mockGymService } from './mockGymService';
import { mockCarWashService } from './mockCarWashService';
import { mockGenericService } from './mockGenericService';
import { mockBusinessService } from './mockBusinessService';

const STORAGE_KEY = 'loyalty_mock_growth_v1';

export const ROLE_PERMISSIONS: Record<TeamRole, TeamPermission[]> = {
  owner: [
    'manage_offers',
    'view_analytics',
    'export_data',
    'manage_customers',
    'issue_loyalty',
    'operate_orders',
    'manage_team',
    'manage_settings',
    'manage_billing',
  ],
  manager: [
    'manage_offers',
    'view_analytics',
    'export_data',
    'manage_customers',
    'issue_loyalty',
    'operate_orders',
    'manage_team',
    'manage_settings',
  ],
  staff: ['issue_loyalty', 'operate_orders'],
  receptionist: ['issue_loyalty', 'manage_customers', 'operate_orders'],
};

interface BusinessGrowthStore {
  offers: Offer[];
  redemptions: OfferRedemption[];
  segments: CustomerSegment[];
  campaignRuns: CampaignRunRecord[];
  feedbacks: CustomerFeedback[];
  feedbackConfig: FeedbackConfig;
  teamMembers: TeamMember[];
}

export interface CreateOfferInput {
  businessId: string;
  name: string;
  description: string;
  code: string;
  offerType: OfferType;
  discountValue: number;
  minimumSpendMinor?: number;
  startDate: string;
  endDate: string;
  targetSegmentId?: string;
  locationId?: string;
  perCustomerLimit?: number;
  totalRedemptionLimit?: number;
}

export interface RedeemOfferInput {
  businessId: string;
  offerCodeOrId: string;
  customerId: string;
  customerName?: string;
  orderOrTransactionId?: string;
}

export interface SubmitFeedbackInput {
  businessId: string;
  locationId?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  rating: FeedbackRating;
  comment: string;
  serviceType: 'cafe' | 'salon' | 'retail' | 'gym' | 'carwash' | 'service' | 'general';
  referenceId?: string;
}

export interface InviteTeamMemberInput {
  businessId: string;
  name: string;
  email: string;
  role: TeamRole;
  assignedLocationId?: string;
}

class MockGrowthService {
  private subscribers: Array<() => void> = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    const data = this.loadData();
    const primaryBizId = 'biz_user_primary';

    if (data[primaryBizId]) return;

    const now = new Date().toISOString();
    const futureDateStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const pastDateStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Seed for primary business (Good Day Specialty Coffee)
    data[primaryBizId] = {
      offers: [
        {
          id: 'off_welcome_15',
          businessId: primaryBizId,
          name: 'Spring Welcome Perk',
          description: '15% off any handcrafted espresso beverage or specialty cold brew.',
          code: 'SPRING15',
          offerType: 'percentage',
          discountValue: 15,
          minimumSpendMinor: 400, // $4.00 min spend
          startDate: pastDateStr,
          endDate: futureDateStr,
          perCustomerLimit: 1,
          totalRedemptionLimit: 100,
          redemptionCount: 4,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'off_winback_3',
          businessId: primaryBizId,
          name: 'We Miss You! Return Reward',
          description: '$3.00 off your next handcrafted brew when you return this week.',
          code: 'COMEBACK3',
          offerType: 'winback',
          discountValue: 300, // $3.00 in cents
          minimumSpendMinor: 600,
          startDate: pastDateStr,
          endDate: futureDateStr,
          perCustomerLimit: 1,
          totalRedemptionLimit: 50,
          redemptionCount: 1,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'off_loyalty_boost',
          businessId: primaryBizId,
          name: 'Double Stamp Thursday',
          description: 'Earn 2 loyalty visit stamps on all pour-over coffee orders.',
          code: 'DOUBLETHURS',
          offerType: 'loyalty_bonus',
          discountValue: 2,
          startDate: pastDateStr,
          endDate: futureDateStr,
          perCustomerLimit: 1,
          redemptionCount: 2,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      redemptions: [
        {
          id: 'red_seed_01',
          businessId: primaryBizId,
          offerId: 'off_welcome_15',
          offerCode: 'SPRING15',
          offerName: 'Spring Welcome Perk',
          customerId: 'cust_c1',
          customerName: 'Sarah Miller',
          amountSavedMinor: 120, // $1.20
          redeemedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
          orderOrTransactionId: '#1041',
        },
      ],
      segments: [
        {
          id: 'seg_all',
          businessId: primaryBizId,
          name: 'All Registered Customers',
          description: 'Every customer profile registered in your CRM directory.',
          criteriaType: 'all',
          isSystemDefault: true,
          createdAt: now,
        },
        {
          id: 'seg_recent',
          businessId: primaryBizId,
          name: 'Recently Active (Past 14 Days)',
          description: 'Engaged patrons who visited or ordered within the last 2 weeks.',
          criteriaType: 'recent_active',
          inactivityDays: 14,
          isSystemDefault: true,
          createdAt: now,
        },
        {
          id: 'seg_dormant_30',
          businessId: primaryBizId,
          name: 'Dormant Guests (30+ Days)',
          description: 'Registered customers who have not visited in the past month.',
          criteriaType: 'inactive_dormant',
          inactivityDays: 30,
          isSystemDefault: true,
          createdAt: now,
        },
        {
          id: 'seg_repeat',
          businessId: primaryBizId,
          name: 'Loyal Repeat Guests (3+ Visits)',
          description: 'High-frequency patrons with 3 or more recorded visits.',
          criteriaType: 'repeat_loyal',
          minVisits: 3,
          isSystemDefault: true,
          createdAt: now,
        },
        {
          id: 'seg_consent_email',
          businessId: primaryBizId,
          name: 'Email Marketing Consented',
          description: 'Patrons who have explicitly opted in to receive email promotions.',
          criteriaType: 'consent_email',
          requiresEmailConsent: true,
          isSystemDefault: true,
          createdAt: now,
        },
      ],
      campaignRuns: [
        {
          id: 'cmp_run_seed_01',
          businessId: primaryBizId,
          name: 'Autumn Dormant Guest Outreach',
          campaignType: 'win_back',
          channel: 'email',
          offerId: 'off_winback_3',
          offerName: 'We Miss You! Return Reward',
          segmentId: 'seg_dormant_30',
          segmentName: 'Dormant Guests (30+ Days)',
          inactivityThresholdDays: 30,
          targetAudienceCount: 1,
          simulatedSentCount: 1,
          simulatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
          status: 'simulated',
          simulationNotice: 'Simulated Campaign Run — No real email was transmitted.',
        },
      ],
      feedbacks: [
        {
          id: 'fb_seed_01',
          businessId: primaryBizId,
          locationId: 'loc_main',
          customerId: 'cust_c1',
          customerName: 'Sarah Miller',
          customerEmail: 'sarah.m@example.com',
          rating: 5,
          comment: 'The oat milk cortado is consistently top-tier and the barista knew my order immediately!',
          serviceType: 'cafe',
          referenceId: '#1041',
          status: 'reviewed',
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
        {
          id: 'fb_seed_02',
          businessId: primaryBizId,
          locationId: 'loc_main',
          customerId: 'cust_c2',
          customerName: 'David Kim',
          customerEmail: 'david.kim@example.com',
          rating: 4,
          comment: 'Fast table ordering via QR standee. Loved the pistachio croissant, just wished it was warmed up a bit more.',
          serviceType: 'cafe',
          referenceId: '#1042',
          status: 'new',
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
      ],
      feedbackConfig: {
        businessId: primaryBizId,
        enabled: true,
        publicReviewUrl: 'https://maps.google.com/?cid=10492817291',
        promptMessage: 'How was your coffee & service today? Let us know!',
      },
      teamMembers: [
        {
          id: 'tm_owner',
          businessId: primaryBizId,
          name: 'Demo Merchant (You)',
          email: 'merchant@loyaltydigitalqr.com',
          role: 'owner',
          status: 'active',
          lastActiveAt: now,
          createdAt: pastDateStr,
        },
        {
          id: 'tm_mgr',
          businessId: primaryBizId,
          name: 'Alex Chen',
          email: 'alex.chen@gooddaycoffee.com',
          role: 'manager',
          assignedLocationId: 'loc_main',
          status: 'active',
          lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: pastDateStr,
        },
        {
          id: 'tm_staff',
          businessId: primaryBizId,
          name: 'Jamie Rivera',
          email: 'jamie.r@gooddaycoffee.com',
          role: 'staff',
          assignedLocationId: 'loc_main',
          status: 'active',
          lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
          createdAt: pastDateStr,
        },
      ],
    };

    this.saveData(data);
  }

  private loadData(): Record<string, BusinessGrowthStore> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse growth store from localStorage:', e);
    }
    return {};
  }

  private saveData(data: Record<string, BusinessGrowthStore>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notify();
    } catch (e) {
      console.warn('Failed to save growth store:', e);
    }
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach((s) => s());
  }

  private getStore(businessId: string): BusinessGrowthStore {
    const data = this.loadData();
    if (!data[businessId]) {
      const now = new Date().toISOString();
      data[businessId] = {
        offers: [],
        redemptions: [],
        segments: [
          {
            id: `seg_${Date.now()}_all`,
            businessId,
            name: 'All Registered Customers',
            description: 'Every customer profile registered in your CRM directory.',
            criteriaType: 'all',
            isSystemDefault: true,
            createdAt: now,
          },
          {
            id: `seg_${Date.now()}_recent`,
            businessId,
            name: 'Recently Active (Past 14 Days)',
            description: 'Engaged patrons who visited or ordered within the last 2 weeks.',
            criteriaType: 'recent_active',
            inactivityDays: 14,
            isSystemDefault: true,
            createdAt: now,
          },
          {
            id: `seg_${Date.now()}_dormant`,
            businessId,
            name: 'Dormant Guests (30+ Days)',
            description: 'Registered customers who have not visited in the past month.',
            criteriaType: 'inactive_dormant',
            inactivityDays: 30,
            isSystemDefault: true,
            createdAt: now,
          },
        ],
        campaignRuns: [],
        feedbacks: [],
        feedbackConfig: {
          businessId,
          enabled: true,
          promptMessage: 'How was your experience today?',
        },
        teamMembers: [
          {
            id: `tm_${Date.now()}_owner`,
            businessId,
            name: 'Demo Owner',
            email: 'owner@business.com',
            role: 'owner',
            status: 'active',
            lastActiveAt: now,
            createdAt: now,
          },
        ],
      };
      this.saveData(data);
    }
    return data[businessId];
  }

  // =========================================================================
  // OFFERS & PROMOTIONS MANAGEMENT
  // =========================================================================

  getOffers(businessId: string): Offer[] {
    return this.getStore(businessId).offers;
  }

  getOffer(businessId: string, offerId: string): Offer | undefined {
    return this.getOffers(businessId).find((o) => o.id === offerId || o.code.toUpperCase() === offerId.toUpperCase());
  }

  createOffer(input: CreateOfferInput): { success: boolean; offer?: Offer; error?: string } {
    if (!input.name.trim()) {
      return { success: false, error: 'Offer title is required.' };
    }
    const cleanCode = input.code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      return { success: false, error: 'Valid promo code is required.' };
    }
    if (isNaN(input.discountValue) || input.discountValue <= 0) {
      return { success: false, error: 'Discount value must be greater than 0.' };
    }
    if (input.offerType === 'percentage' && input.discountValue > 100) {
      return { success: false, error: 'Percentage discount cannot exceed 100%.' };
    }
    if (!input.startDate || !input.endDate) {
      return { success: false, error: 'Start and end dates are required.' };
    }
    if (input.startDate > input.endDate) {
      return { success: false, error: 'Start date cannot be after end date.' };
    }

    const data = this.loadData();
    const store = data[input.businessId] || this.getStore(input.businessId);

    // Check duplicate code
    const existing = store.offers.find((o) => o.code === cleanCode);
    if (existing) {
      return { success: false, error: `Promo code "${cleanCode}" already exists for this business.` };
    }

    const now = new Date().toISOString();
    const newOffer: Offer = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      locationId: input.locationId || 'all',
      name: input.name.trim(),
      description: input.description.trim(),
      code: cleanCode,
      offerType: input.offerType,
      discountValue: Math.round(input.discountValue),
      minimumSpendMinor: input.minimumSpendMinor ? Math.round(input.minimumSpendMinor) : undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      targetSegmentId: input.targetSegmentId,
      perCustomerLimit: input.perCustomerLimit || 1,
      totalRedemptionLimit: input.totalRedemptionLimit,
      redemptionCount: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    store.offers.unshift(newOffer);
    data[input.businessId] = store;
    this.saveData(data);

    return { success: true, offer: newOffer };
  }

  updateOffer(
    businessId: string,
    offerId: string,
    patch: Partial<Offer>
  ): { success: boolean; offer?: Offer; error?: string } {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    const index = store.offers.findIndex((o) => o.id === offerId);
    if (index === -1) {
      return { success: false, error: 'Offer not found.' };
    }

    if (patch.startDate && patch.endDate && patch.startDate > patch.endDate) {
      return { success: false, error: 'Start date cannot be after end date.' };
    }

    const updated: Offer = {
      ...store.offers[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    store.offers[index] = updated;
    data[businessId] = store;
    this.saveData(data);

    return { success: true, offer: updated };
  }

  deleteOffer(businessId: string, offerId: string): boolean {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    const initialLen = store.offers.length;
    store.offers = store.offers.filter((o) => o.id !== offerId);
    if (store.offers.length !== initialLen) {
      data[businessId] = store;
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Offer Redemption with Per-Customer Limit & Duplicate Prevention
  redeemOffer(
    businessId: string,
    input: RedeemOfferInput
  ): { success: boolean; redemption?: OfferRedemption; error?: string } {
    const offer = this.getOffer(businessId, input.offerCodeOrId);
    if (!offer) {
      return { success: false, error: 'Promo code or offer not found.' };
    }

    if (offer.status !== 'active') {
      return { success: false, error: `Offer is currently ${offer.status.toUpperCase()}.` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (offer.startDate && todayStr < offer.startDate) {
      return { success: false, error: `Offer is not active yet (starts on ${offer.startDate}).` };
    }
    if (offer.endDate && todayStr > offer.endDate) {
      return { success: false, error: `Offer expired on ${offer.endDate}.` };
    }

    if (offer.totalRedemptionLimit && offer.redemptionCount >= offer.totalRedemptionLimit) {
      return { success: false, error: 'Offer has reached its maximum total redemption limit.' };
    }

    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);

    // Validate per-customer usage
    const customerRedemptions = store.redemptions.filter(
      (r) => r.offerId === offer.id && r.customerId === input.customerId
    );

    if (customerRedemptions.length >= offer.perCustomerLimit) {
      return {
        success: false,
        error: `Customer has already redeemed this offer (limit of ${offer.perCustomerLimit} per member).`,
      };
    }

    // Duplicate check protection
    const lockKey = `${businessId}_${offer.id}_${input.customerId}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Offer redemption is already processing. Please wait.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const now = new Date().toISOString();
      const amountSaved = offer.offerType === 'fixed_amount' ? offer.discountValue : 350; // default estimated $3.50 savings

      const redemption: OfferRedemption = {
        id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId,
        offerId: offer.id,
        offerCode: offer.code,
        offerName: offer.name,
        customerId: input.customerId,
        customerName: input.customerName || 'Customer Member',
        amountSavedMinor: amountSaved,
        redeemedAt: now,
        orderOrTransactionId: input.orderOrTransactionId,
      };

      store.redemptions.unshift(redemption);

      // Increment offer redemption count
      const offIndex = store.offers.findIndex((o) => o.id === offer.id);
      if (offIndex !== -1) {
        store.offers[offIndex].redemptionCount += 1;
      }

      data[businessId] = store;
      this.saveData(data);

      return { success: true, redemption };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  getRedemptions(businessId: string): OfferRedemption[] {
    return this.getStore(businessId).redemptions;
  }

  // =========================================================================
  // CUSTOMER SEGMENTATION & DETERMINISTIC MATCHING
  // =========================================================================

  getSegments(businessId: string): CustomerSegment[] {
    return this.getStore(businessId).segments;
  }

  createSegment(businessId: string, segment: Omit<CustomerSegment, 'id' | 'businessId' | 'createdAt'>): CustomerSegment {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);

    const newSegment: CustomerSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      ...segment,
      createdAt: new Date().toISOString(),
    };

    store.segments.push(newSegment);
    data[businessId] = store;
    this.saveData(data);
    return newSegment;
  }

  /**
   * Deterministically evaluate audience for a segment
   * Uses real customer records from CRM and respects marketing consent.
   */
  evaluateAudience(
    businessId: string,
    criteria: {
      criteriaType: SegmentCriteriaType;
      inactivityDays?: number;
      minVisits?: number;
      requiresEmailConsent?: boolean;
      requiresSmsConsent?: boolean;
      locationId?: string;
    },
    channelFilter?: 'email' | 'sms'
  ): CustomerRecord[] {
    const allCustomers = mockLoyaltyService.getCustomers(businessId);
    const now = Date.now();

    return allCustomers.filter((customer) => {
      // 1. Channel Consent Check
      if (channelFilter === 'email' || criteria.requiresEmailConsent) {
        if (!customer.marketingConsent?.email) {
          return false;
        }
      }
      if (channelFilter === 'sms' || criteria.requiresSmsConsent) {
        if (!customer.marketingConsent?.sms) {
          return false;
        }
      }

      // 2. Criteria Evaluation
      switch (criteria.criteriaType) {
        case 'all':
          return true;

        case 'recent_active': {
          const days = criteria.inactivityDays || 14;
          if (!customer.lastVisitAt) return false;
          const diffDays = (now - new Date(customer.lastVisitAt).getTime()) / 86400000;
          return diffDays <= days;
        }

        case 'inactive_dormant': {
          const days = criteria.inactivityDays || 30;
          if (!customer.lastVisitAt) return true; // Never visited since enrollment
          const diffDays = (now - new Date(customer.lastVisitAt).getTime()) / 86400000;
          return diffDays >= days;
        }

        case 'repeat_loyal': {
          const min = criteria.minVisits || 2;
          return customer.totalVisits >= min;
        }

        case 'high_stamps': {
          return customer.currentStamps >= 4 || customer.lifetimeStamps >= 10;
        }

        case 'consent_email':
          return !!customer.marketingConsent?.email;

        case 'consent_sms':
          return !!customer.marketingConsent?.sms;

        case 'by_location':
          return true; // Single location mock mapping

        default:
          return true;
      }
    });
  }

  // =========================================================================
  // WIN-BACK CAMPAIGN SIMULATION
  // =========================================================================

  simulateWinBackCampaign(
    businessId: string,
    config: WinBackCampaignConfig
  ): { success: boolean; campaignRun?: CampaignRunRecord; error?: string } {
    if (!config.name.trim()) {
      return { success: false, error: 'Campaign title is required.' };
    }
    if (config.inactivityDays <= 0 || isNaN(config.inactivityDays)) {
      return { success: false, error: 'Valid inactivity threshold is required.' };
    }

    // Evaluate matching audience with consent check
    const matchingAudience = this.evaluateAudience(
      businessId,
      {
        criteriaType: 'inactive_dormant',
        inactivityDays: config.inactivityDays,
      },
      config.channel
    );

    const offer = config.offerId ? this.getOffer(businessId, config.offerId) : undefined;
    const now = new Date().toISOString();

    const campaignRun: CampaignRunRecord = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      name: config.name.trim(),
      campaignType: 'win_back',
      channel: config.channel,
      offerId: offer?.id,
      offerName: offer?.name,
      inactivityThresholdDays: config.inactivityDays,
      targetAudienceCount: matchingAudience.length,
      simulatedSentCount: matchingAudience.length,
      simulatedAt: now,
      status: 'simulated',
      simulationNotice:
        'Demonstration / Simulation only: No real email or SMS was transmitted.',
    };

    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    store.campaignRuns.unshift(campaignRun);
    data[businessId] = store;
    this.saveData(data);

    return { success: true, campaignRun };
  }

  getCampaignRuns(businessId: string): CampaignRunRecord[] {
    return this.getStore(businessId).campaignRuns;
  }

  // =========================================================================
  // CUSTOMER FEEDBACK & REVIEWS
  // =========================================================================

  getFeedbacks(businessId: string): CustomerFeedback[] {
    return this.getStore(businessId).feedbacks;
  }

  getCustomerFeedback(businessId: string): CustomerFeedback[] {
    return this.getFeedbacks(businessId);
  }

  submitFeedback(input: SubmitFeedbackInput): { success: boolean; feedback?: CustomerFeedback; error?: string } {
    if (!input.customerName.trim()) {
      return { success: false, error: 'Customer name is required.' };
    }
    if (input.rating < 1 || input.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars.' };
    }

    const data = this.loadData();
    const store = data[input.businessId] || this.getStore(input.businessId);

    const newFeedback: CustomerFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      locationId: input.locationId,
      customerId: input.customerId,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim(),
      rating: input.rating,
      comment: input.comment.trim(),
      serviceType: input.serviceType,
      referenceId: input.referenceId,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    store.feedbacks.unshift(newFeedback);
    data[input.businessId] = store;
    this.saveData(data);

    return { success: true, feedback: newFeedback };
  }

  updateFeedbackStatus(businessId: string, feedbackId: string, status: 'reviewed' | 'archived') {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    const item = store.feedbacks.find((f) => f.id === feedbackId);
    if (item) {
      item.status = status;
      data[businessId] = store;
      this.saveData(data);
    }
  }

  getFeedbackConfig(businessId: string): FeedbackConfig {
    return this.getStore(businessId).feedbackConfig;
  }

  updateFeedbackConfig(businessId: string, patch: Partial<FeedbackConfig>) {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    store.feedbackConfig = { ...store.feedbackConfig, ...patch };
    data[businessId] = store;
    this.saveData(data);
  }

  // =========================================================================
  // TEAM ROLES & SIMULATED PERMISSIONS
  // =========================================================================

  getTeamMembers(businessId: string): TeamMember[] {
    return this.getStore(businessId).teamMembers;
  }

  inviteTeamMember(input: InviteTeamMemberInput): { success: boolean; member?: TeamMember; error?: string } {
    if (!input.name.trim() || !input.email.trim()) {
      return { success: false, error: 'Name and email are required.' };
    }

    const data = this.loadData();
    const store = data[input.businessId] || this.getStore(input.businessId);

    const newMember: TeamMember = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      assignedLocationId: input.assignedLocationId,
      status: 'invited_simulated',
      createdAt: new Date().toISOString(),
    };

    store.teamMembers.push(newMember);
    data[input.businessId] = store;
    this.saveData(data);

    return { success: true, member: newMember };
  }

  updateTeamMemberRole(businessId: string, memberId: string, role: TeamRole): boolean {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    const m = store.teamMembers.find((tm) => tm.id === memberId);
    if (m) {
      m.role = role;
      data[businessId] = store;
      this.saveData(data);
      return true;
    }
    return false;
  }

  removeTeamMember(businessId: string, memberId: string): boolean {
    const data = this.loadData();
    const store = data[businessId] || this.getStore(businessId);
    const initial = store.teamMembers.length;
    store.teamMembers = store.teamMembers.filter((m) => m.id !== memberId);
    if (store.teamMembers.length !== initial) {
      data[businessId] = store;
      this.saveData(data);
      return true;
    }
    return false;
  }

  hasPermission(role: TeamRole, permission: TeamPermission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  }

  // =========================================================================
  // ANALYTICS & CSV EXPORT
  // =========================================================================

  getAnalyticsSummary(businessId: string, dateRange: '7d' | '30d' | '90d' | 'all' = '30d'): GrowthAnalyticsSummary {
    return this.getGrowthAnalytics(businessId, dateRange);
  }

  getGrowthAnalytics(businessId: string, dateRange: '7d' | '30d' | '90d' | 'all'): GrowthAnalyticsSummary {
    const now = Date.now();
    const cutoffDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 3650;
    const cutoffMs = now - cutoffDays * 86400000;

    const customers = mockLoyaltyService.getCustomers(businessId);
    const events = mockLoyaltyService.getEvents(businessId).filter((e) => new Date(e.timestamp).getTime() >= cutoffMs);
    const store = this.getStore(businessId);

    const filteredRedemptions = store.redemptions.filter((r) => new Date(r.redeemedAt).getTime() >= cutoffMs);
    const filteredFeedbacks = store.feedbacks.filter((f) => new Date(f.createdAt).getTime() >= cutoffMs);
    const filteredCampaigns = store.campaignRuns.filter((c) => new Date(c.simulatedAt).getTime() >= cutoffMs);

    const totalCustomers = customers.length;
    const newCustomers = customers.filter((c) => new Date(c.enrolledAt).getTime() >= cutoffMs).length;
    const activeCustomers = customers.filter((c) => c.lastVisitAt && new Date(c.lastVisitAt).getTime() >= cutoffMs).length;
    const inactiveCustomers = totalCustomers - activeCustomers;
    const repeatCount = customers.filter((c) => c.totalVisits >= 2).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;

    const totalLoyaltyStamps = events.filter((e) => e.type === 'stamp_issued').reduce((a, b) => a + (b.stampsIssued || 1), 0);
    const totalRewardsRedeemed = events.filter((e) => e.type === 'reward_redeemed').length;

    const totalOfferSavingsMinor = filteredRedemptions.reduce((a, b) => a + b.amountSavedMinor, 0);

    const avgRating =
      filteredFeedbacks.length > 0
        ? Number((filteredFeedbacks.reduce((a, b) => a + b.rating, 0) / filteredFeedbacks.length).toFixed(1))
        : 5.0;

    // Derived Gross Value from existing vertical transactions
    let grossValue = 0;
    try {
      const orders = mockOrderService.getOrders(businessId).filter((o) => new Date(o.createdAt).getTime() >= cutoffMs);
      grossValue += orders.reduce((acc, o) => acc + (o.subtotal || o.total), 0);
    } catch { /* ignored */ }

    try {
      const purchases = mockRetailService.getPurchases(businessId).filter((p) => new Date(p.timestamp).getTime() >= cutoffMs);
      grossValue += purchases.reduce((acc, p) => acc + p.total, 0);
    } catch { /* ignored */ }

    try {
      const apts = mockSalonService.getAppointments(businessId).filter((a) => new Date(a.createdAt || a.startIso).getTime() >= cutoffMs);
      grossValue += apts.reduce((acc, a) => acc + a.price, 0);
    } catch { /* ignored */ }

    try {
      const passes = mockCarWashService.getPasses(businessId).filter((p) => new Date(p.createdAt).getTime() >= cutoffMs);
      // Strictly sum actual recorded purchase transactions; unpriced passes contribute 0 without invented estimates
      grossValue += passes.reduce((acc, p) => acc + (p.pricePaidMinor || 0), 0);
    } catch { /* ignored */ }

    try {
      const members = mockGymService.getMembers(businessId).filter((m) => new Date(m.createdAt).getTime() >= cutoffMs);
      // Strictly sum actual recorded purchase transactions; unpriced memberships contribute 0 without invented estimates
      grossValue += members.reduce((acc, m) => acc + (m.pricePaidMinor || 0), 0);
    } catch { /* ignored */ }

    try {
      const jobs = mockGenericService.getJobs(businessId).filter((j) => new Date(j.timestamp).getTime() >= cutoffMs);
      grossValue += jobs.reduce((acc, j) => acc + j.amountCharged, 0);
    } catch { /* ignored */ }

    return {
      dateRange,
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      repeatRate,
      totalRecordedVisits: customers.reduce((a, b) => a + b.totalVisits, 0),
      totalLoyaltyStamps,
      totalRewardsRedeemed,
      offersActiveCount: store.offers.filter((o) => o.status === 'active').length,
      offerRedemptionsCount: filteredRedemptions.length,
      totalOfferSavingsMinor,
      campaignRunsCount: filteredCampaigns.length,
      feedbackCount: filteredFeedbacks.length,
      averageRating: avgRating,
      recordedGrossValueMinor: grossValue,
    };
  }

  /**
   * Safe CSV exporter with quotation escaping and strict business isolation
   */
  exportAnalyticsCsv(businessId: string, dateRange: '7d' | '30d' | '90d' | 'all' = 'all'): string {
    const summary = this.getGrowthAnalytics(businessId, dateRange);
    const business = mockBusinessService.getBusinessById(businessId);
    const store = this.getStore(businessId);

    const escapeCsv = (val: string | number | undefined): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];

    // Header & Summary Section
    lines.push(`Report,${escapeCsv('Business Analytics Summary')}`);
    lines.push(`Business Name,${escapeCsv(business?.name || businessId)}`);
    lines.push(`Business ID,${escapeCsv(businessId)}`);
    lines.push(`Date Range,${escapeCsv(dateRange)}`);
    lines.push(`Generated At,${escapeCsv(new Date().toISOString())}`);
    lines.push('');

    lines.push('Metric,Value');
    lines.push(`Total Customers,${summary.totalCustomers}`);
    lines.push(`New Customers (${dateRange}),${summary.newCustomers}`);
    lines.push(`Active Customers,${summary.activeCustomers}`);
    lines.push(`Inactive Customers,${summary.inactiveCustomers}`);
    lines.push(`Repeat Visit Rate,${summary.repeatRate}%`);
    lines.push(`Total Recorded Visits,${summary.totalRecordedVisits}`);
    lines.push(`Loyalty Stamps Issued,${summary.totalLoyaltyStamps}`);
    lines.push(`Rewards Redeemed,${summary.totalRewardsRedeemed}`);
    lines.push(`Active Offers,${summary.offersActiveCount}`);
    lines.push(`Offer Redemptions,${summary.offerRedemptionsCount}`);
    lines.push(`Offer Savings (${business?.currencySymbol || '$'}),${(summary.totalOfferSavingsMinor / 100).toFixed(2)}`);
    lines.push(`Simulated Campaign Runs,${summary.campaignRunsCount}`);
    lines.push(`Customer Feedback Volume,${summary.feedbackCount}`);
    lines.push(`Average Feedback Rating,${summary.averageRating} / 5.0`);
    lines.push(`Recorded Gross Value (${business?.currencySymbol || '$'}),${(summary.recordedGrossValueMinor / 100).toFixed(2)}`);
    lines.push('');

    // Active Offers Table
    lines.push('--- CONFIGURED PROMOTIONS & OFFERS ---');
    lines.push('Code,Name,Type,Discount,Redemptions,Status,Valid Period');
    const sym = business?.currencySymbol || '$';
    store.offers.forEach((o) => {
      const discountLabel = o.offerType === 'percentage' ? `${o.discountValue}%` : `${sym}${(o.discountValue / 100).toFixed(2)}`;
      lines.push(
        [
          escapeCsv(o.code),
          escapeCsv(o.name),
          escapeCsv(o.offerType),
          escapeCsv(discountLabel),
          o.redemptionCount,
          escapeCsv(o.status),
          escapeCsv(`${o.startDate} to ${o.endDate}`),
        ].join(',')
      );
    });
    lines.push('');

    // Feedback Table
    lines.push('--- RECENT CUSTOMER FEEDBACK ---');
    lines.push('Rating,Customer,Service,Comment,Date');
    store.feedbacks.forEach((f) => {
      lines.push(
        [
          f.rating,
          escapeCsv(f.customerName),
          escapeCsv(f.serviceType),
          escapeCsv(f.comment),
          escapeCsv(f.createdAt.split('T')[0]),
        ].join(',')
      );
    });

    return lines.join('\n');
  }
}

export const mockGrowthService = new MockGrowthService();
