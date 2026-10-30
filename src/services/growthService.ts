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

  GrowthAnalyticsSummary,
} from '../types/growth';
import type { CustomerRecord } from '../types/loyalty';
import { loyaltyService } from './loyaltyService';
import { orderService } from './orderService';
import { salonService } from './salonService';
import { retailService } from './retailService';
import { gymService } from './gymService';
import { carWashService } from './carWashService';
import { genericService } from './genericService';
import { businessService } from './businessService';

import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId } from '../lib/ids';
import { localDateKey } from '../utils/dates';

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

/** Built-in audience segments (computed live from customer records). */
function systemSegments(businessId: string): CustomerSegment[] {
  const createdAt = '2026-01-01T00:00:00.000Z';
  return [
    {
      id: 'seg_all',
      businessId,
      name: 'All Registered Customers',
      description: 'Every customer profile registered in your CRM directory.',
      criteriaType: 'all',
      isSystemDefault: true,
      createdAt,
    },
    {
      id: 'seg_recent',
      businessId,
      name: 'Recently Active (Past 14 Days)',
      description: 'Customers who visited within the last 2 weeks.',
      criteriaType: 'recent_active',
      inactivityDays: 14,
      isSystemDefault: true,
      createdAt,
    },
    {
      id: 'seg_dormant',
      businessId,
      name: 'Dormant Guests (30+ Days)',
      description: 'Registered customers who have not visited in the past month.',
      criteriaType: 'inactive_dormant',
      inactivityDays: 30,
      isSystemDefault: true,
      createdAt,
    },
  ];
}

const newestBy = (field: string) => (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(b[field] || '').localeCompare(String(a[field] || ''));

/**
 * Offers, redemptions, segments, campaign records and customer feedback
 * (members only), persisted per business:
 *   businesses/{id}/offers, offerRedemptions, segments, campaignRuns, feedback
 *   businesses/{id}/config/feedbackConfig
 */
export const GROWTH_SPEC: ModuleSpec<BusinessGrowthStore> = {
  name: 'growth',
  arrays: [
    { key: 'offers', collection: 'offers', sort: newestBy('createdAt') },
    { key: 'redemptions', collection: 'offerRedemptions', sort: newestBy('redeemedAt') },
    { key: 'segments', collection: 'segments' },
    { key: 'campaignRuns', collection: 'campaignRuns', sort: newestBy('simulatedAt') },
    { key: 'feedbacks', collection: 'feedback', sort: newestBy('createdAt') },
  ],
  singles: [{ key: 'feedbackConfig', docId: 'feedbackConfig' }],
  empty: (businessId) => ({
    offers: [],
    redemptions: [],
    segments: [],
    campaignRuns: [],
    feedbacks: [],
    feedbackConfig: {
      businessId,
      enabled: true,
      promptMessage: 'How was your experience today?',
    },
  }),
};
bizStore.register(GROWTH_SPEC);

class GrowthService {
  private subscribers: Array<() => void> = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    bizStore.subscribe(() => this.notify());
  }

  private loadData(): Record<string, BusinessGrowthStore> {
    const all = bizStore.getAll(GROWTH_SPEC);
    for (const [bizId, store] of Object.entries(all)) this.withSystemSegments(bizId, store);
    return all;
  }

  private saveData(data: Record<string, BusinessGrowthStore>) {
    bizStore.saveAll(GROWTH_SPEC, data);
    this.notify();
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

  private withSystemSegments(businessId: string, store: BusinessGrowthStore): BusinessGrowthStore {
    const missing = systemSegments(businessId).filter((s) => !store.segments.some((x) => x.id === s.id));
    if (missing.length) store.segments.unshift(...missing);
    return store;
  }

  private getStore(businessId: string): BusinessGrowthStore {
    return this.withSystemSegments(businessId, bizStore.getBundle(GROWTH_SPEC, businessId));
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
      id: `off_${newId()}`,
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

    const todayStr = localDateKey();
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
      // Only fixed-amount discounts have a known value; percentage savings depend on the bill and are not invented.
      const amountSaved = offer.offerType === 'fixed_amount' ? offer.discountValue : 0;

      const redemption: OfferRedemption = {
        id: `red_${newId()}`,
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
      id: `seg_${newId()}`,
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
    const allCustomers = loyaltyService.getCustomers(businessId);
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
      id: `cmp_${newId()}`,
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
        'Contact list exported as CSV. No messages were sent by the platform.',
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
      id: `fb_${newId()}`,
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
  // TEAM ROLE PERMISSIONS (membership itself lives on the business document)
  // =========================================================================

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

    const customers = loyaltyService.getCustomers(businessId);
    const events = loyaltyService.getEvents(businessId).filter((e) => new Date(e.timestamp).getTime() >= cutoffMs);
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
      const orders = orderService.getOrders(businessId).filter((o) => new Date(o.createdAt).getTime() >= cutoffMs);
      grossValue += orders.reduce((acc, o) => acc + (o.subtotal || o.total), 0);
    } catch { /* ignored */ }

    try {
      const purchases = retailService.getPurchases(businessId).filter((p) => new Date(p.timestamp).getTime() >= cutoffMs);
      grossValue += purchases.reduce((acc, p) => acc + p.total, 0);
    } catch { /* ignored */ }

    try {
      const apts = salonService.getAppointments(businessId).filter((a) => new Date(a.createdAt || a.startIso).getTime() >= cutoffMs);
      grossValue += apts.reduce((acc, a) => acc + a.price, 0);
    } catch { /* ignored */ }

    try {
      const passes = carWashService.getPasses(businessId).filter((p) => new Date(p.createdAt).getTime() >= cutoffMs);
      // Strictly sum actual recorded purchase transactions; unpriced passes contribute 0 without invented estimates
      grossValue += passes.reduce((acc, p) => acc + (p.pricePaidMinor || 0), 0);
    } catch { /* ignored */ }

    try {
      const members = gymService.getMembers(businessId).filter((m) => new Date(m.createdAt).getTime() >= cutoffMs);
      // Strictly sum actual recorded purchase transactions; unpriced memberships contribute 0 without invented estimates
      grossValue += members.reduce((acc, m) => acc + (m.pricePaidMinor || 0), 0);
    } catch { /* ignored */ }

    try {
      const jobs = genericService.getJobs(businessId).filter((j) => new Date(j.timestamp).getTime() >= cutoffMs);
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
    const business = businessService.getBusinessById(businessId);
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

export const growthService = new GrowthService();
