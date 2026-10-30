/**
 * Café / restaurant digital menus, categories, items and tables.
 * Persisted per business in Firestore via bizStore (all publicly readable,
 * because the customer-facing QR menu shows them):
 *   businesses/{id}/menus, menuCategories, menuItems, tables
 */

import type {
  Menu,
  MenuCategory,
  MenuItem,
  CafeTable,
  PublicBusinessProfile,
  PublicTableProfile,
} from '../types/cafe';
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId } from '../lib/ids';
import { businessService } from './businessService';

export interface BusinessCafeBundle {
  menus: Menu[];
  categories: MenuCategory[];
  items: MenuItem[];
  tables: CafeTable[];
}

type CafeStorageSchema = {
  [businessId: string]: BusinessCafeBundle;
};

const byCreated = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(a.createdAt || '').localeCompare(String(b.createdAt || ''));

export const CAFE_SPEC: ModuleSpec<BusinessCafeBundle> = {
  name: 'cafe',
  arrays: [
    { key: 'menus', collection: 'menus', public: true, sort: byCreated },
    { key: 'categories', collection: 'menuCategories', public: true, sort: byCreated },
    { key: 'items', collection: 'menuItems', public: true, sort: byCreated },
    { key: 'tables', collection: 'tables', public: true, sort: byCreated },
  ],
  empty: () => ({ menus: [], categories: [], items: [], tables: [] }),
};
bizStore.register(CAFE_SPEC);

