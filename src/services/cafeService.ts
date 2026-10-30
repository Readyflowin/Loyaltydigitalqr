import type {
  Menu,
  MenuCategory,
  MenuItem,
  CafeTable,
  PublicBusinessProfile,
  PublicTableProfile,
} from '../types/cafe';
import { businessService } from './businessService';
import { generateBusinessSlug } from '../utils/qrUrlBuilder';

const STORAGE_KEY = 'loyalty_mock_cafe_data_v1';

export interface BusinessCafeBundle {
  menus: Menu[];
  categories: MenuCategory[];
  items: MenuItem[];
  tables: CafeTable[];
}

type CafeStorageSchema = {
  [businessId: string]: BusinessCafeBundle;
};

class CafeService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = this.getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }

  private loadData(): CafeStorageSchema {
    if (typeof window === 'undefined') {
      return this.getSeedData();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.getSeedData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as CafeStorageSchema;
    } catch {
      const fallback = this.getSeedData();
      return fallback;
    }
  }

  private saveData(data: CafeStorageSchema): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to save café mock data to localStorage:', err);
      }
    }
    this.notifyListeners();
  }

  private getBundle(businessId: string): BusinessCafeBundle {
    const data = this.loadData();
    if (!data[businessId]) {
      data[businessId] = {
        menus: [],
        categories: [],
        items: [],
        tables: [],
      };
      this.saveData(data);
    }
    return data[businessId];
  }

  /**
   * Seed Data Generator
   */
  private getSeedData(): CafeStorageSchema {
    const primaryMenuId = 'menu_primary_coffee';
    const primaryCatCoffee = 'cat_c1';
    const primaryCatTea = 'cat_c2';
    const primaryCatCold = 'cat_c3';
    const primaryCatBakery = 'cat_c4';
    const primaryCatFood = 'cat_c5';

    // 1. Primary US Business (Good Day Specialty Coffee)
    const primaryBundle: BusinessCafeBundle = {
      menus: [
        {
          id: primaryMenuId,
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          name: 'All-Day Café & Roastery Menu',
          description: 'Specialty seasonal roasts, cold brews, house-baked pastries, and artisan lunch sandwiches.',
          currency: 'USD',
          currencySymbol: '$',
          status: 'published',
          categoryIds: [primaryCatCoffee, primaryCatTea, primaryCatCold, primaryCatBakery, primaryCatFood],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
      ],
      categories: [
        {
          id: primaryCatCoffee,
          menuId: primaryMenuId,
          name: 'Coffee',
          description: 'Espresso beverages made with single-origin beans',
          displayOrder: 1,
          isEnabled: true,
        },
        {
          id: primaryCatTea,
          menuId: primaryMenuId,
          name: 'Tea',
          description: 'Artisan whole-leaf teas and spiced lattes',
          displayOrder: 2,
          isEnabled: true,
        },
        {
          id: primaryCatCold,
          menuId: primaryMenuId,
          name: 'Cold Drinks',
          description: 'Nitro cold brews and iced infusions',
          displayOrder: 3,
          isEnabled: true,
        },
        {
          id: primaryCatBakery,
          menuId: primaryMenuId,
          name: 'Bakery',
          description: 'Baked fresh daily in our roastery kitchen',
          displayOrder: 4,
          isEnabled: true,
        },
        {
          id: primaryCatFood,
          menuId: primaryMenuId,
          name: 'Food',
          description: 'Warm paninis and counter toasts',
          displayOrder: 5,
          isEnabled: true,
        },
      ],
      items: [
        {
          id: 'item_c1',
          menuId: primaryMenuId,
          categoryId: primaryCatCoffee,
          name: 'Cappuccino',
          description: 'Velvety micro-foamed milk poured over a rich double espresso shot with dark chocolate notes.',
          price: 425, // $4.25
          currency: 'USD',
          dietary: ['veg'],
          status: 'available',
          displayOrder: 1,
          variantGroups: [
            {
              id: 'vg_size',
              name: 'Cup Size',
              required: true,
              options: [
                { id: 'opt_s_small', name: 'Small (8 oz)', priceAdjustment: -50 },
                { id: 'opt_s_reg', name: 'Regular (12 oz)', priceAdjustment: 0, isDefault: true },
                { id: 'opt_s_large', name: 'Large (16 oz)', priceAdjustment: 70 },
              ],
            },
          ],
          modifierGroups: [
            {
              id: 'mg_milk',
              name: 'Milk Choice',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_whole', name: 'Whole Milk', priceAdjustment: 0, isDefault: true },
                { id: 'mod_oat', name: 'Oat Milk (Barista Blend)', priceAdjustment: 60 },
                { id: 'mod_almond', name: 'Almond Milk', priceAdjustment: 60 },
              ],
            },
            {
              id: 'mg_boosters',
              name: 'Add-ons',
              required: false,
              minSelections: 0,
              maxSelections: 2,
              options: [
                { id: 'mod_extra_shot', name: 'Extra Espresso Shot', priceAdjustment: 80 },
                { id: 'mod_vanilla_syrup', name: 'Vanilla Bean Syrup', priceAdjustment: 65 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c2',
          menuId: primaryMenuId,
          categoryId: primaryCatCoffee,
          name: 'Vanilla Bean Latte',
          description: 'Espresso balanced with steamed milk and Madagascar vanilla syrup.',
          price: 475, // $4.75
          currency: 'USD',
          dietary: ['veg'],
          status: 'available',
          displayOrder: 2,
          variantGroups: [
            {
              id: 'vg_latte_size',
              name: 'Size',
              required: true,
              options: [
                { id: 'opt_l_reg', name: 'Regular (12 oz)', priceAdjustment: 0, isDefault: true },
                { id: 'opt_l_large', name: 'Large (16 oz)', priceAdjustment: 75 },
              ],
            },
          ],
          modifierGroups: [
            {
              id: 'mg_latte_milk',
              name: 'Milk Preference',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_l_whole', name: 'Whole Milk', priceAdjustment: 0, isDefault: true },
                { id: 'mod_l_oat', name: 'Oat Milk', priceAdjustment: 60 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c3',
          menuId: primaryMenuId,
          categoryId: primaryCatCoffee,
          name: 'Caffè Americano',
          description: 'Bold espresso diluted with hot filtered water for a clean, aromatic cup.',
          price: 375, // $3.75
          currency: 'USD',
          dietary: ['vegan', 'gluten_free'],
          status: 'available',
          displayOrder: 3,
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c4',
          menuId: primaryMenuId,
          categoryId: primaryCatCold,
          name: 'Nitro Cold Brew',
          description: 'Slow-steeped for 20 hours and nitrogen-infused for a creamy cascading head.',
          price: 495, // $4.95
          currency: 'USD',
          dietary: ['vegan', 'gluten_free'],
          status: 'available',
          displayOrder: 1,
          modifierGroups: [
            {
              id: 'mg_nitro_cream',
              name: 'Sweet Cream Top',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_sweet_cream', name: 'House Vanilla Sweet Cream', priceAdjustment: 75 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c5',
          menuId: primaryMenuId,
          categoryId: primaryCatTea,
          name: 'Artisan Masala Chai',
          description: 'Brewed Assam black tea simmered with ginger, crushed green cardamom, and cinnamon.',
          price: 395, // $3.95
          currency: 'USD',
          dietary: ['veg'],
          status: 'available',
          displayOrder: 1,
          modifierGroups: [
            {
              id: 'mg_chai_milk',
              name: 'Milk Choice',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_c_whole', name: 'Steamed Whole Milk', priceAdjustment: 0, isDefault: true },
                { id: 'mod_c_oat', name: 'Steamed Oat Milk', priceAdjustment: 60 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c6',
          menuId: primaryMenuId,
          categoryId: primaryCatBakery,
          name: 'Butter Almond Croissant',
          description: 'Flaky twice-baked French croissant filled with almond cream and sliced almonds.',
          price: 395, // $3.95
          currency: 'USD',
          dietary: ['veg'],
          status: 'available',
          displayOrder: 1,
          modifierGroups: [
            {
              id: 'mg_temp',
              name: 'Serving Temperature',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_warm', name: 'Warmed in Oven', priceAdjustment: 0, isDefault: true },
                { id: 'mod_room', name: 'Room Temperature', priceAdjustment: 0 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c7',
          menuId: primaryMenuId,
          categoryId: primaryCatBakery,
          name: 'Fudge Chocolate Brownie',
          description: 'Decadent 70% dark chocolate brownie with a crinkly top and gooey center.',
          price: 350, // $3.50
          currency: 'USD',
          dietary: ['veg'],
          status: 'sold_out', // Seeded as sold out for immediate testing
          displayOrder: 2,
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'item_c8',
          menuId: primaryMenuId,
          categoryId: primaryCatFood,
          name: 'Grilled Mozzarella & Pesto Panini',
          description: 'Fresh fior di latte mozzarella, vine-ripened tomatoes, and basil pesto on toasted sourdough.',
          price: 850, // $8.50
          currency: 'USD',
          dietary: ['veg'],
          status: 'available',
          displayOrder: 1,
          modifierGroups: [
            {
              id: 'mg_bread',
              name: 'Bread Choice',
              required: false,
              minSelections: 0,
              maxSelections: 1,
              options: [
                { id: 'mod_sourdough', name: 'Rustic Sourdough', priceAdjustment: 0, isDefault: true },
                { id: 'mod_gf', name: 'Gluten-Free Bread', priceAdjustment: 100 },
              ],
            },
          ],
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
      ],
      tables: [
        {
          id: 'tbl_main_01',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          tableNumber: '01',
          displayName: 'Table 01',
          menuId: primaryMenuId,
          instruction: 'Point phone camera at code to open menu & order',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'tbl_main_02',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          tableNumber: '02',
          displayName: 'Table 02',
          menuId: primaryMenuId,
          instruction: 'Point phone camera at code to open menu & order',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'tbl_main_03',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          tableNumber: '03',
          displayName: 'Table 03',
          menuId: primaryMenuId,
          instruction: 'Point phone camera at code to open menu & order',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'tbl_main_p01',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          tableNumber: 'P1',
          displayName: 'Patio 01',
          menuId: primaryMenuId,
          instruction: 'Outdoor garden seating — server will deliver to patio',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'tbl_main_pickup',
          businessId: 'biz_user_primary',
          locationId: 'loc_main',
          tableNumber: 'PK',
          displayName: 'Counter Pickup',
          menuId: primaryMenuId,
          instruction: 'Pickup at counter station',
          status: 'active',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
      ],
    };

    // 2. Barbershop / Salon Business has NO café menus or tables (Empty Isolation)
    const salonBundle: BusinessCafeBundle = {
      menus: [],
      categories: [],
      items: [],
      tables: [],
    };

    return {
      biz_user_primary: primaryBundle,
      biz_salon_demo: salonBundle,
      biz_retail_demo: { menus: [], categories: [], items: [], tables: [] },
    };
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

    const business = businessService.getAllBusinesses().find((b) => b.id === businessId);
    const currency = data.currency || (business?.currency as 'USD' | 'INR') || 'USD';
    const currencySymbol = currency === 'INR' ? '₹' : '$';

    const newMenu: Menu = {
      id: `menu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
      `tbl_${data.locationId}_${data.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36).substring(4)}`;

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
    const businesses = businessService.getAllBusinesses();
    const targetSlug = slugOrId.toLowerCase().trim();

    // Match by slug or business ID
    const business = businesses.find(
      (b) =>
        b.id === slugOrId ||
        generateBusinessSlug(b.name) === targetSlug
    );

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
      slug: generateBusinessSlug(business.name),
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
