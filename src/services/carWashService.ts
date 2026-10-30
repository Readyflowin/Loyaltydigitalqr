import type {
  CarWashService,
  CarWashBundle,
  CarWashCustomerPass,
  CarWashVisitEvent,
  CarWashMetrics,
  CarWashTier,
  CarWashBundleType,
} from '../types/carwash';
import { loyaltyService } from './loyaltyService';

const STORAGE_KEY = 'loyalty_mock_carwash_v1';

interface CarWashStoreBundle {
  services: CarWashService[];
  bundles: CarWashBundle[];
  passes: CarWashCustomerPass[];
  visits: CarWashVisitEvent[];
}

export interface CreateCarWashServiceInput {
  businessId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  tier: CarWashTier;
}

export interface CreateCarWashBundleInput {
  businessId: string;
  name: string;
  description: string;
  price: number;
  bundleType: CarWashBundleType;
  totalVisits?: number;
  validityDays: number;
  includedServices: string[];
}

export interface AssignPassInput {
  businessId: string;
  locationId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehiclePlate?: string;
  vehicleMakeModel?: string;
  bundleId: string;
}

export interface RecordWashVisitInput {
  passId?: string;
  customerId?: string;
  serviceId?: string;
  vehiclePlate?: string;
  staffPin?: string;
  idempotencyKey?: string;
}

class CarWashOperationsService {
  private subscribers: Array<() => void> = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    const data = this.loadData();
    const bizId = 'biz_carwash_demo';

    if (data[bizId]) return;

    const now = new Date().toISOString();
    const today = new Date();

    const services: CarWashService[] = [
      {
        id: 'cws_express',
        businessId: bizId,
        name: 'Express Exterior Wash',
        description: 'High-pressure soft foam wash, spot-free rinse, wheel blast, and turbo blow dry.',
        price: 1800, // $18.00
        durationMinutes: 15,
        tier: 'express',
        isActive: true,
        createdAt: now,
      },
      {
        id: 'cws_deluxe',
        businessId: bizId,
        name: 'Deluxe Wash & Underbody Shield',
        description: 'Complete foam wash, rust-inhibiting underbody spray, triple shine wax, and tire dressing.',
        price: 3200, // $32.00
        durationMinutes: 25,
        tier: 'deluxe',
        isActive: true,
        createdAt: now,
      },
      {
        id: 'cws_ultimate',
        businessId: bizId,
        name: 'Ultimate Ceramic Glaze',
        description: 'Full exterior detail, hydrophobic ceramic wax coat, micro-scratch sealing, and rim polish.',
        price: 5500, // $55.00
        durationMinutes: 40,
        tier: 'ultimate',
        isActive: true,
        createdAt: now,
      },
      {
        id: 'cws_detail',
        businessId: bizId,
        name: 'Interior Steam Detail & Sanitize',
        description: 'Cabin vacuuming, leather conditioning, dashboard steam extraction, and anti-allergen fog.',
        price: 12000, // $120.00
        durationMinutes: 75,
        tier: 'detailing',
        isActive: true,
        createdAt: now,
      },
    ];

    const bundles: CarWashBundle[] = [
      {
        id: 'bun_5_express',
        businessId: bizId,
        name: '5-Wash Express Punch Pass',
        description: 'Save 20% on five fast express washes. Shareable with multiple vehicles in household.',
        price: 7500, // $75.00 ($15 per wash)
        bundleType: 'visit_pack',
        totalVisits: 5,
        validityDays: 90,
        includedServices: ['cws_express'],
        isActive: true,
        createdAt: now,
      },
      {
        id: 'bun_unlimited_deluxe',
        businessId: bizId,
        name: 'Unlimited Deluxe Monthly Pass',
        description: 'Wash your vehicle as often as you want. Includes unlimited deluxe clean & underbody wash.',
        price: 8900, // $89.00/mo
        bundleType: 'monthly_pass',
        validityDays: 30,
        includedServices: ['cws_express', 'cws_deluxe'],
        isActive: true,
        createdAt: now,
      },
    ];