class CafeService {
  private listeners: (() => void)[] = [];

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): CafeStorageSchema {
    return bizStore.getAll(CAFE_SPEC);
  }

  private saveData(data: CafeStorageSchema): void {
    bizStore.saveAll(CAFE_SPEC, data);
    this.notifyListeners();
  }

  private getBundle(businessId: string): BusinessCafeBundle {
    return bizStore.getBundle(CAFE_SPEC, businessId);
  }

  // =========================================================================
  // MENU OPERATIONS
  // =========================================================================

  getMenus(businessId: string): Menu[] {
    return this.getBundle(businessId).menus;
  }

  getMenu(businessId: string, menuId: string): Menu | null {
    const menus = this.getMenus(businessId);
    return menus.find((m) => m.id === menuId) || null;
  }

  getActiveMenu(businessId: string): Menu | null {
    const menus = this.getMenus(businessId);
    return menus.find((m) => m.status === 'published') || menus[0] || null;
  }

  createMenu(
    businessId: string,
    data: {
      name: string;
      description?: string;
      currency?: 'USD' | 'INR';
      locationId?: string;
    }
  ): Menu {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);

    const business = businessService.getBusinessById(businessId);
    const currency = data.currency || (business?.currency as 'USD' | 'INR') || 'USD';
    const currencySymbol = currency === 'INR' ? '₹' : '$';

    const newMenu: Menu = {
      id: `menu_${newId()}`,
      businessId,
      locationId: data.locationId,
      name: data.name.trim(),
      description: data.description?.trim(),
      currency,
      currencySymbol,
      status: 'draft',
      categoryIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bundle.menus.unshift(newMenu);
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return newMenu;
  }

  updateMenu(businessId: string, menuId: string, updates: Partial<Menu>): Menu | null {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const index = bundle.menus.findIndex((m) => m.id === menuId);
    if (index === -1) return null;

    const updated: Menu = {
      ...bundle.menus[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    bundle.menus[index] = updated;
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return updated;
  }

  deleteMenu(businessId: string, menuId: string): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const prevLen = bundle.menus.length;
    bundle.menus = bundle.menus.filter((m) => m.id !== menuId);
    bundle.categories = bundle.categories.filter((c) => c.menuId !== menuId);
    bundle.items = bundle.items.filter((i) => i.menuId !== menuId);

    if (bundle.menus.length !== prevLen) {
      storageData[businessId] = bundle;
      this.saveData(storageData);
      return true;
    }
    return false;
  }

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  getCategories(businessId: string, menuId: string): MenuCategory[] {
    const bundle = this.getBundle(businessId);
    const cats = bundle.categories.filter((c) => c.menuId === menuId);
    return cats.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  createCategory(
    businessId: string,
    menuId: string,
    data: { name: string; description?: string }
  ): MenuCategory {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const existing = bundle.categories.filter((c) => c.menuId === menuId);

    const newCategory: MenuCategory = {
      id: `cat_${newId()}`,
      menuId,
      name: data.name.trim(),
      description: data.description?.trim(),
      displayOrder: existing.length + 1,
      isEnabled: true,
    };

    bundle.categories.push(newCategory);

    // Update menu categoryIds
    const menu = bundle.menus.find((m) => m.id === menuId);
    if (menu) {
      menu.categoryIds.push(newCategory.id);
      menu.updatedAt = new Date().toISOString();
    }

    storageData[businessId] = bundle;
    this.saveData(storageData);
    return newCategory;
  }

  updateCategory(
    businessId: string,
    categoryId: string,
    updates: Partial<MenuCategory>
  ): MenuCategory | null {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const index = bundle.categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return null;

    const updated: MenuCategory = {
      ...bundle.categories[index],
      ...updates,
    };

    bundle.categories[index] = updated;
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return updated;
  }

  reorderCategories(businessId: string, menuId: string, categoryIds: string[]): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const menu = bundle.menus.find((m) => m.id === menuId);
    if (!menu) return false;

    menu.categoryIds = categoryIds;
    menu.updatedAt = new Date().toISOString();

    categoryIds.forEach((id, index) => {
      const cat = bundle.categories.find((c) => c.id === id);
      if (cat) cat.displayOrder = index + 1;
    });

    storageData[businessId] = bundle;
    this.saveData(storageData);
    return true;
  }

  deleteCategory(businessId: string, menuId: string, categoryId: string): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const prevLen = bundle.categories.length;

    bundle.categories = bundle.categories.filter((c) => c.id !== categoryId);
    // Also delete items belonging to this category
    bundle.items = bundle.items.filter((i) => i.categoryId !== categoryId);

    const menu = bundle.menus.find((m) => m.id === menuId);
    if (menu) {
      menu.categoryIds = menu.categoryIds.filter((id) => id !== categoryId);
      menu.updatedAt = new Date().toISOString();
    }

    if (bundle.categories.length !== prevLen) {
      storageData[businessId] = bundle;
      this.saveData(storageData);
      return true;
    }
    return false;
  }

  // =========================================================================
  // ITEM OPERATIONS
  // =========================================================================

  getItems(businessId: string, menuId: string, categoryId?: string): MenuItem[] {
    const bundle = this.getBundle(businessId);
    let items = bundle.items.filter((i) => i.menuId === menuId);
    if (categoryId) {
      items = items.filter((i) => i.categoryId === categoryId);
    }
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getItem(businessId: string, itemId: string): MenuItem | null {
    const items = this.getBundle(businessId).items;
    return items.find((i) => i.id === itemId) || null;
  }

  createItem(
    businessId: string,
    menuId: string,
    data: Omit<MenuItem, 'id' | 'menuId' | 'createdAt' | 'updatedAt' | 'displayOrder'>
  ): MenuItem {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const categoryItems = bundle.items.filter(
      (i) => i.menuId === menuId && i.categoryId === data.categoryId
    );

    const newItem: MenuItem = {
      ...data,
      id: `item_${newId()}`,
      menuId,
      displayOrder: categoryItems.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bundle.items.push(newItem);
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return newItem;
  }

  updateItem(businessId: string, itemId: string, updates: Partial<MenuItem>): MenuItem | null {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const index = bundle.items.findIndex((i) => i.id === itemId);
    if (index === -1) return null;

    const updated: MenuItem = {
      ...bundle.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    bundle.items[index] = updated;
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return updated;
  }

  duplicateItem(businessId: string, itemId: string): MenuItem | null {
    const item = this.getItem(businessId, itemId);
    if (!item) return null;

    const duplicateData: Omit<MenuItem, 'id' | 'menuId' | 'createdAt' | 'updatedAt' | 'displayOrder'> = {
      categoryId: item.categoryId,
      name: `${item.name} (Copy)`,
      description: item.description,
      price: item.price,
      currency: item.currency,
      imageRef: item.imageRef,
      dietary: item.dietary ? [...item.dietary] : undefined,
      status: item.status,
      variantGroups: item.variantGroups ? JSON.parse(JSON.stringify(item.variantGroups)) : undefined,
      modifierGroups: item.modifierGroups ? JSON.parse(JSON.stringify(item.modifierGroups)) : undefined,
    };

    return this.createItem(businessId, item.menuId, duplicateData);
  }

  toggleItemAvailability(businessId: string, itemId: string): MenuItem | null {
    const item = this.getItem(businessId, itemId);
    if (!item) return null;
    const nextStatus = item.status === 'available' ? 'sold_out' : 'available';
    return this.updateItem(businessId, itemId, { status: nextStatus });
  }

  deleteItem(businessId: string, itemId: string): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const prevLen = bundle.items.length;
    bundle.items = bundle.items.filter((i) => i.id !== itemId);
    if (bundle.items.length !== prevLen) {
      storageData[businessId] = bundle;
      this.saveData(storageData);
      return true;
    }
    return false;
  }

  // =========================================================================
  // TABLE OPERATIONS
  // =========================================================================

  getTables(businessId: string, locationId?: string): CafeTable[] {
    const bundle = this.getBundle(businessId);
    let tables = bundle.tables.filter((t) => t.status === 'active');
    if (locationId) {
      tables = tables.filter((t) => t.locationId === locationId);
    }
    return tables;
  }

  getTable(businessId: string, tableId: string): CafeTable | null {
    const tables = this.getBundle(businessId).tables;
    return tables.find((t) => t.id === tableId) || null;
  }

  createTable(
    businessId: string,
    data: {
      displayName: string;
      tableNumber: string;
      locationId: string;
      menuId: string;
      instruction?: string;
      customTableId?: string; // Optional custom stable ID
    }
  ): CafeTable {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);

    // Prevent duplicate table identifiers within same location
    const normalizedNumber = data.tableNumber.trim().toUpperCase();
    const existing = bundle.tables.find(
      (t) =>
        t.status === 'active' &&
        t.locationId === data.locationId &&
        t.tableNumber.toUpperCase() === normalizedNumber
    );

    if (existing) {
      return existing; // Idempotent return
    }

    const tableId =
      data.customTableId?.trim() ||
      `tbl_${data.locationId}_${data.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}_${newId().slice(0, 8)}`;

    const newTable: CafeTable = {
      id: tableId,
      businessId,
      locationId: data.locationId,
      tableNumber: data.tableNumber.trim(),
      displayName: data.displayName.trim(),
      menuId: data.menuId,
      instruction: data.instruction?.trim() || 'Scan with smartphone camera to view menu & order',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bundle.tables.push(newTable);
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return newTable;
  }

  updateTable(businessId: string, tableId: string, updates: Partial<CafeTable>): CafeTable | null {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const index = bundle.tables.findIndex((t) => t.id === tableId);
    if (index === -1) return null;

    // Preserve the stable ID even if updates try to overwrite it
    const updated: CafeTable = {
      ...bundle.tables[index],
      ...updates,
      id: bundle.tables[index].id,
      updatedAt: new Date().toISOString(),
    };

    bundle.tables[index] = updated;
    storageData[businessId] = bundle;
    this.saveData(storageData);
    return updated;
  }

  deleteTable(businessId: string, tableId: string): boolean {
    const storageData = this.loadData();
    const bundle = storageData[businessId] || this.getBundle(businessId);
    const prevLen = bundle.tables.length;
    bundle.tables = bundle.tables.filter((t) => t.id !== tableId);
    if (bundle.tables.length !== prevLen) {
      storageData[businessId] = bundle;
      this.saveData(storageData);
      return true;
    }
    return false;
  }

  // =========================================================================
  // PUBLIC MENU RESOLVER (Strips private merchant & staff data)
  // =========================================================================

  getPublicMenuBySlug(
    slugOrId: string,
    targetTableId?: string
  ): {
    business: PublicBusinessProfile;
    menu: Menu;
    categories: MenuCategory[];
    items: MenuItem[];
    table?: PublicTableProfile;
    allTables: PublicTableProfile[];
  } | null {
    // Match by slug or business ID (loaded via businessService.loadPublicBusiness)
    const business = businessService.findBusinessBySlug(slugOrId);

    if (!business) return null;

    // Check if café/restaurant
    if (business.businessType !== 'cafe' && business.businessType !== 'restaurant') {
      return null;
    }

    const bundle = this.getBundle(business.id);
    const publishedMenu = bundle.menus.find((m) => m.status === 'published');
    if (!publishedMenu) return null;

    const categories = bundle.categories
      .filter((c) => c.menuId === publishedMenu.id && c.isEnabled)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const items = bundle.items
      .filter((i) => i.menuId === publishedMenu.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const primaryLoc = business.locations[0] || {
      name: 'Main Location',
      address: 'Storefront',
    };

    const publicBusiness: PublicBusinessProfile = {
      id: business.id,
      slug: business.slug,
      name: business.name,
      businessType: business.businessType,
      currency: publishedMenu.currency,
      currencySymbol: publishedMenu.currencySymbol,
      accentColor: business.accentColor || '#3027F5',
      logoInitial: business.logoInitial || business.name.charAt(0).toUpperCase(),
      description: publishedMenu.description,
      locationName: primaryLoc.name,
      locationAddress: primaryLoc.address,
    };

    const allTables: PublicTableProfile[] = bundle.tables
      .filter((t) => t.status === 'active')
      .map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        displayName: t.displayName,
        locationName: primaryLoc.name,
      }));

    let matchedTable: PublicTableProfile | undefined;
    if (targetTableId) {
      matchedTable = allTables.find((t) => t.id === targetTableId);
    }

    return {
      business: publicBusiness,
      menu: publishedMenu,
      categories,
      items,
      table: matchedTable,
      allTables,
    };
  }

  // =========================================================================
  // REACTIVE SUBSCRIPTION
  // =========================================================================

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in cafeService subscriber:', err);
      }
    });
  }
}

export const cafeService = new CafeService();
