/**
 * Remembers the orders a customer placed from the public menu on this device,
 * so they can re-open live tracking from the menu page (not just the one-time
 * confirmation). Scoped per business and kept only for a few hours.
 */

export interface RecentOrder {
  token: string;
  orderNumber: string;
  placedAt: string; // ISO timestamp
}

const KEY = (businessId: string) => `menu_recent_orders_${businessId}`;
const MAX_ENTRIES = 5;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export function getRecentOrders(businessId: string): RecentOrder[] {
  try {
    const raw = localStorage.getItem(KEY(businessId));
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentOrder[];
    if (!Array.isArray(list)) return [];
    const now = Date.now();
    return list.filter(
      (o) => o && typeof o.token === 'string' && o.placedAt && now - new Date(o.placedAt).getTime() < MAX_AGE_MS
    );
  } catch {
    return [];
  }
}

export function addRecentOrder(businessId: string, order: { token: string; orderNumber: string }): void {
  try {
    const existing = getRecentOrders(businessId).filter((o) => o.token !== order.token);
    const next: RecentOrder[] = [
      { token: order.token, orderNumber: order.orderNumber, placedAt: new Date().toISOString() },
      ...existing,
    ].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY(businessId), JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — the one-time confirmation link still works
  }
}
