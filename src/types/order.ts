/**
 * Order Domain Types for Loyaltydigitalqr
 * Minor currency units (cents/paise) are used for all prices to eliminate floating-point arithmetic errors.
 */

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderType = 'dine_in' | 'pickup';

export type PaymentStatus = 'unpaid' | 'paid_at_counter' | 'paid';

export interface OrderItemModifierSnapshot {
  id: string;
  name: string;
  priceAdjustment: number; // in integer minor units (cents/paise)
}

export interface OrderItemVariantSnapshot {
  id: string;
  groupName: string;
  name: string;
  priceAdjustment: number; // in integer minor units
}

export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  basePrice: number; // in integer minor units
  unitPrice: number; // basePrice + variant adjustments + modifier adjustments
  quantity: number;
  lineTotal: number; // unitPrice * quantity
  variants: OrderItemVariantSnapshot[];
  modifiers: OrderItemModifierSnapshot[];
  specialInstructions?: string;
  dietary?: string[];
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string; // ISO 8601
  actor: string; // e.g. "Customer", "Kitchen Staff", "Counter Cashier", "Manager"
  note?: string;
}

export interface Order {
  id: string; // stable identifier: "ord_1042_a9f1"
  orderNumber: string; // human-readable e.g. "#1042"
  businessId: string;
  businessName: string;
  businessSlug: string;
  locationId: string;
  locationName: string;
  orderType: OrderType;
  tableId?: string; // e.g. "tbl_main_01"
  tableName?: string; // e.g. "Table 01"
  pickupLabel?: string; // e.g. "Counter Pickup"
  customerName?: string;
  customerPhone?: string;
  items: OrderItemSnapshot[];
  subtotal: number; // in integer minor units
  taxTotal?: number; // configured tax (0 if not configured)
  total: number; // in integer minor units
  currency: 'USD' | 'INR';
  currencySymbol: '$' | '₹';
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  estimatedWaitMinutes?: number;
  trackingToken: string; // secure public tracking token for /order/:trackingToken
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateOrderInput {
  businessId: string;
  locationId?: string;
  orderType: OrderType;
  tableId?: string;
  tableName?: string;
  pickupLabel?: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    menuItemId: string;
    quantity: number;
    selectedVariants?: { [groupId: string]: { id: string; name: string; priceAdjustment: number } };
    selectedModifiers?: { [groupId: string]: { id: string; name: string; priceAdjustment: number }[] };
    specialInstructions?: string;
  }[];
  idempotencyKey?: string;
}

export interface OrderMetrics {
  ordersToday: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number; // minor units of completed orders
  averageWaitMinutes: number;
}

/**
 * Valid state transitions for order workflow.
 * Terminal states (completed, cancelled) cannot transition backwards.
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Human-readable status labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New Order',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