    const passes: CarWashCustomerPass[] = [
      {
        id: 'pass_david',
        businessId: bizId,
        locationId: 'loc_wash_main',
        customerId: 'cust_david_cw',
        customerName: 'David Miller',
        customerPhone: '+1 555-0391',
        vehiclePlate: 'CA-7X9821',
        vehicleMakeModel: 'Honda CR-V',
        bundleId: 'bun_5_express',
        bundleName: '5-Wash Express Punch Pass',
        bundleType: 'visit_pack',
        startDate: new Date(today.getTime() - 86400000 * 10).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 80).toISOString().split('T')[0],
        totalVisits: 5,
        remainingVisits: 3,
        status: 'active',
        lastRedeemedAt: new Date(today.getTime() - 3600000 * 3).toISOString(),
        createdAt: now,
      },
      {
        id: 'pass_amanda',
        businessId: bizId,
        locationId: 'loc_wash_main',
        customerId: 'cust_amanda_cw',
        customerName: 'Amanda Hughes',
        customerPhone: '+1 555-0982',
        vehiclePlate: 'TX-WSH90',
        vehicleMakeModel: 'BMW 330i',
        bundleId: 'bun_unlimited_deluxe',
        bundleName: 'Unlimited Deluxe Monthly Pass',
        bundleType: 'monthly_pass',
        startDate: new Date(today.getTime() - 86400000 * 5).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 25).toISOString().split('T')[0],
        status: 'active',
        lastRedeemedAt: new Date(today.getTime() - 3600000 * 24).toISOString(),
        createdAt: now,
      },
      {
        id: 'pass_kevin',
        businessId: bizId,
        locationId: 'loc_wash_main',
        customerId: 'cust_kevin_cw',
        customerName: 'Kevin Vance',
        customerPhone: '+1 555-0774',
        vehiclePlate: 'NY-99K21',
        vehicleMakeModel: 'Ford F-150',
        bundleId: 'bun_5_express',
        bundleName: '5-Wash Express Punch Pass',
        bundleType: 'visit_pack',
        startDate: new Date(today.getTime() - 86400000 * 40).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 86400000 * 50).toISOString().split('T')[0],
        totalVisits: 5,
        remainingVisits: 0,
        status: 'exhausted',
        lastRedeemedAt: new Date(today.getTime() - 86400000 * 2).toISOString(),
        createdAt: now,
      },
    ];

    const visits: CarWashVisitEvent[] = [
      {
        id: 'cwv_seed_01',
        businessId: bizId,
        locationId: 'loc_wash_main',
        locationName: 'Bay #1 - Automatic Tunnel',
        passId: 'pass_david',
        customerId: 'cust_david_cw',
        customerName: 'David Miller',
        vehiclePlate: 'CA-7X9821',
        serviceOrBundleName: '5-Wash Express Punch Pass',
        timestamp: new Date(today.getTime() - 3600000 * 3).toISOString(),
        washType: 'pass_redemption',
        remainingVisitsAfter: 3,
        staffActor: 'Tunnel Attendant',
        loyaltyIssued: true,
        idempotencyKey: 'cwv_seed_david_today',
      },
    ];

    data[bizId] = { services, bundles, passes, visits };
    this.saveData(data);
  }

  private loadData(): Record<string, CarWashStoreBundle> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse car wash store:', e);
    }
    return {};
  }

  private saveData(data: Record<string, CarWashStoreBundle>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notify();
    } catch (e) {
      console.warn('Failed to save car wash store:', e);
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

  private getBundle(businessId: string): CarWashStoreBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = {
        services: [],
        bundles: [],
        passes: [],
        visits: [],
      };
      this.saveData(data);
    }
    return data[businessId];
  }

  // =========================================================================
  // SERVICES CRUD
  // =========================================================================

  getServices(businessId: string): CarWashService[] {
    return this.getBundle(businessId).services;
  }

  createService(input: CreateCarWashServiceInput): {
    success: boolean;
    service?: CarWashService;
    error?: string;
  } {
    if (!input.name.trim()) {
      return { success: false, error: 'Service name is required.' };
    }
    if (input.price < 0 || isNaN(input.price)) {
      return { success: false, error: 'Valid price in minor units is required.' };
    }

    const data = this.loadData();
    const bundle = data[input.businessId] || this.getBundle(input.businessId);

    const newService: CarWashService = {
      id: `cws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: Math.round(input.price),
      durationMinutes: input.durationMinutes || 20,
      tier: input.tier || 'express',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    bundle.services.push(newService);
    data[input.businessId] = bundle;
    this.saveData(data);

    return { success: true, service: newService };
  }

  updateService(
    businessId: string,
    serviceId: string,
    patch: Partial<CarWashService>
  ): { success: boolean; service?: CarWashService; error?: string } {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const index = bundle.services.findIndex((s) => s.id === serviceId);

    if (index === -1) {
      return { success: false, error: 'Service not found.' };
    }

    const updated = { ...bundle.services[index], ...patch };
    bundle.services[index] = updated;
    data[businessId] = bundle;
    this.saveData(data);

    return { success: true, service: updated };
  }

  // =========================================================================
  // BUNDLES / WASH PASSES CONFIGURATION
  // =========================================================================

  getBundles(businessId: string): CarWashBundle[] {
    return this.getBundle(businessId).bundles;
  }

  createBundle(input: CreateCarWashBundleInput): {
    success: boolean;
    bundle?: CarWashBundle;
    error?: string;
  } {
    if (!input.name.trim()) {
      return { success: false, error: 'Bundle name is required.' };
    }
    if (input.price < 0 || isNaN(input.price)) {
      return { success: false, error: 'Valid bundle price is required.' };
    }

    const data = this.loadData();
    const bundleStore = data[input.businessId] || this.getBundle(input.businessId);

    const newBundle: CarWashBundle = {
      id: `bun_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: Math.round(input.price),
      bundleType: input.bundleType,
      totalVisits: input.bundleType === 'visit_pack' ? input.totalVisits || 5 : undefined,
      validityDays: input.validityDays || 30,
      includedServices: input.includedServices || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    bundleStore.bundles.push(newBundle);
    data[input.businessId] = bundleStore;
    this.saveData(data);

    return { success: true, bundle: newBundle };
  }

  // =========================================================================
  // CUSTOMER PASSES
  // =========================================================================

  getPasses(businessId: string): CarWashCustomerPass[] {
    return this.getBundle(businessId).passes;
  }

  getPass(businessId: string, passId: string): CarWashCustomerPass | undefined {
    return this.getBundle(businessId).passes.find((p) => p.id === passId);
  }

  assignPass(input: AssignPassInput): {
    success: boolean;
    pass?: CarWashCustomerPass;
    error?: string;
  } {
    if (!input.customerId || !input.customerName) {
      return { success: false, error: 'Customer information is required.' };
    }
    const bundle = this.getBundles(input.businessId).find((b) => b.id === input.bundleId);
    if (!bundle) {
      return { success: false, error: 'Wash package not found.' };
    }

    const data = this.loadData();
    const store = data[input.businessId] || this.getBundle(input.businessId);

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + bundle.validityDays * 86400000)
      .toISOString()
      .split('T')[0];

    const newPass: CarWashCustomerPass = {
      id: `pass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: input.businessId,
      locationId: input.locationId || 'loc_wash_main',
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      vehiclePlate: input.vehiclePlate?.toUpperCase().trim(),
      vehicleMakeModel: input.vehicleMakeModel?.trim(),
      bundleId: bundle.id,
      bundleName: bundle.name,
      bundleType: bundle.bundleType,
      startDate,
      endDate,
      totalVisits: bundle.totalVisits,
      remainingVisits: bundle.totalVisits,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    store.passes.unshift(newPass);
    data[input.businessId] = store;
    this.saveData(data);

    return { success: true, pass: newPass };
  }

  // =========================================================================
  // WASH VISIT & PASS REDEMPTION TERMINAL
  // =========================================================================

  recordWashVisit(
    businessId: string,
    input: RecordWashVisitInput
  ): {
    success: boolean;
    visit?: CarWashVisitEvent;
    remainingVisits?: number;
    error?: string;
  } {
    // Determine whether pass-based or single service
    let pass: CarWashCustomerPass | undefined;
    if (input.passId) {
      pass = this.getPass(businessId, input.passId);
      if (!pass) {
        return { success: false, error: 'Wash pass record not found.' };
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // If using pass: validate status, expiration, remaining visits
    if (pass) {
      if (pass.status !== 'active') {
        return {
          success: false,
          error: `Redemption denied: Wash pass is currently ${pass.status.toUpperCase()}.`,
        };
      }
      if (pass.endDate && pass.endDate < todayStr) {
        return {
          success: false,
          error: `Redemption denied: Wash pass expired on ${pass.endDate}.`,
        };
      }
      if (pass.remainingVisits !== undefined && pass.remainingVisits <= 0) {
        return {
          success: false,
          error: 'Redemption denied: Pass has 0 remaining washes.',
        };
      }
    }

    // Duplicate check protection
    const identifier = pass ? pass.id : input.customerId || input.vehiclePlate || 'walkin';
    const idempotencyKey =
      input.idempotencyKey ||
      `cwv_${identifier}_${todayStr}_${Math.floor(Date.now() / 300000)}`;

    const lockKey = `${businessId}_${idempotencyKey}`;
    if (this.inFlightOperations.has(lockKey)) {
      return {
        success: false,
        error: 'Duplicate wash entry is currently processing. Please wait.',
      };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const data = this.loadData();
      const store = data[businessId] || this.getBundle(businessId);

      // Check if duplicate already completed
      const duplicate = store.visits.find((v) => v.idempotencyKey === idempotencyKey);
      if (duplicate) {
        return {
          success: false,
          error: `Duplicate wash visit prevented: ${duplicate.customerName} already recorded a wash today at ${new Date(
            duplicate.timestamp
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        };
      }

      let remainingVisitsAfter: number | undefined;
      let customerName = 'Walk-in Driver';
      let customerId = 'cust_walkin';
      let vehiclePlate = input.vehiclePlate || '';
      let serviceOrBundleName = 'Express Wash';

      if (pass) {
        customerName = pass.customerName;
        customerId = pass.customerId;
        vehiclePlate = pass.vehiclePlate || vehiclePlate;
        serviceOrBundleName = pass.bundleName;

        const passIndex = store.passes.findIndex((p) => p.id === pass!.id);
        if (pass.remainingVisits !== undefined) {
          const newRemaining = pass.remainingVisits - 1;
          store.passes[passIndex].remainingVisits = newRemaining;
          remainingVisitsAfter = newRemaining;
          if (newRemaining === 0) {
            store.passes[passIndex].status = 'exhausted';
          }
        }
        store.passes[passIndex].lastRedeemedAt = new Date().toISOString();
      } else if (input.serviceId) {
        const s = store.services.find((sv) => sv.id === input.serviceId);
        if (s) {
          serviceOrBundleName = s.name;
        }
      }

      const now = new Date().toISOString();

      // Issue loyalty stamp to customer profile if customerId is present
      let loyaltyIssued = false;
      if (customerId && customerId !== 'cust_walkin') {
        try {
          const res = loyaltyService.issueStamp({
            businessId,
            customerId,
            locationId: 'loc_wash_main',
            staffPin: input.staffPin || '8831',
            idempotencyKey,
          });
          loyaltyIssued = res.success;
        } catch (e) {
          console.warn('Loyalty stamp car wash notice:', e);
        }
      }

      const visitEvent: CarWashVisitEvent = {
        id: `cwv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId,
        locationId: 'loc_wash_main',
        locationName: 'Wash Tunnel #1',
        passId: pass?.id,
        customerId,
        customerName,
        vehiclePlate,
        serviceOrBundleName,
        timestamp: now,
        washType: pass ? 'pass_redemption' : 'single_service',
        remainingVisitsAfter,
        staffActor: input.staffPin ? `Staff PIN: ${input.staffPin}` : 'Tunnel Attendant',
        loyaltyIssued,
        idempotencyKey,
      };

      store.visits.unshift(visitEvent);
      data[businessId] = store;
      this.saveData(data);

      return {
        success: true,
        visit: visitEvent,
        remainingVisits: remainingVisitsAfter,
      };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  getVisits(businessId: string): CarWashVisitEvent[] {
    return this.getBundle(businessId).visits;
  }

  // =========================================================================
  // OVERVIEW METRICS
  // =========================================================================

  getCarWashMetrics(businessId: string): CarWashMetrics {
    const store = this.getBundle(businessId);
    const todayStr = new Date().toISOString().split('T')[0];

    const activePasses = store.passes.filter((p) => p.status === 'active').length;
    const washesToday = store.visits.filter((v) => v.timestamp.startsWith(todayStr)).length;

    const nextWeekStr = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const expiringPasses = store.passes.filter(
      (p) => p.status === 'active' && p.endDate && p.endDate >= todayStr && p.endDate <= nextWeekStr
    ).length;

    // Approximate revenue from services + bundles
    const serviceRev = store.services.reduce((acc, s) => acc + s.price, 0);
    const bundleRev = store.bundles.reduce((acc, b) => acc + b.price, 0);

    return {
      activePasses,
      washesToday,
      expiringPasses,
      popularTier: store.services[0]?.name || 'Express Exterior',
      totalWashRevenueCents: serviceRev + bundleRev,
    };
  }
}

export const carWashService = new CarWashOperationsService();
