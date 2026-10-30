import type {
  MockBusiness,
  MockMetrics,
  MockActivity,
  MockChecklistItem,
  MockNotification,
} from '../types/business';
import { mockAuthService } from './mockAuthService';
import { mockLoyaltyService } from './mockLoyaltyService';
import type { OnboardingData } from '../types/onboarding';

const STORAGE_KEYS = {
  ACTIVE_BIZ_ID: 'loyalty_active_business_id',
  ACTIVE_LOCATIONS: 'loyalty_active_locations_map',
  SAVED_BUSINESSES: 'loyalty_saved_businesses',
};

class MockBusinessService {
  private listeners: (() => void)[] = [];

  constructor() {
    // Forward loyalty service updates to business subscribers
    mockLoyaltyService.subscribe(() => {
      this.notifyListeners();
    });
  }

  private getSavedLocationsMap(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_LOCATIONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // Generate initial businesses combining onboarded data and mock secondary venues
  private getInitialBusinesses(): MockBusiness[] {
    const completed = mockAuthService.getCompletedOnboarding();
    const draft = mockAuthService.getOnboardingDraft();
    const activeData: OnboardingData | null = completed || (draft && draft.businessName ? draft : null);
    const savedLocations = this.getSavedLocationsMap();

    const isIndia = activeData?.region === 'india';

    // Primary business based on onboarding if available
    const primaryBiz: MockBusiness = {
      id: 'biz_user_primary',
      name: activeData?.businessName?.trim() || (isIndia ? 'Chai & Co. Café' : 'Good Day Specialty Coffee'),
      businessType: activeData?.businessType || 'cafe',
      region: activeData?.region || (isIndia ? 'india' : 'usa'),
      currency: activeData?.region === 'india' ? 'INR' : 'USD',
      currencySymbol: activeData?.region === 'india' ? '₹' : '$',
      planName: 'Starter Plan',
      planPrice: activeData?.region === 'india' ? '₹299/mo' : '$10/mo',
      accentColor: activeData?.accentColor || '#3027F5',
      logoInitial: (activeData?.businessName?.trim() || 'G').charAt(0).toUpperCase(),
      timeZone: activeData?.timeZone || (isIndia ? 'Asia/Kolkata' : 'America/New_York'),
      contactEmail: activeData?.contactEmail || 'owner@example.com',
      phoneNumber: activeData?.phoneNumber || '+1 (555) 234-5678',
      locations: [
        {
          id: 'loc_main',
          name: 'Main Counter (Downtown)',
          address: activeData?.address || '142 Market St, Suite 101',
          isPrimary: true,
          staffPin: '4821',
        },
        {
          id: 'loc_express',
          name: 'Kiosk / Express Bar',
          address: 'Terminal 2 Concourse',
          isPrimary: false,
          staffPin: '1904',
        },
      ],
      activeLocationId: savedLocations['biz_user_primary'] || 'loc_main',
      programName: activeData?.programName || 'Coffee Regulars Club',
      stampsRequired: activeData?.stampsRequired || 8,
      rewardDescription: activeData?.rewardDescription || 'Buy 8 coffees, get your 9th drink free',
      selectedModules: activeData?.selectedModules || ['loyalty-cards'],
      isDemoSample: !completed,
    };

    // Secondary business 1: Salon & Barbershop for multi-business switching
    const salonBiz: MockBusiness = {
      id: 'biz_salon_demo',
      name: 'Apex Barbershop & Grooming',
      businessType: 'salon',
      region: 'usa',
      currency: 'USD',
      currencySymbol: '$',
      planName: 'Starter Plan',
      planPrice: '$10/mo',
      accentColor: '#E4C174',
      logoInitial: 'A',
      timeZone: 'America/New_York',
      contactEmail: 'contact@apexbarbers.com',
      phoneNumber: '+1 (555) 890-1234',
      locations: [
        {
          id: 'loc_salon_flagship',
          name: 'Flagship Studio (Uptown)',
          address: '88 Madison Ave',
          isPrimary: true,
          staffPin: '7392',
        },
        {
          id: 'loc_salon_sub',
          name: 'West End Chair Station',
          address: '420 W 42nd St',
          isPrimary: false,
          staffPin: '5510',
        },
      ],
      activeLocationId: savedLocations['biz_salon_demo'] || 'loc_salon_flagship',
      programName: 'VIP Grooming Pass',
      stampsRequired: 6,
      rewardDescription: 'Free scalp treatment or 15% off styling products',
      selectedModules: ['loyalty-cards', 'appointment-management', 'customer-profiles'],
      isDemoSample: true,
    };

    // Secondary business 2: Retail Boutique
    const retailBiz: MockBusiness = {
      id: 'biz_retail_demo',
      name: 'Velvet & Vine Boutique',
      businessType: 'retail',
      region: isIndia ? 'india' : 'usa',
      currency: isIndia ? 'INR' : 'USD',
      currencySymbol: isIndia ? '₹' : '$',
      planName: 'Starter Plan',
      planPrice: isIndia ? '₹299/mo' : '$10/mo',
      accentColor: '#059669',
      logoInitial: 'V',
      timeZone: isIndia ? 'Asia/Kolkata' : 'America/Chicago',
      contactEmail: 'hello@velvetvine.com',
      phoneNumber: '+1 (555) 432-8765',
      locations: [
        {
          id: 'loc_retail_main',
          name: 'Galleria Storefront',
          address: 'Galleria Mall Level 2',
          isPrimary: true,
          staffPin: '2049',
        },
      ],
      activeLocationId: 'loc_retail_main',
      programName: 'VIP Shopper Circle',
      stampsRequired: 10,
      rewardDescription: isIndia ? '₹500 voucher on next purchase' : '$20 voucher towards next purchase',
      selectedModules: ['loyalty-cards', 'product-catalogue', 'purchase-rewards'],
      isDemoSample: true,
    };

    // Secondary business 3: Gym & Fitness Club
    const gymBiz: MockBusiness = {
      id: 'biz_gym_demo',
      name: 'Iron & Pulse Fitness Club',
      businessType: 'gym',
      region: 'usa',
      currency: 'USD',
      currencySymbol: '$',
      planName: 'Pro Studio Plan',
      planPrice: '$10/mo',
      accentColor: '#D97706',
      logoInitial: 'I',
      timeZone: 'America/New_York',
      contactEmail: 'contact@ironpulse.fit',
      phoneNumber: '+1 (555) 765-4321',
      locations: [
        {
          id: 'loc_gym_main',
          name: 'Downtown Training Center',
          address: '250 Fitness Ave',
          isPrimary: true,
          staffPin: '8831',
        },
      ],
      activeLocationId: 'loc_gym_main',
      programName: 'FitRewards Club',
      stampsRequired: 12,
      rewardDescription: 'Free 1-on-1 personal training session or branded gym shaker',
      selectedModules: ['loyalty-cards', 'membership-management', 'visit-tracking', 'class-scheduling'],
      isDemoSample: true,
    };

    // Secondary business 4: Car Wash & Auto Spa
    const carwashBiz: MockBusiness = {
      id: 'biz_carwash_demo',
      name: 'Sparkle & Shine Auto Spa',
      businessType: 'carwash',
      region: 'usa',
      currency: 'USD',
      currencySymbol: '$',
      planName: 'Starter Plan',
      planPrice: '$10/mo',
      accentColor: '#0284C7',
      logoInitial: 'S',
      timeZone: 'America/Chicago',
      contactEmail: 'service@sparkleshine.com',
      phoneNumber: '+1 (555) 321-9876',
      locations: [
        {
          id: 'loc_carwash_main',
          name: 'Express Tunnel #1',
          address: '1200 Highway 10',
          isPrimary: true,
          staffPin: '6147',
        },
      ],
      activeLocationId: 'loc_carwash_main',
      programName: 'Clean Car Club',
      stampsRequired: 5,
      rewardDescription: 'Free Premium Ceramic Wash or Interior Detail',
      selectedModules: ['loyalty-cards', 'wash-services', 'prepaid-bundles', 'visit-tracking'],
      isDemoSample: true,
    };

    // Secondary business 5: Generic Service Business
    const serviceBiz: MockBusiness = {
      id: 'biz_service_demo',
      name: 'Apex Tech Repair & Services',
      businessType: 'service',
      region: 'usa',
      currency: 'USD',
      currencySymbol: '$',
      planName: 'Starter Plan',
      planPrice: '$10/mo',
      accentColor: '#7C3AED',
      logoInitial: 'T',
      timeZone: 'America/Los_Angeles',
      contactEmail: 'support@apextechrepair.com',
      phoneNumber: '+1 (555) 654-7890',
      locations: [
        {
          id: 'loc_service_main',
          name: 'Main Repair Desk',
          address: '500 Tech Blvd, Suite 2',
          isPrimary: true,
          staffPin: '3391',
        },
      ],
      activeLocationId: 'loc_service_main',
      programName: 'Service Loyalty Club',
      stampsRequired: 6,
      rewardDescription: '15% discount on repair labor or free diagnostic',
      selectedModules: ['loyalty-cards', 'service-catalogue', 'visit-tracking'],
      isDemoSample: true,
    };

    return [primaryBiz, salonBiz, retailBiz, gymBiz, carwashBiz, serviceBiz];
  }

  /**
   * Get all accessible businesses
   */
  getAllBusinesses(): MockBusiness[] {
    return this.getInitialBusinesses();
  }

  /**
   * Get a business by ID
   */
  getBusinessById(id: string): MockBusiness | undefined {
    return this.getAllBusinesses().find((b) => b.id === id);
  }

  /**
   * Get the currently active business workspace
   */
  getActiveBusiness(): MockBusiness {
    const businesses = this.getAllBusinesses();
    if (typeof window === 'undefined') return businesses[0];

    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_BIZ_ID);
    const found = businesses.find((b) => b.id === activeId);
    return found || businesses[0];
  }

