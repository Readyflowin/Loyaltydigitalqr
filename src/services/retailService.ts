import type {
  RetailProductCategory,
  RetailProduct,
  RetailPurchase,
  RetailMetrics,
  CreateProductInput,
  RecordPurchaseInput,
  PublicCatalogProfile,
} from '../types/retail';
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId, shortCode } from '../lib/ids';
import { actorLabel } from '../lib/actor';
import { businessService } from './businessService';
import { loyaltyService } from './loyaltyService';

interface RetailBundle {
  categories: RetailProductCategory[];
  products: RetailProduct[];
  purchases: RetailPurchase[];
}

/**
 * Retail catalogue and in-store purchases, persisted per business:
 *   businesses/{id}/retailCategories, retailProducts (public: lookbook page)
 *   businesses/{id}/retailPurchases (members only)
 */
export const RETAIL_SPEC: ModuleSpec<RetailBundle> = {
  name: 'retail',
  arrays: [
    { key: 'categories', collection: 'retailCategories', public: true },
    { key: 'products', collection: 'retailProducts', public: true },
    {
      key: 'purchases',
      collection: 'retailPurchases',
      recent: { orderBy: 'timestamp', max: 1000 },
      sort: (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')),
    },
  ],
  empty: () => ({ categories: [], products: [], purchases: [] }),
};
bizStore.register(RETAIL_SPEC);

class RetailService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): Record<string, RetailBundle> {
    return bizStore.getAll(RETAIL_SPEC);
  }

  private saveData(data: Record<string, RetailBundle>): void {
    bizStore.saveAll(RETAIL_SPEC, data);
    this.notifyListeners();
  }

  private getBundle(businessId: string): RetailBundle {
    return bizStore.getBundle(RETAIL_SPEC, businessId);
  }
  // =========================================================================
  // CATEGORIES
  // =========================================================================

  getCategories(businessId: string): RetailProductCategory[] {
    return this.getBundle(businessId).categories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  createCategory(businessId: string, name: string, description?: string): RetailProductCategory {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const newCat: RetailProductCategory = {
      id: `cat_${newId()}`,
      businessId,
      name: name.trim(),
      description: description?.trim() || undefined,
      displayOrder: bundle.categories.length + 1,
      isEnabled: true,
      createdAt: new Date().toISOString(),
    };
    bundle.categories.push(newCat);
    data[businessId] = bundle;
    this.saveData(data);
    return newCat;
  }

  // =========================================================================
  // PRODUCTS
  // =========================================================================

  getProducts(
    businessId: string,
    options?: {
      categoryId?: string;
      search?: string;
      includeArchived?: boolean;
    }
  ): RetailProduct[] {
    const bundle = this.getBundle(businessId);
    let list = bundle.products;

    if (!options?.includeArchived) {
      list = list.filter((p) => !p.isArchived);
    }

    if (options?.categoryId && options.categoryId !== 'all') {
      list = list.filter((p) => p.categoryId === options.categoryId);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getProduct(businessId: string, productId: string): RetailProduct | null {
    const bundle = this.getBundle(businessId);
    return bundle.products.find((p) => p.id === productId) || null;
  }

  createProduct(input: CreateProductInput): { success: boolean; product?: RetailProduct; error?: string } {
    if (!input.name.trim()) {
      return { success: false, error: 'Product name is required.' };
    }
    if (input.price < 0 || isNaN(input.price)) {
      return { success: false, error: 'Valid product price is required.' };
    }

    const data = this.loadData();
    const bundle = data[input.businessId] || this.getBundle(input.businessId);
    const category = bundle.categories.find((c) => c.id === input.categoryId);
    const now = new Date().toISOString();

    const newProduct: RetailProduct = {
      id: `prod_${newId()}`,
      businessId: input.businessId,
      locationId: input.locationId || 'loc_retail_main',
      name: input.name.trim(),
      description: input.description?.trim() || '',
      categoryId: input.categoryId,
      categoryName: category?.name || 'General',
      sku: input.sku?.trim() || undefined,
      price: Math.round(input.price),
      currency: input.currency || 'USD',
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable !== false,
      isArchived: false,
      variants: input.variants || [],
      createdAt: now,
      updatedAt: now,
    };

    bundle.products.unshift(newProduct);
    data[input.businessId] = bundle;
    this.saveData(data);

    return { success: true, product: newProduct };
  }

  updateProduct(
    businessId: string,
    productId: string,
    updates: Partial<RetailProduct>
  ): { success: boolean; product?: RetailProduct; error?: string } {
    const data = this.loadData();
    const bundle = data[businessId] || this.getBundle(businessId);
    const index = bundle.products.findIndex((p) => p.id === productId);

    if (index === -1) {
      return { success: false, error: 'Product not found.' };
    }

    const current = bundle.products[index];
    const category = updates.categoryId
      ? bundle.categories.find((c) => c.id === updates.categoryId)
      : undefined;

    const updated: RetailProduct = {
      ...current,
      ...updates,
      categoryName: category ? category.name : current.categoryName,
      updatedAt: new Date().toISOString(),
    };

    bundle.products[index] = updated;
    data[businessId] = bundle;
    this.saveData(data);

    return { success: true, product: updated };
  }

  duplicateProduct(businessId: string, productId: string): RetailProduct | null {
    const current = this.getProduct(businessId, productId);
    if (!current) return null;

    const res = this.createProduct({
      businessId,
      locationId: current.locationId,
      name: `${current.name} (Copy)`,
      description: current.description,
      categoryId: current.categoryId,
      sku: current.sku ? `${current.sku}-CP` : undefined,
      price: current.price,
      currency: current.currency,
      imageUrl: current.imageUrl,
      isAvailable: current.isAvailable,
      variants: current.variants,
    });

    return res.product || null;
  }

  archiveProduct(businessId: string, productId: string): boolean {
    const res = this.updateProduct(businessId, productId, { isArchived: true, isAvailable: false });
    return res.success;
  }

  toggleAvailability(businessId: string, productId: string): boolean {
    const current = this.getProduct(businessId, productId);
    if (!current) return false;
    const res = this.updateProduct(businessId, productId, { isAvailable: !current.isAvailable });
    return res.success;
  }

  // =========================================================================
  // PURCHASE & VISIT TRACKING
  // =========================================================================

  recordPurchase(input: RecordPurchaseInput): {
    success: boolean;
    purchase?: RetailPurchase;
    loyaltyIssued?: boolean;
    error?: string;
  } {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'At least one product item is required.' };
    }

    const idempotencyKey = input.idempotencyKey || `tx_${newId()}`;
    const lockKey = `${input.businessId}_${idempotencyKey}`;

    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'A purchase transaction is already being processed.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const data = this.loadData();
      const bundle = data[input.businessId] || this.getBundle(input.businessId);

      // Duplicate protection: verify this transaction was not already recorded
      if (bundle.purchases.some((p) => p.idempotencyKey === idempotencyKey)) {
        return { success: false, error: 'Duplicate transaction detected. Purchase was already recorded.' };
      }

      const business = businessService.getBusinessById(input.businessId);
      const currency = business?.currency || 'USD';
      const locationId = input.locationId || business?.activeLocationId || 'loc_retail_main';
      const locationName = business?.locations.find((l) => l.id === locationId)?.name || 'Main Storefront';

      let subtotal = 0;
      const purchaseItems = input.items.map((it) => {
        const prod = bundle.products.find((p) => p.id === it.productId);
        const unitPrice = prod?.price || 0;
        const lineTotal = unitPrice * it.quantity;
        subtotal += lineTotal;
        return {
          productId: it.productId,
          productName: prod?.name || 'Retail Item',
          sku: prod?.sku,
          quantity: it.quantity,
          unitPrice,
          lineTotal,
          selectedVariant: it.selectedVariant,
        };
      });

      const txNumber = `#TX-${shortCode(5)}`;
      const now = new Date().toISOString();

      // Check loyalty qualification: purchases >= 1500 minor units ($15 / ₹150) qualify for loyalty stamp
      const qualifiesForLoyalty = subtotal >= 1500;
      let loyaltyIssued = false;

      if (qualifiesForLoyalty && input.customerId) {
        try {
          const res = loyaltyService.issueStamp({
            businessId: input.businessId,
            customerId: input.customerId,
            locationId,
            idempotencyKey,
          });
          loyaltyIssued = res.success;
        } catch (e) {
          console.warn('Loyalty stamp award notice:', e);
        }
      }

      const newPurchase: RetailPurchase = {
        id: `tx_${newId()}`,
        transactionNumber: txNumber,
        businessId: input.businessId,
        locationId,
        locationName,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        items: purchaseItems,
        subtotal,
        total: subtotal,
        currency,
        timestamp: now,
        staffActor: actorLabel('Floor Staff'),
        qualifiesForLoyalty,
        loyaltyIssued,
        idempotencyKey,
      };

      bundle.purchases.unshift(newPurchase);
      data[input.businessId] = bundle;
      this.saveData(data);

      return { success: true, purchase: newPurchase, loyaltyIssued };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  getPurchases(businessId: string): RetailPurchase[] {
    return this.getBundle(businessId).purchases;
  }

  getRetailMetrics(businessId: string): RetailMetrics {
    const bundle = this.getBundle(businessId);
    const activeProducts = bundle.products.filter((p) => !p.isArchived).length;
    const availableProducts = bundle.products.filter((p) => !p.isArchived && p.isAvailable).length;
    const qualifyingPurchases = bundle.purchases.filter((p) => p.qualifiesForLoyalty).length;
    const loyaltyRewardsEarned = bundle.purchases.filter((p) => p.loyaltyIssued).length;
    const totalRevenueMinor = bundle.purchases.reduce((acc, p) => acc + p.total, 0);

    return {
      activeProducts,
      availableProducts,
      qualifyingPurchases,
      loyaltyRewardsEarned,
      totalRevenueMinor,
    };
  }

  // =========================================================================
  // PUBLIC CATALOG PROFILE
  // =========================================================================

  getPublicCatalogProfile(slugOrId: string): PublicCatalogProfile | null {
    const business = businessService.findBusinessBySlug(slugOrId);

    if (!business || business.businessType !== 'retail') {
      return null;
    }

    const bundle = this.getBundle(business.id);
    const primaryLoc = business.locations[0] || { address: '' };

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        accentColor: business.accentColor || '#059669',
        logoInitial: business.logoInitial || business.name.charAt(0).toUpperCase(),
        currency: business.currency || 'USD',
        currencySymbol: business.currencySymbol || '$',
        address: primaryLoc.address,
        phoneNumber: business.phoneNumber,
      },
      categories: bundle.categories.filter((c) => c.isEnabled),
      products: bundle.products.filter((p) => !p.isArchived && p.isAvailable),
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
        console.error('Error in retailService listener:', e);
      }
    }
  }
}

export const retailService = new RetailService();
