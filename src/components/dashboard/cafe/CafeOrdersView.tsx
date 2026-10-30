import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  Flame,
  ChefHat,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { Order, OrderStatus } from '../../../types/order';
import { ORDER_STATUS_LABELS } from '../../../types/order';
import { orderService } from '../../../services/orderService';
import { formatMinorUnits } from '../../../types/cafe';
import { useRouter } from '../../../router';

interface CafeOrdersViewProps {
  business: Business;
  theme: ThemeMode;
}

export const CafeOrdersView: React.FC<CafeOrdersViewProps> = ({ business }) => {
  const { navigate } = useRouter();
  const isFoodService = business.businessType === 'cafe' || business.businessType === 'restaurant';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = orderService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancellation dialog state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Copied link toast feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!isFoodService) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Order Management Not Available
          </h2>
          <p className="text-sm text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            The active workspace (<strong>{business.name}</strong>) is configured as a{' '}
            <strong>{business.businessType}</strong>. Order queue and kitchen displays are scoped strictly to café and restaurant businesses.
          </p>
        </div>
      </div>
    );
  }

  const allOrders = orderService.getOrders(business.id);
  const metrics = orderService.getOrderMetrics(business.id);

  // Filtered orders
  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tableName && order.tableName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'new') matchesStatus = order.status === 'new';
    else if (statusFilter === 'in_progress') matchesStatus = order.status === 'accepted' || order.status === 'preparing';
    else if (statusFilter === 'ready') matchesStatus = order.status === 'ready';
    else if (statusFilter === 'completed') matchesStatus = order.status === 'completed';
    else if (statusFilter === 'cancelled') matchesStatus = order.status === 'cancelled';

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    const res = orderService.updateOrderStatus(orderId, nextStatus, 'Staff');
    if (res.success && selectedOrder?.id === orderId) {
      setSelectedOrder(res.order);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;
    orderService.updateOrderStatus(cancellingOrder.id, 'cancelled', 'Staff', cancelReason);
    setCancellingOrder(null);
    if (selectedOrder?.id === cancellingOrder.id) {
      const updated = orderService.getOrder(cancellingOrder.id);
      setSelectedOrder(updated);
    }
  };

  const handleCopyTrackingLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://loyaltydigitalqr.com';
    const link = `${origin}/order/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const formatElapsed = (createdAt: string) => {
    const diffMin = Math.floor((currentTime - new Date(createdAt).getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            CAFÉ & RESTAURANT ORDER MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Orders Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Accept, prepare, and complete customer orders submitted from table QR standees.
          </p>
        </div>

        <button
          type="button"
          data-testid="open-kds-btn"
          onClick={() => navigate('/dashboard/kitchen')}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Flame className="w-4 h-4 stroke-[2.5]" />
          <span>Launch Kitchen Display (KDS)</span>
        </button>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            NEW AWAITING
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {metrics.newOrders}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            IN PREPARATION
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-amber-600 dark:text-amber-400">
            {metrics.preparingOrders}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            READY TO SERVE
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {metrics.readyOrders}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            COMPLETED TODAY
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {metrics.completedOrders}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            FULFILLED SALES
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {formatMinorUnits(metrics.totalRevenue, business.currency as 'USD' | 'INR')}
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${allOrders.length})` },
            { id: 'new', label: `New (${metrics.newOrders})` },
            { id: 'in_progress', label: `In Progress (${metrics.preparingOrders})` },
            { id: 'ready', label: `Ready (${metrics.readyOrders})` },
            { id: 'completed', label: `Completed (${metrics.completedOrders})` },
            { id: 'cancelled', label: `Cancelled (${metrics.cancelledOrders})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`filter-tab-${tab.id}`}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-[#60646C] dark:text-[#D0CBC1] hover:bg-[#F8F7F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="text"
            data-testid="search-orders"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #1042, Table 01..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#141412] text-[#111318] dark:text-[#F7F3EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
          />
        </div>
      </div>

      {/* 4. Orders Queue List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-subtle-foreground" />
          <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
            No Orders Found
          </h4>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No orders match your search criteria or active status filter.'
              : 'Incoming orders submitted by customers scanning table QR codes will appear here live.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const hasNotes = order.items.some((i) => !!i.specialInstructions);

            return (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className={`p-5 rounded-3xl bg-white dark:bg-[#141412] border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                  order.status === 'new'
                    ? 'border-[#3027F5]/40 dark:border-[#E4C174]/40 ring-1 ring-[#3027F5]/20 dark:ring-[#E4C174]/20'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]'
                }`}
              >
                <div>
                  {/* Top Bar: Order # & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-mono text-subtle-foreground">
                        {formatElapsed(order.createdAt)}
                      </span>
                    </div>

                    <span
                      data-testid={`order-status-${order.id}`}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'new'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : order.status === 'accepted'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : order.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : order.status === 'completed'
                          ? 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status].toUpperCase()}
                    </span>
                  </div>

                  {/* Table Context */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-[#3027F5] dark:text-[#E4C174]">
                      {order.tableName || order.pickupLabel || 'Table Order'}
                    </span>
                    <span className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                      {formatMinorUnits(order.total, order.currency)}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 mb-4 text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="truncate">
                        <span className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {item.quantity}×
                        </span>{' '}
                        <span>{item.name}</span>
                        {item.variants.length > 0 && (
                          <span className="text-[10px] text-subtle-foreground">
                            {' '}
                            ({item.variants.map((v) => v.name).join(', ')})
                          </span>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-[11px] text-subtle-foreground italic">
                        +{order.items.length - 3} more items...
                      </div>
                    )}
                  </div>

                  {hasNotes && (
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 mb-4 truncate flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Special instructions on ticket</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`view-order-${order.id}`}
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] text-xs font-bold text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
                  >
                    View Ticket
                  </button>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'new' && (
                      <>
                        <button
                          type="button"
                          data-testid={`accept-order-${order.id}`}
                          onClick={() => handleUpdateStatus(order.id, 'accepted')}
                          className="px-3 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          data-testid={`cancel-order-${order.id}`}
                          onClick={() => setCancellingOrder(order)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Cancel order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <>
                        <button
                          type="button"
                          data-testid={`prepare-order-${order.id}`}
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Prepare</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Cancel order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <>
                        <button
                          type="button"
                          data-testid={`ready-order-${order.id}`}
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Ready</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Cancel order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {order.status === 'ready' && (
                      <button
                        type="button"
                        data-testid={`complete-order-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Order Detail Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
            aria-hidden="true"
          />

          <div
            data-testid="order-detail-drawer"
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-black text-xl text-[#111318] dark:text-[#F7F3EB]">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      selectedOrder.status === 'ready'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : selectedOrder.status === 'preparing'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[selectedOrder.status].toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                  {selectedOrder.tableName || selectedOrder.pickupLabel} · Placed{' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <button
                type="button"
                data-testid="close-order-detail-btn"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Customer Tracking Link Sharing */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] space-y-2">
                <span className="text-[10px] uppercase text-subtle-foreground font-bold block">
                  CUSTOMER LIVE TRACKING LINK
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`/order/${selectedOrder.trackingToken}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] font-mono text-[11px] text-[#3027F5] dark:text-[#E4C174]"
                  />
                  <button
                    type="button"
                    data-testid="copy-tracking-link-btn"
                    onClick={() => handleCopyTrackingLink(selectedOrder.trackingToken)}
                    className="px-3 py-1.5 rounded-lg bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken === selectedOrder.trackingToken ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`/order/${selectedOrder.trackingToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-subtle-foreground hover:text-[#3027F5] transition-colors"
                    title="Open tracking page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-[#111318] dark:text-[#F7F3EB]">
                  Ticket Items ({selectedOrder.items.length})
                </h4>

                <div className="divide-y divide-[#E5E3DB] dark:divide-white/10">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {item.quantity} × {item.name}
                        </div>
                        {item.variants.length > 0 && (
                          <div className="text-[11px] text-[#60646C] dark:text-[#D0CBC1]">
                            {item.variants.map((v) => `${v.groupName}: ${v.name}`).join(', ')}
                          </div>
                        )}
                        {item.modifiers.length > 0 && (
                          <div className="text-[11px] text-subtle-foreground">
                            + {item.modifiers.map((m) => m.name).join(', ')}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            Note: "{item.specialInstructions}"
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                        {formatMinorUnits(item.lineTotal, selectedOrder.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5E3DB] dark:border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[#60646C] dark:text-[#D0CBC1]">
                    <span>Subtotal</span>
                    <span>{formatMinorUnits(selectedOrder.subtotal, selectedOrder.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] pt-1">
                    <span>Total Due</span>
                    <span>{formatMinorUnits(selectedOrder.total, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="space-y-2">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-[#111318] dark:text-[#F7F3EB]">
                  Status Audit Log
                </h4>
                <div className="space-y-2">
                  {selectedOrder.statusHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {ORDER_STATUS_LABELS[h.status]}
                        </span>
                        <span className="text-subtle-foreground ml-2">by {h.actor}</span>
                        {h.note && <span className="text-subtle-foreground ml-1">({h.note})</span>}
                      </div>
                      <span className="font-mono text-subtle-foreground">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-end gap-2 flex-shrink-0">
              {selectedOrder.status === 'new' && (
                <button
                  type="button"
                  data-testid="detail-accept-btn"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted')}
                  className="px-4 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs cursor-pointer"
                >
                  Accept Order
                </button>
              )}
              {selectedOrder.status === 'accepted' && (
                <button
                  type="button"
                  data-testid="detail-prepare-btn"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs cursor-pointer"
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button
                  type="button"
                  data-testid="detail-ready-btn"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Mark Ready
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                <button
                  type="button"
                  data-testid="detail-complete-btn"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                >
                  Complete Order
                </button>
              )}

              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setCancellingOrder(selectedOrder)}
                  className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 font-bold text-xs cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Cancel Order Confirmation Dialog */}
      {cancellingOrder && (
        <div data-testid="cancellation-modal" className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setCancellingOrder(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-red-200 dark:border-red-900/40 shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                Cancel {cancellingOrder.orderNumber}?
              </h4>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
                This will terminate the ticket and notify the customer tracking screen immediately.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                Cancellation Reason
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-xs text-[#111318] dark:text-[#F7F3EB] focus:outline-none"
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Item or ingredients out of stock">Item or ingredients out of stock</option>
                <option value="Kitchen closing">Kitchen closing</option>
                <option value="Duplicate order submitted">Duplicate order submitted</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                data-testid="confirm-cancel-order-btn"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