  /**
   * Switch the active business workspace
   */
  setActiveBusiness(businessId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BIZ_ID, businessId);
      this.notifyListeners();
    }
  }

  /**
   * Switch the active location within the active business and persist to storage
   */
  setActiveLocation(businessId: string, locationId: string): void {
    const saved = this.getSavedLocationsMap();
    saved[businessId] = locationId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_LOCATIONS, JSON.stringify(saved));
      } catch {
        // ignore storage errors
      }
    }
    this.notifyListeners();
  }

  /**
   * Validate staff PIN against configured business location PIN
   */
  verifyStaffPin(businessId: string, pin: string, locationId?: string): boolean {
    if (!pin || typeof pin !== 'string') return false;
    const cleanPin = pin.trim();
    if (!cleanPin) return false;

    const business = this.getBusinessById(businessId);
    if (!business) return false;

    if (locationId) {
      const loc = business.locations.find((l) => l.id === locationId);
      if (loc && loc.staffPin) {
        return loc.staffPin === cleanPin;
      }
    }

    // Match against primary location or any location configured for this business
    return business.locations.some((l) => l.staffPin === cleanPin);
  }

  /**
   * Retrieve overview metrics tailored for a business
   */
  getMetrics(businessId: string): MockMetrics {
    const computed = mockLoyaltyService.getComputedMetrics(businessId);
    return {
      totalCustomers: computed.totalCustomers,
      loyaltyVisits: computed.loyaltyVisits,
      rewardsRedeemed: computed.rewardsRedeemed,
      repeatRate: computed.repeatRate,
      activeStamps: computed.activeStamps,
    };
  }

  /**
   * Retrieve activity feed for the active business
   */
  getActivities(businessId: string): MockActivity[] {
    const events = mockLoyaltyService.getEvents(businessId, 6);
    if (events.length === 0) {
      return [
        {
          id: 'act_empty',
          type: 'customer_joined',
          title: 'Workspace Initialized',
          subtitle: 'Ready to enroll customers and issue stamps.',
          timeAgo: 'Just now',
          badge: 'Ready',
        },
      ];
    }

    return events.map((e) => {
      let type: MockActivity['type'] = 'stamp_added';
      let badge = 'Visit Stamp';
      if (e.type === 'reward_unlocked') {
        type = 'reward_unlocked';
        badge = 'Reward Ready';
      } else if (e.type === 'reward_redeemed') {
        type = 'offer_redeemed';
        badge = 'Redeemed';
      } else if (e.type === 'customer_enrolled') {
        type = 'customer_joined';
        badge = 'New Member';
      } else if (e.type === 'program_updated') {
        type = 'pin_verified';
        badge = 'Config';
      }

      return {
        id: e.id,
        type,
        title: e.details,
        subtitle: `${e.staffIdentifier || 'Counter Staff'} · ${e.customerName || 'Loyalty Member'}`,
        timeAgo: this.formatTimeAgo(e.timestamp),
        badge,
      };
    });
  }

  private formatTimeAgo(timestamp: string): string {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  /**
   * Getting-started checklist for a business
   */
  getChecklist(businessId: string): MockChecklistItem[] {
    const isPrimary = businessId === 'biz_user_primary';
    const completed = mockAuthService.getCompletedOnboarding();

    return [
      {
        id: 'check_biz_profile',
        title: 'Business profile & counter configured',
        description: 'Storefront name, operating region, and time zone established.',
        isDone: isPrimary ? !!completed : true,
        targetView: 'settings',
      },
      {
        id: 'check_loyalty_rule',
        title: 'Initial loyalty reward milestone active',
        description: 'Stamps required and unlocked customer reward configured.',
        isDone: true,
        targetView: 'loyalty',
      },
      {
        id: 'check_qr_stand',
        title: 'Counter display QR kit ready to print',
        description: 'Generate high-res table stand PDF with your custom QR code.',
        isDone: false,
        targetView: 'qr-studio',
      },
      {
        id: 'check_preview_pass',
        title: 'Customer wallet pass previewed',
        description: 'Verify the mobile browser, Apple Wallet, and Google Wallet card view.',
        isDone: true,
        targetView: 'loyalty',
      },
      {
        id: 'check_first_stamp',
        title: 'Test staff PIN stamping on counter',
        description: 'Try adding a test stamp using your confidential 4-digit staff PIN.',
        isDone: false,
        targetView: 'overview',
      },
    ];
  }

  /**
   * Mock notifications list
   */
  getNotifications(): MockNotification[] {
    return [
      {
        id: 'notif_1',
        title: 'New Weekly Regulars Milestone',
        message: '14 customers reached 5+ stamps this week.',
        timeAgo: '2h ago',
        isRead: false,
      },
      {
        id: 'notif_2',
        title: 'Print Kit Downloaded',
        message: 'Counter standee QR PDF was downloaded for Main Counter.',
        timeAgo: '1d ago',
        isRead: true,
      },
      {
        id: 'notif_3',
        title: '30-Day Trial Active',
        message: 'Your unrestricted trial has 29 days remaining.',
        timeAgo: '1d ago',
        isRead: true,
      },
    ];
  }

  /**
   * Subscribe to business changes
   */
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

export const mockBusinessService = new MockBusinessService();
