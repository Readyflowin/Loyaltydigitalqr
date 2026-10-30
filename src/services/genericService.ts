import type {
  GenericServiceItem,
  GenericServiceJobEvent,
  GenericServiceMetrics,
} from '../types/serviceBusiness';
import { loyaltyService } from './loyaltyService';

const STORAGE_KEY = 'loyalty_mock_generic_service_v1';

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

class GenericService {
  private subscribers: Array<() => void> = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    const data = this.loadData();
    const bizId = 'biz_service_demo';

    if (data[bizId]) return;

    const now = new Date().toISOString();
    const today = new Date();

    const services: GenericServiceItem[] = [
      {
        id: 'svc_screen_repair',
        businessId: bizId,
        name: 'OLED Display & Glass Replacement',
        description: 'Complete front digitizer and panel replacement with OEM grade calibration.',
        price: 8900, // $89.00
        category: 'Repairs',
        estimatedMinutes: 45,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'svc_diagnostics',
        businessId: bizId,
        name: 'Comprehensive Hardware Diagnostic',
        description: 'Full motherboard, battery cycle health, logic board, and charging port audit.',
        price: 3500, // $35.00
        category: 'Diagnostics',
        estimatedMinutes: 30,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'svc_battery',
        businessId: bizId,
        name: 'High-Capacity Battery Replacement',
        description: 'Fresh certified cell installation with waterproof adhesive gasket re-seal.',
        price: 5500, // $55.00
        category: 'Repairs',
        estimatedMinutes: 30,
        isActive: true,
        createdAt: now,
      },
      {
        id: 'svc_data_backup',
        businessId: bizId,
        name: 'Secure Data Transfer & Board Recovery',
        description: 'Bit-level recovery from corrupted sectors, NAND extraction, and cloud mirroring.',
        price: 11500, // $115.00
        category: 'Data Services',
        estimatedMinutes: 60,
        isActive: true,
        createdAt: now,
      },
    ];

    const jobs: GenericServiceJobEvent[] = [
      {
        id: 'job_seed_01',
        businessId: bizId,
        serviceId: 'svc_screen_repair',
        serviceName: 'OLED Display & Glass Replacement',
        customerId: 'cust_seed_apex_01',
        customerName: 'Marcus Vance',
        customerPhone: '+1 555-0819',
        amountCharged: 8900,
        notes: 'Repaired front glass on Pixel 8 Pro. Tested touch response 100%.',
        timestamp: new Date(today.getTime() - 3600000 * 2).toISOString(),
        status: 'completed',
        loyaltyIssued: true,
        idempotencyKey: 'job_seed_apex_01',
      },
    ];

    data[bizId] = { services, jobs };
    this.saveData(data);
  }

  private loadData(): Record<string, GenericServiceBundle> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse generic service data:', e);
    }
    return {};
  }

  private saveData(data: Record<string, GenericServiceBundle>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notify();
    } catch (e) {
      console.warn('Failed to save generic service data:', e);
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

  private getBundle(businessId: string): GenericServiceBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = { services: [], jobs: [] };
      this.saveData(data);
    }
    return data[businessId];
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
      id: `svc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    if (!input.serviceId) {
      return { success: false, error: 'Service must be selected.' };
    }
    if (!input.customerId) {
      return { success: false, error: 'Customer must be selected.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
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
          staffPin: input.staffPin || '8831',
          idempotencyKey,
        });
        loyaltyIssued = res.success;
      } catch (e) {
        console.warn('Loyalty stamp generic service notice:', e);
      }

      const newJob: GenericServiceJobEvent = {
        id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    const todayStr = new Date().toISOString().split('T')[0];

    const jobsCompletedToday = bundle.jobs.filter(
      (j) => j.timestamp.startsWith(todayStr) && j.status === 'completed'
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
