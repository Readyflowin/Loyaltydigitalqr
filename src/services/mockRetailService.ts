import type {
  RetailProductCategory,
  RetailProduct,
  RetailPurchase,
  RetailMetrics,
  CreateProductInput,
  RecordPurchaseInput,
  PublicCatalogProfile,
} from '../types/retail';
import { mockBusinessService } from './mockBusinessService';
import { mockLoyaltyService } from './mockLoyaltyService';
import { generateBusinessSlug } from '../utils/qrUrlBuilder';

const STORAGE_KEY = 'loyalty_mock_retail_v1';

interface RetailBundle {
  categories: RetailProductCategory[];
  products: RetailProduct[];
  purchases: RetailPurchase[];
}

class MockRetailService {
  private listeners: (() => void)[] = [];
  private inFlightOperations = new Set<string>();

  private loadData(): Record<string, RetailBundle> {
    if (typeof window === 'undefined') return this.getInitialData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const init = this.getInitialData();
        this.saveData(init);
        return init;
      }
      return JSON.parse(raw);
    } catch {
      return this.getInitialData();
    }
  }

  private saveData(data: Record<string, RetailBundle>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save retail store to localStorage:', e);
    }
  }

  private getInitialData(): Record<string, RetailBundle> {
    const bizId = 'biz_retail_demo';
    const now = new Date().toISOString();

    const categories: RetailProductCategory[] = [
      {
        id: 'cat_apparel',
        businessId: bizId,
        name: 'Apparel & Knitwear',
        description: 'Modern silhouettes, premium natural fabrics, and relaxed tailoring.',
        displayOrder: 1,
        isEnabled: true,
        createdAt: now,
      },
      {
        id: 'cat_acc',
        businessId: bizId,
        name: 'Accessories & Leather',
        description: 'Handcrafted bags, scarves, and curated leather essentials.',
        displayOrder: 2,
        isEnabled: true,
        createdAt: now,
      },
      {
        id: 'cat_fragrance',
        businessId: bizId,
        name: 'Fragrance & Candles',
        description: 'Artisanal soy wax candles, botanic scents, and home aromas.',
        displayOrder: 3,
        isEnabled: true,
        createdAt: now,
      },
      {
        id: 'cat_home',
        businessId: bizId,
        name: 'Home Decor & Gifts',
        description: 'Unique tabletop accents, ceramics, and thoughtful host gifts.',
        displayOrder: 4,
        isEnabled: true,
        createdAt: now,
      },
    ];

    const products: RetailProduct[] = [
      {
        id: 'prod_silk_dress',
        businessId: bizId,
        locationId: 'loc_retail_main',
        name: 'Silk Blend Slip Dress',
        description: 'Bias-cut midi slip dress crafted from fluid mulberry silk blend. Features delicate adjustable straps.',
        categoryId: 'cat_apparel',
        categoryName: 'Apparel & Knitwear',
        sku: 'VV-DR-01',
        price: 12000, // $120.00
        currency: 'USD',
        isAvailable: true,
        isArchived: false,
        variants: [
          { id: 'v_size', name: 'Size', options: ['XS', 'S', 'M', 'L'] },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_linen_blazer',
        businessId: bizId,
        locationId: 'loc_retail_main',
        name: 'Linen Relaxed Blazer',
        description: 'Single-breasted unstructured blazer made with 100% European flax linen. Perfect warm-weather layer.',
        categoryId: 'cat_apparel',
        categoryName: 'Apparel & Knitwear',
        sku: 'VV-BL-04',
        price: 16500, // $165.00
        currency: 'USD',
        isAvailable: true,
        isArchived: false,
        variants: [
          { id: 'v_size', name: 'Size', options: ['S', 'M', 'L'] },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_leather_bag',
        businessId: bizId,
        locationId: 'loc_retail_main',
        name: 'Leather Saddle Crossbody Bag',
        description: 'Vegetable-tanned saddle leather crossbody with brushed brass hardware and interior suede slip pocket.',
        categoryId: 'cat_acc',
        categoryName: 'Accessories & Leather',
        sku: 'VV-BG-12',
        price: 14500, // $145.00
        currency: 'USD',
        isAvailable: true,
        isArchived: false,
        variants: [
          { id: 'v_color', name: 'Color', options: ['Cognac', 'Noir', 'Olive'] },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_amber_candle',
        businessId: bizId,
        locationId: 'loc_retail_main',
        name: 'Amber & Fig Soy Candle',
        description: 'Hand-poured 10oz natural soy candle with wooden wick. Notes of ripe fig, amber woods, and cedar.',
        categoryId: 'cat_fragrance',
        categoryName: 'Fragrance & Candles',
        sku: 'VV-CN-09',
        price: 3200, // $32.00
        currency: 'USD',
        isAvailable: true,
        isArchived: false,
        variants: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_cashmere_scarf',
        businessId: bizId,
        locationId: 'loc_retail_main',
        name: 'Cashmere Fringe Scarf',
        description: 'Ultra-soft featherweight Mongolian cashmere with delicate eyelash fringe edges.',
        categoryId: 'cat_acc',
        categoryName: 'Accessories & Leather',
        sku: 'VV-SC-03',
        price: 8500, // $85.00
        currency: 'USD',
        isAvailable: true,
        isArchived: false,
        variants: [
          { id: 'v_color', name: 'Color', options: ['Oatmeal', 'Charcoal', 'Blush'] },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const purchases: RetailPurchase[] = [
      {
        id: 'tx_1001',
        transactionNumber: '#TX-1001',
        businessId: bizId,
        locationId: 'loc_retail_main',
        locationName: 'Galleria Storefront',
        customerId: 'cust_sarah_01',
        customerName: 'Sarah Miller',
        customerEmail: 'sarah.m@example.com',
        items: [
          {
            productId: 'prod_amber_candle',
            productName: 'Amber & Fig Soy Candle',
            sku: 'VV-CN-09',
            quantity: 2,
            unitPrice: 3200,
            lineTotal: 6400,
          },
        ],
        subtotal: 6400,
        total: 6400,
        currency: 'USD',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        staffActor: 'Counter Staff',
        qualifiesForLoyalty: true,
        loyaltyIssued: true,
        idempotencyKey: 'tx_seed_1001',
      },
    ];

    return {
      [bizId]: {
        categories,
        products,
        purchases,
      },
      biz_user_primary: { categories: [], products: [], purchases: [] },
      biz_salon_demo: { categories: [], products: [], purchases: [] },
    };
  }

  private getBundle(businessId: string): RetailBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = {
        categories: [],
        products: [],
        purchases: [],
      };
      this.saveData(data);
    }
    return data[businessId];
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
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    const idempotencyKey = input.idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

      const business = mockBusinessService.getAllBusinesses().find((b) => b.id === input.businessId);
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

      const txNumber = `#TX-${1000 + bundle.purchases.length + 1}`;
      const now = new Date().toISOString();

      // Check loyalty qualification: purchases >= 1500 minor units ($15 / ₹150) qualify for loyalty stamp
      const qualifiesForLoyalty = subtotal >= 1500;
      let loyaltyIssued = false;

      if (qualifiesForLoyalty && input.customerId) {
        try {
          const res = mockLoyaltyService.issueStamp({
            businessId: input.businessId,
            customerId: input.customerId,
            locationId,
            staffPin: input.staffPin || '2049',
            idempotencyKey,
          });
          loyaltyIssued = res.success;
        } catch (e) {
          console.warn('Loyalty stamp award notice:', e);
        }
      }

      const newPurchase: RetailPurchase = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
        staffActor: input.staffPin ? `Staff PIN: ${input.staffPin}` : 'Floor Staff',
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
    const businesses = mockBusinessService.getAllBusinesses();
    const target = slugOrId.toLowerCase().trim();

    const business = businesses.find((b) => {
      const slug = generateBusinessSlug(b.name).toLowerCase();
      const normTarget = target.replace(/-and-/g, '-');
      const normSlug = slug.replace(/-and-/g, '-');
      return (
        b.id === slugOrId ||
        slug === target ||
        normSlug === normTarget ||
        slug.replace(/-/g, '') === target.replace(/-/g, '') ||
        normTarget.includes(normSlug) ||
        normSlug.includes(normTarget)
      );
    });

    if (!business || business.businessType !== 'retail') {
      return null;
    }

    const bundle = this.getBundle(business.id);
    const primaryLoc = business.locations[0] || { address: 'Retail Storefront' };

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: generateBusinessSlug(business.name),
        accentColor: business.accentColor || '#059669',
        logoInitial: business.logoInitial || 'V',
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
        console.error('Error in mockRetailService listener:', e);
      }
    }
  }
}

export const mockRetailService = new MockRetailService();
