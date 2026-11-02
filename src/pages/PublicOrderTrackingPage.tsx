import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  Sun,
  Moon,
  Bell,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { useRouter } from '../router';
import { orderService } from '../services/orderService';
import { businessService } from '../services/businessService';
import { SocialLinksBar } from '../components/public/SocialLinksBar';
import { formatMinorUnits } from '../types/cafe';
import type { ThemeMode } from '../types';
import type { OrderStatus } from '../types/order';

interface PublicOrderTrackingPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

const STAGES: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'new', label: 'Received', desc: 'Order sent to restaurant queue' },
  { status: 'accepted', label: 'Accepted', desc: 'Confirmed by kitchen station' },
  { status: 'preparing', label: 'Preparing', desc: 'Crafting fresh drinks & dishes' },
  { status: 'ready', label: 'Ready', desc: 'Ready for table delivery or pickup' },
  { status: 'completed', label: 'Completed', desc: 'Order delivered & fulfilled' },
];

export const PublicOrderTrackingPage: React.FC<PublicOrderTrackingPageProps> = ({
  theme,
  onThemeToggle,
}) => {
  const { currentPath, navigate } = useRouter();

  // Extract tracking token or ID from /order/:token
  const token = currentPath.replace(/^\/order\/?/, '').split('/')[0] || '';

  // Reactive subscription to live order updates
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = orderService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const order = orderService.getOrderByTrackingToken(token);
  const business = order ? businessService.getBusinessById(order.businessId) : undefined;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#1C1C1C] text-foreground">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-foreground">
            Order Not Found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We couldn't locate an order matching tracking code "<strong>{token}</strong>". The link may have expired or was typed incorrectly.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';

  // Determine stage index
  const stageOrder: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready', 'completed'];
  const currentStageIndex = stageOrder.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-foreground pb-16 transition-colors duration-200">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141412]/95 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="back-to-menu-btn"
            onClick={() => navigate(`/menu/${order.businessSlug}${order.tableId ? `?table=${order.tableId}` : ''}`)}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              LIVE TRACKER
            </span>
            <span
              data-testid="tracking-order-number"
              className="font-heading font-black text-sm text-foreground"
            >
              {order.orderNumber}
            </span>
          </div>

          <button
            type="button"
            data-testid="theme-toggle-tracking"
            onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Order Status Card */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Business & Destination Banner */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-heading font-black text-foreground">
                  {order.businessName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-subtle-foreground" />
                <span>{order.locationName}</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174] text-xs font-bold text-center">
              {order.tableName || order.pickupLabel || 'Table Order'}
            </div>
          </div>

          {/* Cancelled Banner if cancelled */}
          {isCancelled ? (
            <div
              data-testid="order-cancelled-banner"
              className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 space-y-1"
            >
              <div className="flex items-center gap-2 font-heading font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Reason: {order.cancellationReason || 'Order was cancelled by restaurant staff.'}
              </p>
            </div>
          ) : (
            /* Active Progress Timeline */
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span
                    data-testid="tracking-status-badge"
                    className="font-heading font-black text-base text-foreground"
                  >
                    {order.status === 'new' && 'Order Placed & Queued'}
                    {order.status === 'accepted' && 'Order Accepted by Kitchen'}
                    {order.status === 'preparing' && 'Kitchen is Preparing Your Order'}
                    {order.status === 'ready' && 'Order Ready for Pickup!'}
                    {order.status === 'completed' && 'Order Fulfilled & Completed'}
                  </span>
                </div>

                {!isCompleted && order.estimatedWaitMinutes && (
                  <span className="text-xs text-subtle-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{order.estimatedWaitMinutes}m</span>
                  </span>
                )}
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {STAGES.map((stg, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={stg.status} className="space-y-1.5 text-center">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isDone
                            ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                            : 'bg-[#E5E3DB] dark:bg-[#201F1B]'
                        } ${isCurrent ? 'ring-2 ring-[#3027F5]/30 dark:ring-[#E4C174]/40' : ''}`}
                      />
                      <span
                        className={`text-xs font-bold block truncate ${
                          isCurrent
                            ? 'text-[#3027F5] dark:text-[#E4C174]'
                            : isDone
                            ? 'text-foreground'
                            : 'text-subtle-foreground'
                        }`} > {stg.label} </span> </div> ); })} </div> </div> )} </div> {/* 3. Items & Receipt Breakdown */} <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4"> <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10"> <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wider"> Ordered Items ({order.items.length}) </h3> <span className="text-xs text-subtle-foreground"> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} </span> </div> <div className="space-y-3"> {order.items.map((item, idx) => ( <div key={idx} data-testid={`tracking-item-${idx}`}
                className="flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">
                    {item.quantity} × {item.name}
                  </div>
                  {item.variants.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {item.variants.map((v) => `${v.groupName}: ${v.name}`).join(', ')}
                    </div>
                  )}
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-subtle-foreground">
                      + {item.modifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 italic">
                      Note: "{item.specialInstructions}"
                    </div>
                  )}
                </div>

                <span className="font-mono font-bold text-foreground whitespace-nowrap">
                  {formatMinorUnits(item.lineTotal, order.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMinorUnits(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-subtle-foreground text-xs">
              <span>Payment Mode</span>
              <span>Pay at Counter</span>
            </div>
            <div className="flex items-center justify-between font-heading font-black text-base text-foreground pt-2 border-t border-[#E5E3DB] dark:border-white/10">
              <span>Total</span>
              <span data-testid="tracking-order-total">{formatMinorUnits(order.total, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* 4. Live Updates Info Pill */}
        <div className="p-4 rounded-2xl bg-muted border border-border flex items-center gap-3 text-xs text-muted-foreground">
          <Bell className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
          <span>
            This tracking page updates automatically in real time as the kitchen prepares your order.
          </span>
        </div>

        {/* 5. Review & follow buttons (only when the business has set them up) */}
        {business && <SocialLinksBar business={business} title="Enjoyed your order? Rate us & follow" />}
      </main>
    </div>
  );
};
