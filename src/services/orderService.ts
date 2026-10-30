/**
 * Café and restaurant customer orders, KDS queue and status tracking.
 * Persisted per business in Firestore via bizStore: businesses/{id}/orders.
 *
 * Customers (visitors) can create an order and read only their own order by
 * its unguessable id; listing orders is restricted to business members.
 * Tracking links look like /order/{businessId}.{orderId}.
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
import { bizStore, type ModuleSpec } from '../lib/bizStore';
import { newId, shortCode } from '../lib/ids';
import { businessService } from './businessService';
import { cafeService } from './cafeService';

const IDEMPOTENCY_KEY = 'loyalty_order_idempotency_v1';

type OrderStorageSchema = {
  [businessId: string]: Order[];
};

interface OrderBundle {
  orders: Order[];
}

export const ORDER_SPEC: ModuleSpec<OrderBundle> = {
  name: 'orders',
  arrays: [
    {
      key: 'orders',
      collection: 'orders',
      recent: { orderBy: 'createdAt', max: 500 },
      sort: (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    },
  ],
  empty: () => ({ orders: [] }),
};
bizStore.register(ORDER_SPEC);

/** Split a tracking token into business id and order document id. */
export function parseOrderTrackingToken(token: string): { businessId: string; orderId: string } | null {
  const clean = (token || '').trim();
  const dot = clean.indexOf('.');
  if (dot <= 0 || dot === clean.length - 1) return null;
  const businessId = clean.slice(0, dot);
  const orderId = clean.slice(dot + 1);
  if (!/^[a-z0-9]{8,64}$/i.test(businessId) || !/^[a-z0-9_]{16,64}$/i.test(orderId)) return null;
  return { businessId, orderId };
}

class OrderService {
  private listeners: (() => void)[] = [];

  constructor() {
    bizStore.subscribe(() => this.notifyListeners());
  }

  private loadData(): OrderStorageSchema {
    const all = bizStore.getAll(ORDER_SPEC);
    const out: OrderStorageSchema = {};
    for (const [bizId, bundle] of Object.entries(all)) out[bizId] = bundle.orders;
    return out;
  }

  private saveData(data: OrderStorageSchema): void {
    const bundles: Record<string, OrderBundle> = {};
    for (const [bizId, orders] of Object.entries(data)) bundles[bizId] = { orders };
    bizStore.saveAll(ORDER_SPEC, bundles);
    this.notifyListeners();
  }

  /** Visitor tracking page: start watching one order by its tracking token. */
  watchOrder(token: string): boolean {
    const parsed = parseOrderTrackingToken(token);
    if (!parsed || !bizStore.getMode(parsed.businessId)) return false;
    bizStore.pinDoc(parsed.businessId, 'orders', parsed.orderId);
    return true;
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

    // Average minutes from order placed to "ready", over today's orders that reached ready.
    const waits = ordersToday
      .map((o) => {
        const readyAt = o.statusHistory.find((h) => h.status === 'ready')?.timestamp;
        return readyAt ? (new Date(readyAt).getTime() - new Date(o.createdAt).getTime()) / 60000 : null;
      })
      .filter((m): m is number => m !== null && m >= 0);
    const averageWaitMinutes = waits.length ? Math.round(waits.reduce((s, m) => s + m, 0) / waits.length) : 0;

    return {
      ordersToday: ordersToday.length,
      newOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageWaitMinutes,
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
    const business = businessService.getBusinessById(input.businessId);
    if (!business) {
      return { success: false, error: 'Business establishment not found.' };
    }
    if (business.businessType !== 'cafe' && business.businessType !== 'restaurant') {
      return { success: false, error: 'Ordering is only available for café and restaurant businesses.' };
    }

    // 3. Validate Published Menu
    const publishedMenu = cafeService.getActiveMenu(input.businessId);
    if (!publishedMenu || publishedMenu.status !== 'published') {
      return { success: false, error: 'The digital menu is currently in private draft mode or unavailable.' };
    }

    // 4. Validate Table if Dine-In
    let table = null;
    if (input.orderType === 'dine_in') {
      if (!input.tableId) {
        return { success: false, error: 'Please select a dining table for dine-in orders.' };
      }
      table = cafeService.getTable(input.businessId, input.tableId);
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
      const liveItem = cafeService.getItem(input.businessId, itemInput.menuItemId);
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

    // 6. Short counter code for staff + unguessable document id for tracking
    const storageData = this.loadData();
    const orderNumber = `#${shortCode(4)}`;
    const orderId = `${newId()}${newId()}`;
    const businessSlug = business.slug;
    const trackingToken = `${input.businessId}.${orderId}`;

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
        console.error('Error in orderService subscriber:', err);
      }
    });
  }
}

export const orderService = new OrderService();
