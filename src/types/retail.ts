/**
 * Retail Domain Types for Loyaltydigitalqr
 * Minor currency units (cents/paise) used for all monetary values.
 */

export interface RetailProductCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface RetailProductVariant {
  id: string;
  name: string; // e.g., "Size", "Color"
  options: string[]; // e.g., ["S", "M", "L", "XL"]
}

export interface RetailProduct {
  id: string;
  businessId: string;
  locationId?: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sku?: string;
  price: number; // Integer minor currency units (e.g. 2500 for $25.00)
  currency: string;
  imageUrl?: string;
  isAvailable: boolean;
  isArchived: boolean;
  variants: RetailProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface RetailPurchaseItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number; // Integer minor currency units
  lineTotal: number; // quantity * unitPrice
  selectedVariant?: string;
}

export interface RetailPurchase {
  id: string;
  transactionNumber: string; // e.g. "#TX-1001"
  businessId: string;
  locationId: string;
  locationName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: RetailPurchaseItem[];
  subtotal: number; // minor units
  total: number;    // minor units
  currency: string;
  timestamp: string; // ISO string
  staffActor: string;
  qualifiesForLoyalty: boolean;
  loyaltyIssued?: boolean;
  loyaltyEventId?: string;
  idempotencyKey: string;
}

export interface RetailMetrics {
  activeProducts: number;
  availableProducts: number;
  qualifyingPurchases: number;
  loyaltyRewardsEarned: number;
  totalRevenueMinor: number;
}

export interface CreateProductInput {
  businessId: string;
  locationId?: string;
  name: string;
  description: string;
  categoryId: string;
  sku?: string;
  price: number; // minor units
  currency?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  variants?: RetailProductVariant[];
}

export interface RecordPurchaseInput {
  businessId: string;
  locationId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: {
    productId: string;
    quantity: number;
    selectedVariant?: string;
  }[];
  staffPin?: string;
  idempotencyKey?: string;
}

export interface PublicCatalogProfile {
  business: {
    id: string;
    name: string;
    slug: string;
    accentColor: string;
    logoInitial: string;
    currency: string;
    currencySymbol: string;
    address: string;
    phoneNumber?: string;
  };
  categories: RetailProductCategory[];
  products: RetailProduct[];
}
