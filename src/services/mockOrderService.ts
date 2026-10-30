/**
 * Shared Mock Order Service for Loyaltydigitalqr
 * Source of truth for café and restaurant customer orders, KDS queue, and status tracking.
 */

import type {
  Order,
  OrderStatus,
  CreateOrderInput,
  OrderItemSnapshot,
  OrderItemVariantSnapshot,
  OrderItemModifierSnapshot,
  OrderMetrics,
  OrderStatusHistoryEntry,
} from '../types/order';
import { VALID_STATUS_TRANSITIONS } from '../types/order';
import { mockBusinessService } from './mockBusinessService';
import { mockCafeService } from './mockCafeService';
import { generateBusinessSlug } from '../utils/qrUrlBuilder';

const STORAGE_KEY = 'loyalty_mock_orders_v1';
const IDEMPOTENCY_KEY = 'loyalty_mock_order_idempotency_v1';

type OrderStorageSchema = {
  [businessId: string]: Order[];
};

class MockOrderService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = this.getSeedOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }

  private loadData(): OrderStorageSchema {
    if (typeof window === 'undefined') {
      return this.getSeedOrders();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.getSeedOrders();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as OrderStorageSchema;
    } catch {
      return this.getSeedOrders();
    }
  }

  private saveData(data: OrderStorageSchema): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to save mock order data to localStorage:', err);
      }
    }
    this.notifyListeners();
  }

  /**
   * Seed Data Generator
   * Seeds realistic demo orders for Good Day Specialty Coffee (biz_user_primary)
   * across different lifecycle stages (preparing, ready, completed, new)
   */
  private getSeedOrders(): OrderStorageSchema {
    const now = Date.now();
    const primaryBizId = 'biz_user_primary';
    const primaryLocId = 'loc_main';

    const sampleOrders: Order[] = [
      {
        id: 'ord_1041_c9f1',
        orderNumber: '#1041',
        businessId: primaryBizId,
        businessName: 'Good Day Specialty Coffee',
        businessSlug: 'good-day-specialty-coffee',
        locationId: primaryLocId,
        locationName: 'Main Counter (Downtown)',
        orderType: 'dine_in',
        tableId: 'tbl_main_02',
        tableName: 'Table 02',
        customerName: 'Marcus T.',
        items: [
          {
            itemId: 'item_c1',
            name: 'Cappuccino',
            basePrice: 425,
            unitPrice: 485,
            quantity: 2,
            lineTotal: 970,
            variants: [
              {
                id: 'opt_s_large',
                groupName: 'Cup Size',
                name: 'Large (16 oz)',
                priceAdjustment: 70,
              },
            ],
            modifiers: [
              {
                id: 'mod_oat',
                name: 'Oat Milk (Barista Blend)',
                priceAdjustment: 60,
              },
            ],
            specialInstructions: 'Extra hot micro-foam',
            dietary: ['veg'],
          },
          {
            itemId: 'item_c6',
            name: 'Butter Almond Croissant',
            basePrice: 395,
            unitPrice: 395,
            quantity: 1,
            lineTotal: 395,
            variants: [],
            modifiers: [
              {
                id: 'mod_warm',
                name: 'Warmed in Oven',
                priceAdjustment: 0,
              },
            ],
            dietary: ['veg'],
          },
        ],
        subtotal: 1365,
        total: 1365,
        currency: 'USD',
        currencySymbol: '$',
        status: 'preparing',
        statusHistory: [
          {
            status: 'new',
            timestamp: new Date(now - 14 * 60000).toISOString(),
            actor: 'Customer (Table 02)',
            note: 'Order submitted via QR menu',
          },
          {
            status: 'accepted',
            timestamp: new Date(now - 12 * 60000).toISOString(),
            actor: 'Kitchen Staff',
            note: 'Accepted by Barista Station',
          },
          {
            status: 'preparing',
            timestamp: new Date(now - 8 * 60000).toISOString(),
            actor: 'Kitchen Staff',
            note: 'Steaming oat milk & warming pastry',
          },
        ],
        paymentStatus: 'paid_at_counter',
        estimatedWaitMinutes: 6,
        trackingToken: 'trk_goodday_1041_c9f1',
        createdAt: new Date(now - 14 * 60000).toISOString(),
        updatedAt: new Date(now - 8 * 60000).toISOString(),
      },
      {
        id: 'ord_1042_a2e8',
        orderNumber: '#1042',
        businessId: primaryBizId,
        businessName: 'Good Day Specialty Coffee',
        businessSlug: 'good-day-specialty-coffee',
        locationId: primaryLocId,
        locationName: 'Main Counter (Downtown)',
        orderType: 'dine_in',
        tableId: 'tbl_main_01',
        tableName: 'Table 01',
        customerName: 'Sarah M.',
        items: [
          {
            itemId: 'item_c2',
            name: 'Vanilla Bean Latte',
            basePrice: 475,
            unitPrice: 535,
            quantity: 1,
            lineTotal: 535,
            variants: [
              {
                id: 'opt_l_reg',
                groupName: 'Size',
                name: 'Regular (12 oz)',
                priceAdjustment: 0,
              },
            ],
            modifiers: [
              {
                id: 'mod_l_oat',
                name: 'Oat Milk',
                priceAdjustment: 60,
              },
            ],
            dietary: ['veg'],
          },
        ],
        subtotal: 535,
        total: 535,
        currency: 'USD',
        currencySymbol: '$',
        status: 'ready',
        statusHistory: [
          {
            status: 'new',
            timestamp: new Date(now - 20 * 60000).toISOString(),
            actor: 'Customer (Table 01)',
          },
          {
            status: 'accepted',
            timestamp: new Date(now - 18 * 60000).toISOString(),
            actor: 'Kitchen Staff',
          },
          {
            status: 'preparing',
            timestamp: new Date(now - 15 * 60000).toISOString(),
            actor: 'Kitchen Staff',
          },
          {
            status: 'ready',
            timestamp: new Date(now - 3 * 60000).toISOString(),
            actor: 'Kitchen Staff',
            note: 'Order plated & placed on pickup counter',
          },
        ],
        paymentStatus: 'paid_at_counter',
        estimatedWaitMinutes: 5,
        trackingToken: 'trk_goodday_1042_a2e8',
        createdAt: new Date(now - 20 * 60000).toISOString(),
        updatedAt: new Date(now - 3 * 60000).toISOString(),
      },
      {
        id: 'ord_1040_f88b',
        orderNumber: '#1040',
        businessId: primaryBizId,
        businessName: 'Good Day Specialty Coffee',
        businessSlug: 'good-day-specialty-coffee',
        locationId: primaryLocId,
        locationName: 'Main Counter (Downtown)',
        orderType: 'pickup',
        pickupLabel: 'Counter Pickup Station',
        customerName: 'David K.',
        items: [
          {
            itemId: 'item_c4',
            name: 'Nitro Cold Brew',
            basePrice: 495,
            unitPrice: 570,
            quantity: 1,
            lineTotal: 570,
            variants: [],
            modifiers: [
              {
                id: 'mod_sweet_cream',
                name: 'House Vanilla Sweet Cream',
                priceAdjustment: 75,
              },
            ],
            specialInstructions: 'No ice please',
            dietary: ['vegan', 'gluten_free'],
          },
        ],
        subtotal: 570,
        total: 570,
        currency: 'USD',
        currencySymbol: '$',
        status: 'completed',
        statusHistory: [
          {
            status: 'new',
            timestamp: new Date(now - 45 * 60000).toISOString(),
            actor: 'Customer (Pickup)',
          },
          {
            status: 'accepted',
            timestamp: new Date(now - 42 * 60000).toISOString(),
            actor: 'Staff',
          },
          {
            status: 'preparing',
            timestamp: new Date(now - 38 * 60000).toISOString(),
            actor: 'Kitchen Staff',
          },
          {
            status: 'ready',
            timestamp: new Date(now - 30 * 60000).toISOString(),
            actor: 'Kitchen Staff',
          },
          {
            status: 'completed',
            timestamp: new Date(now - 15 * 60000).toISOString(),
            actor: 'Counter Staff',
            note: 'Handed off to guest',
          },
        ],
        paymentStatus: 'paid',
        trackingToken: 'trk_goodday_1040_f88b',
        createdAt: new Date(now - 45 * 60000).toISOString(),
        updatedAt: new Date(now - 15 * 60000).toISOString(),
      },
    ];

    return {
      [primaryBizId]: sampleOrders,
      biz_salon_demo: [], // Barbershop has no cafe orders (isolated)
      biz_retail_demo: [],
    };
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  getOrders(businessId: string, locationId?: string, statusFilter?: string): Order[] {
    const data = this.loadData();
    const orders = data[businessId] || [];

    let filtered = orders;
    if (locationId && locationId !== 'all') {
      filtered = filtered.filter((o) => o.locationId === locationId);
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'in_progress') {
        filtered = filtered.filter((o) => o.status === 'accepted' || o.status === 'preparing');
      } else {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
    }

    // Sort by creation time descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(orderId: string): Order | null {
    const data = this.loadData();
    for (const bizId of Object.keys(data)) {
      const found = data[bizId].find((o) => o.id === orderId || o.orderNumber === orderId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Public Order Tracking Lookup
   * Strictly resolves orders ONLY by their dedicated, unguessable tracking token.
   * Internal order IDs (ord_*) and sequential display numbers (#1040) are strictly rejected
   * to eliminate order enumeration vulnerabilities.
   */
  getOrderByTrackingToken(token: string): Order | null {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.trim();
    if (!cleanToken) return null;

    const data = this.loadData();
    for (const bizId of Object.keys(data)) {
      const found = data[bizId].find((o) => o.trackingToken === cleanToken);
      if (found) return found;
    }
    return null;
  }

  getOrderMetrics(businessId: string): OrderMetrics {
    const orders = this.getOrders(businessId);
    const today = new Date().toISOString().split('T')[0];

    const ordersToday = orders.filter((o) => o.createdAt.startsWith(today));
    const newOrders = orders.filter((o) => o.status === 'new').length;
    const preparingOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'preparing').length;
    const readyOrders = orders.filter((o) => o.status === 'ready').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    const totalRevenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      ordersToday: ordersToday.length,
      newOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageWaitMinutes: 7,
    };
  }

  // =========================================================================
  // ORDER CREATION
  // =========================================================================

  createOrder(input: CreateOrderInput): { success: true; order: Order } | { success: false; error: string } {
    // 1. Idempotency Check
    if (input.idempotencyKey && typeof window !== 'undefined') {
      try {
        const rawIdem = localStorage.getItem(IDEMPOTENCY_KEY);
        const idemMap: { [key: string]: { orderId: string; timestamp: number } } = rawIdem ? JSON.parse(rawIdem) : {};
        const existing = idemMap[input.idempotencyKey];
        if (existing && Date.now() - existing.timestamp < 120000) {
          const prevOrder = this.getOrder(existing.orderId);
          if (prevOrder) {
            return { success: true, order: prevOrder };
          }
        }
      } catch {
        // Continue if idempotency map parse fails
      }
    }

    // 2. Validate Business
    const business = mockBusinessService.getAllBusinesses().find((b) => b.id === input.businessId);
    if (!business) {
      return { success: false, error: 'Business establishment not found.' };
    }
    if (business.businessType !== 'cafe' && business.businessType !== 'restaurant') {
      return { success: false, error: 'Ordering is only available for café and restaurant businesses.' };
    }

    // 3. Validate Published Menu
    const publishedMenu = mockCafeService.getActiveMenu(input.businessId);
    if (!publishedMenu || publishedMenu.status !== 'published') {
      return { success: false, error: 'The digital menu is currently in private draft mode or unavailable.' };
    }

    // 4. Validate Table if Dine-In
    let table = null;
    if (input.orderType === 'dine_in') {
      if (!input.tableId) {
        return { success: false, error: 'Please select a dining table for dine-in orders.' };
      }
      table = mockCafeService.getTable(input.businessId, input.tableId);
      if (!table) {
        return { success: false, error: 'The selected table is invalid or does not belong to this venue.' };
      }
    }

    // 5. Validate Items & Build Snapshots
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Your cart is empty. Please add items before placing an order.' };
    }

    const itemSnapshots: OrderItemSnapshot[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      const liveItem = mockCafeService.getItem(input.businessId, itemInput.menuItemId);
      if (!liveItem) {
        return { success: false, error: 'An item in your cart is no longer available on the menu.' };
      }

      // Revalidate Availability: Reject Sold Out
      if (liveItem.status === 'sold_out') {
        return {
          success: false,
          error: `"${liveItem.name}" is currently sold out in the kitchen. Please remove it from your cart.`,
        };
      }

      // Compute price adjustments
      let unitPrice = liveItem.price;
      const variantSnapshots: OrderItemVariantSnapshot[] = [];
      const modifierSnapshots: OrderItemModifierSnapshot[] = [];

      if (itemInput.selectedVariants) {
        for (const [groupId, opt] of Object.entries(itemInput.selectedVariants)) {
          const group = liveItem.variantGroups?.find((g) => g.id === groupId);
          unitPrice += opt.priceAdjustment;
          variantSnapshots.push({
            id: opt.id,
            groupName: group?.name || 'Size',
            name: opt.name,
            priceAdjustment: opt.priceAdjustment,
          });
        }
      }

      if (itemInput.selectedModifiers) {
        for (const [, opts] of Object.entries(itemInput.selectedModifiers)) {
          for (const opt of opts) {
            unitPrice += opt.priceAdjustment;
            modifierSnapshots.push({
              id: opt.id,
              name: opt.name,
              priceAdjustment: opt.priceAdjustment,
            });
          }
        }
      }

      const quantity = Math.max(1, itemInput.quantity || 1);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      itemSnapshots.push({
        itemId: liveItem.id,
        name: liveItem.name,
        basePrice: liveItem.price,
        unitPrice,
        quantity,
        lineTotal,
        variants: variantSnapshots,
        modifiers: modifierSnapshots,
        specialInstructions: itemInput.specialInstructions?.trim() || undefined,
        dietary: liveItem.dietary,
      });
    }

    // 6. Generate Sequential Order Number & Cryptographically Unpredictable Tracking Token
    const storageData = this.loadData();
    const existingOrders = storageData[input.businessId] || [];
    const nextSeq = 1040 + existingOrders.length + 1;
    const orderNumber = `#${nextSeq}`;
    
    // Cryptographically strong random token suffix
    let randSuffix: string;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      randSuffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    } else {
      randSuffix = Math.random().toString(36).substring(2, 10);
    }

    const orderId = `ord_${nextSeq}_${randSuffix.slice(0, 4)}`;
    const businessSlug = generateBusinessSlug(business.name);
    const trackingToken = `trk_${businessSlug}_${nextSeq}_${randSuffix}`;

    const locationId = input.locationId || table?.locationId || business.locations[0]?.id || 'loc_main';
    const location = business.locations.find((l) => l.id === locationId) || business.locations[0];

    const now = new Date().toISOString();

    const initialHistory: OrderStatusHistoryEntry = {
      status: 'new',
      timestamp: now,
      actor: input.orderType === 'dine_in' ? `Customer (${table?.displayName || 'Table'})` : 'Customer (Pickup)',
      note: 'Order submitted via QR digital menu',
    };

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      businessId: input.businessId,
      businessName: business.name,
      businessSlug,
      locationId,
      locationName: location?.name || 'Main Counter',
      orderType: input.orderType,
      tableId: table?.id,
      tableName: table?.displayName,
      pickupLabel: input.orderType === 'pickup' ? input.pickupLabel || 'Counter Pickup Station' : undefined,
      customerName: input.customerName?.trim() || undefined,
      customerPhone: input.customerPhone?.trim() || undefined,
      items: itemSnapshots,
      subtotal,
      total: subtotal, // No hidden fees
      currency: publishedMenu.currency,
      currencySymbol: publishedMenu.currencySymbol,
      status: 'new',
      statusHistory: [initialHistory],
      paymentStatus: 'paid_at_counter',
      estimatedWaitMinutes: 5 + Math.min(itemSnapshots.length * 2, 10),
      trackingToken,
      createdAt: now,
      updatedAt: now,
    };

    // Save to storage
    if (!storageData[input.businessId]) {
      storageData[input.businessId] = [];
    }
    storageData[input.businessId].unshift(newOrder);
    this.saveData(storageData);

    // Save Idempotency
    if (input.idempotencyKey && typeof window !== 'undefined') {
      try {
        const rawIdem = localStorage.getItem(IDEMPOTENCY_KEY);
        const idemMap = rawIdem ? JSON.parse(rawIdem) : {};
        idemMap[input.idempotencyKey] = { orderId, timestamp: Date.now() };
        localStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify(idemMap));
      } catch {
        // Ignore
      }
    }

    return { success: true, order: newOrder };
  }

  // =========================================================================
  // ORDER STATUS WORKFLOW STATE MACHINE
  // =========================================================================

  updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    actor = 'Staff',
    reason?: string
  ): { success: true; order: Order } | { success: false; error: string } {
    const storageData = this.loadData();
    let targetBizId: string | null = null;
    let targetIndex = -1;

    for (const bizId of Object.keys(storageData)) {
      const idx = storageData[bizId].findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        targetBizId = bizId;
        targetIndex = idx;
        break;
      }
    }

    if (!targetBizId || targetIndex === -1) {
      return { success: false, error: 'Order not found.' };
    }

    const currentOrder = storageData[targetBizId][targetIndex];

    // Idempotent return if already in nextStatus
    if (currentOrder.status === nextStatus) {
      return { success: true, order: currentOrder };
    }

    // Verify allowed transitions
    const allowed = VALID_STATUS_TRANSITIONS[currentOrder.status] || [];
    if (!allowed.includes(nextStatus)) {
      return {
        success: false,
        error: `Invalid transition: Order ${currentOrder.orderNumber} is "${currentOrder.status}" and cannot transition to "${nextStatus}".`,
      };
    }

    const now = new Date().toISOString();
    const historyEntry: OrderStatusHistoryEntry = {
      status: nextStatus,
      timestamp: now,
      actor,
      note: reason?.trim() || undefined,
    };

    const updatedOrder: Order = {
      ...currentOrder,
      status: nextStatus,
      cancellationReason: nextStatus === 'cancelled' ? reason?.trim() || 'Cancelled by staff' : currentOrder.cancellationReason,
      statusHistory: [...currentOrder.statusHistory, historyEntry],
      updatedAt: now,
    };

    storageData[targetBizId][targetIndex] = updatedOrder;
    this.saveData(storageData);

    return { success: true, order: updatedOrder };
  }

  // =========================================================================
  // REACTIVE SUBSCRIPTIONS
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
        console.error('Error in mockOrderService subscriber:', err);
      }
    });
  }
}

export const mockOrderService = new MockOrderService();
