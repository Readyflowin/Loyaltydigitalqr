/**
 * Café & Restaurant Menu, Tables, and Ordering Types for Loyaltydigitalqr
 * Minor currency units (cents/paise) are used for all prices to eliminate floating-point arithmetic errors.
 */

export type DietaryTag = 'veg' | 'non_veg' | 'vegan' | 'gluten_free';

export interface MenuItemVariantOption {
  id: string;
  name: string; // e.g. "Small", "Regular", "Large"
  priceAdjustment: number; // in integer minor units (e.g. +70 cents = 70)
  isDefault?: boolean;
}

export interface MenuItemVariantGroup {
  id: string;
  name: string; // e.g. "Cup Size", "Portion Size"
  required: boolean;
  options: MenuItemVariantOption[];
}

export interface MenuItemModifierOption {
  id: string;
  name: string; // e.g. "Oat Milk", "Almond Milk", "Extra Espresso Shot"
  priceAdjustment: number; // in integer minor units (e.g. +60 cents = 60)
  isDefault?: boolean;
}

export interface MenuItemModifierGroup {
  id: string;
  name: string; // e.g. "Milk Choice", "Add-on Boosters"
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuItemModifierOption[];
}

export interface MenuItem {
  id: string;
  menuId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in minor units: $4.50 = 450, ₹150 = 15000
  currency: 'USD' | 'INR';
  imageRef?: string;
  dietary?: DietaryTag[];
  status: 'available' | 'sold_out';
  displayOrder: number;
  variantGroups?: MenuItemVariantGroup[];
  modifierGroups?: MenuItemModifierGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  menuId: string;
  name: string; // e.g. "Coffee", "Tea", "Cold Drinks", "Bakery", "Food"
  description?: string;
  displayOrder: number;
  isEnabled: boolean;
}

export interface Menu {
  id: string;
  businessId: string;
  locationId?: string;
  name: string; // e.g. "All-Day Café Menu"
  description?: string;
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  status: 'published' | 'draft';
  categoryIds: string[]; // Ordered list of category IDs
  createdAt: string;
  updatedAt: string;
}

export interface CafeTable {
  id: string; // stable identifier: "tbl_main_01"
  businessId: string;
  locationId: string;
  tableNumber: string; // "01", "02", "P1", "Bar"
  displayName: string; // "Table 01", "Table 02", "Patio 01"
  menuId: string; // associated published menu
  instruction?: string; // "Scan with phone camera to view menu"
  status: 'active' | 'archived';
  qrCodeId?: string; // cross-ref to QrCodeDefinition
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer Shopping Cart Item
 */
export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  selectedVariants: { [groupId: string]: MenuItemVariantOption };
  selectedModifiers: { [groupId: string]: MenuItemModifierOption[] };
  quantity: number;
  unitPrice: number; // Calculated base price + variant adjustments + modifier adjustments in minor units
  lineTotal: number; // unitPrice * quantity
  specialInstructions?: string;
}

/**
 * Public Customer View Profile
 * Stripped of any private merchant settings, staff PINs, or internal keys.
 */
export interface PublicBusinessProfile {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  accentColor: string;
  logoInitial: string;
  description?: string;
  locationName: string;
  locationAddress: string;
}

export interface PublicTableProfile {
  id: string;
  tableNumber: string;
  displayName: string;
  locationName: string;
}

/**
 * Format helper for currency minor units
 * USD: 450 minor units -> $4.50
 * INR: 15000 minor units -> ₹150 or ₹150.00
 */
export function formatMinorUnits(amountInMinor: number, currency: string = 'USD'): string {
  const isRupee = currency.toUpperCase() === 'INR';
  const symbol = isRupee ? '₹' : '$';
  const major = amountInMinor / 100;
  if (isRupee && amountInMinor % 100 === 0) {
    return `${symbol}${major.toFixed(0)}`;
  }
  return `${symbol}${major.toFixed(2)}`;
}
