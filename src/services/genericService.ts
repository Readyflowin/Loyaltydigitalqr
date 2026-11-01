import type {
  GenericServiceItem,
  GenericServiceJobEvent,
  GenericServiceMetrics,
} from '../types/serviceBusiness';
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId } from '../lib/ids';
import { businessService } from './businessService';
import { loyaltyService } from './loyaltyService';
import { localDateKey, isLocalToday } from '../utils/dates';

interface GenericServiceBundle {
  services: GenericServiceItem[];
  jobs: GenericServiceJobEvent[];
}

export interface CreateGenericServiceInput {
  businessId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  estimatedMinutes: number;
}

export interface RecordJobInput {
  businessId: string;
  serviceId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amountCharged: number;
  notes?: string;
  status?: 'completed' | 'in_progress';
  staffPin?: string;
  idempotencyKey?: string;
}

/**
 * Generic service businesses: service catalogue and job log (members only):
 *   businesses/{id}/serviceItems, serviceJobs
 */
export const GENERIC_SPEC: ModuleSpec<GenericServiceBundle> = {
  name: 'generic',
  arrays: [
    // Services are shown on the public storefront page (/services/:slug).
    { key: 'services', collection: 'serviceItems', public: true },
    {
      key: 'jobs',
      collection: 'serviceJobs',
      recent: { orderBy: 'timestamp', max: 1000 },
      sort: (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')),
    },
  ],
  empty: () => ({ services: [], jobs: [] }),
};
bizStore.register(GENERIC_SPEC);

class GenericService {
  private subscribers: Array<() => void> = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    bizStore.subscribe(() => this.notify());
  }

  private loadData(): Record<string, GenericServiceBundle> {
    return bizStore.getAll(GENERIC_SPEC);
  }

  private saveData(data: Record<string, GenericServiceBundle>) {
    bizStore.saveAll(GENERIC_SPEC, data);
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

  private getBundle(businessId: string): GenericServiceBundle {
    return bizStore.getBundle(GENERIC_SPEC, businessId);
  }

  // =========================================================================
  // SERVICES CRUD
  // =========================================================================

  getServices(businessId: string): GenericServiceItem[] {
    return this.getBundle(businessId).services;
  }

  createService(input: CreateGenericServiceInput): {
    success: boolean;
    service?: GenericServiceItem;
    error?: string;
  } {
    if (!input.name.trim()) {
      return { success: false, error: 'Service name is required.' };
    }
    if (input.price < 0 || isNaN(input.price)) {
      return { success: false, error: 'Valid price is required.' };
    }

    const data = this.loadData();
    const bundle = data[input.businessId] || this.getBundle(input.businessId);

    const newService: GenericServiceItem = {
      id: `svc_${newId()}`,
      businessId: input.businessId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: Math.round(input.price),
      category: input.category.trim() || 'General',
      estimatedMinutes: input.estimatedMinutes || 30,
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
    patch: Partial<GenericServiceItem>
  ): { success: boolean; service?: GenericServiceItem; error?: string } {
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
  // JOBS & VISIT TRACKING
  // =========================================================================

  getJobs(businessId: string): GenericServiceJobEvent[] {
    return this.getBundle(businessId).jobs;
  }

  recordJob(input: RecordJobInput): {
    success: boolean;
    job?: GenericServiceJobEvent;
    error?: string;
  } {
    if (input.staffPin && !businessService.verifyStaffPin(input.businessId, input.staffPin)) {
      return { success: false, error: 'Invalid staff PIN.' };
    }
    if (!input.serviceId) {
      return { success: false, error: 'Service must be selected.' };
    }
    if (!input.customerId) {
      return { success: false, error: 'Customer must be selected.' };
    }

    const todayStr = localDateKey();
    const idempotencyKey =
      input.idempotencyKey ||
      `job_${input.customerId}_${input.serviceId}_${todayStr}_${Math.floor(Date.now() / 300000)}`;

    const lockKey = `${input.businessId}_${idempotencyKey}`;
    if (this.inFlightOperations.has(lockKey)) {
      return {
        success: false,
        error: 'Job is currently processing. Please wait.',
      };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const data = this.loadData();
      const bundle = data[input.businessId] || this.getBundle(input.businessId);

      const duplicate = bundle.jobs.find((j) => j.idempotencyKey === idempotencyKey);
      if (duplicate) {
        return {
          success: false,
          error: `Duplicate service entry prevented: ${input.customerName} already has this service recorded today.`,
        };
      }

      const service = bundle.services.find((s) => s.id === input.serviceId);
      const serviceName = service ? service.name : 'Custom Service';
      const now = new Date().toISOString();

      let loyaltyIssued = false;
      try {
        const res = loyaltyService.issueStamp({
          businessId: input.businessId,
          customerId: input.customerId,
          locationId: 'loc_service_main',
          idempotencyKey,
        });
        loyaltyIssued = res.success;
      } catch (e) {
        console.warn('Loyalty stamp generic service notice:', e);
      }

      const newJob: GenericServiceJobEvent = {
        id: `job_${newId()}`,
        businessId: input.businessId,
        serviceId: input.serviceId,
        serviceName,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        amountCharged: Math.round(input.amountCharged),
        notes: input.notes?.trim(),
        timestamp: now,
        status: input.status || 'completed',
        loyaltyIssued,
        idempotencyKey,
      };

      bundle.jobs.unshift(newJob);
      data[input.businessId] = bundle;
      this.saveData(data);

      return { success: true, job: newJob };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  // =========================================================================
  // METRICS
  // =========================================================================

  getMetrics(businessId: string): GenericServiceMetrics {
    const bundle = this.getBundle(businessId);

    const jobsCompletedToday = bundle.jobs.filter(
      (j) => isLocalToday(j.timestamp) && j.status === 'completed'
    ).length;

    const totalServiceRevenueCents = bundle.jobs.reduce((acc, j) => acc + j.amountCharged, 0);

    const activeJobsCount = bundle.jobs.filter((j) => j.status === 'in_progress').length;

    return {
      totalServices: bundle.services.filter((s) => s.isActive).length,
      jobsCompletedToday,
      totalServiceRevenueCents,
      activeJobsCount,
    };
  }
}

export const genericService = new GenericService();
