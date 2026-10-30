import React, { useState, useEffect } from 'react';
import {
  Flame,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Check,
  Sun,
  Moon,
  MapPin,
  Loader2,
} from 'lucide-react';
import type { ThemeMode } from '../types';
import type { OrderStatus } from '../types/order';
import { businessService } from '../services/businessService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { useRouter } from '../router';
import { bizStore } from '../lib/bizStore';
import { VerifyEmailScreen } from '../components/auth/VerifyEmailScreen';
import type { Business } from '../types/business';

interface KitchenDisplayPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

const KitchenDisplayBoard: React.FC<KitchenDisplayPageProps & { activeBusiness: Business }> = ({
  activeBusiness,
  theme,
  onThemeToggle,
}) => {
  const { navigate } = useRouter();

  const [activeLocationId, setActiveLocationId] = useState(
    activeBusiness.activeLocationId || activeBusiness.locations[0]?.id || 'loc_main'
  );

  // Live timer for elapsed calculation and clock display
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Reactive subscription to orders
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = orderService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [kdsFilter, setKdsFilter] = useState<'active' | 'preparing' | 'ready' | 'all'>('active');


  const allOrders = orderService.getOrders(activeBusiness.id, activeLocationId);

  // Filter orders according to KDS logic
  const filteredTickets = allOrders.filter((order) => {
    if (kdsFilter === 'active') {
      return order.status === 'new' || order.status === 'accepted' || order.status === 'preparing';
    }
    if (kdsFilter === 'preparing') {
      return order.status === 'preparing';
    }
    if (kdsFilter === 'ready') {
      return order.status === 'ready';
    }
    // 'all' includes completed and cancelled
    return true;
  });

  const activeCount = allOrders.filter(
    (o) => o.status === 'new' || o.status === 'accepted' || o.status === 'preparing'
  ).length;
  const readyCount = allOrders.filter((o) => o.status === 'ready').length;

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    orderService.updateOrderStatus(orderId, nextStatus, 'Kitchen Station');
  };

  const getMinutesAgo = (isoString: string) => {
    return Math.floor((currentTime.getTime() - new Date(isoString).getTime()) / 60000);
  };

  return (
    <div className="min-h-screen bg-[#F0EEE6] dark:bg-[#0A0A0A] text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* 1. KDS Top Bar */}
      <header className="bg-card border-b-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3 flex items-center justify-between gap-3 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-testid="exit-kds-btn"
            onClick={() => navigate('/dashboard')}
            className="px-3.5 py-2 rounded-xl border border-border bg-muted hover:bg-white dark:hover:bg-[#201F1B] text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit KDS</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base text-foreground leading-none">
                  {activeBusiness.name}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  KITCHEN DISPLAY
                </span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-subtle-foreground" />
                {activeBusiness.locations.length > 1 ? (
                  <select
                    value={activeLocationId}
                    onChange={(e) => setActiveLocationId(e.target.value)}
                    aria-label="Select Kitchen Location"
                    className="bg-transparent text-xs text-muted-foreground outline-hidden cursor-pointer"
                  >
                    {activeBusiness.locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1A1916]">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>
                    {activeBusiness.locations.find((l) => l.id === activeLocationId)?.name || 'Main Kitchen'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Filter buttons */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-muted rounded-2xl border border-[#E5E3DB] dark:border-white/10">
          <button
            type="button"
            data-testid="kds-filter-active"
            onClick={() => setKdsFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              kdsFilter === 'active'
                ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            Active Queue ({activeCount})
          </button>
          <button
            type="button"
            data-testid="kds-filter-preparing"
            onClick={() => setKdsFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              kdsFilter === 'preparing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            Preparing Only
          </button>
          <button
            type="button"
            data-testid="kds-filter-ready"
            onClick={() => setKdsFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              kdsFilter === 'ready'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            Ready for Server ({readyCount})
          </button>
          <button
            type="button"
            data-testid="kds-filter-all"
            onClick={() => setKdsFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              kdsFilter === 'all'
                ? 'bg-[#111318] text-white dark:bg-white dark:text-[#111318] shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            All Tickets
          </button>
        </div>

        {/* Right Info: Clock & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono hidden sm:block">
            <span className="text-xs font-bold text-foreground block">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-subtle-foreground">LIVE</span>
          </div>

          <button
            type="button"
            data-testid="kds-theme-toggle"
            onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-muted text-muted-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Ticket Board */}
      <main className="flex-1 p-4 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-subtle-foreground space-y-3">
            <ChefHat className="w-16 h-16 stroke-1" />
            <h3 className="font-heading font-black text-xl text-foreground">
              Kitchen Queue is Clear
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              All tickets fulfilled. New orders submitted by customers scanning table QR codes will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map((ticket) => {
              const minutesAgo = getMinutesAgo(ticket.createdAt);
              const isUrgent = minutesAgo >= 10 && ticket.status !== 'ready' && ticket.status !== 'completed';

              return (
                <div
                  key={ticket.id}
                  data-testid={`kds-ticket-${ticket.id}`}
                  className={`rounded-3xl bg-card border-2 shadow-md flex flex-col justify-between overflow-hidden transition-all ${
                    isUrgent
                      ? 'border-red-400 dark:border-red-800'
                      : ticket.status === 'ready'
                      ? 'border-emerald-500/60 dark:border-emerald-600/60'
                      : ticket.status === 'preparing'
                      ? 'border-amber-400 dark:border-amber-700'
                      : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)]'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 border-b ${
                      ticket.status === 'ready'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                        : ticket.status === 'preparing'
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                        : 'bg-muted border-[#E5E3DB] dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-2xl text-foreground">
                        {ticket.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
                          isUrgent
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-black/10 dark:bg-white/10 text-foreground'
                        }`}
                      >
                        {minutesAgo < 1 ? 'JUST NOW' : `${minutesAgo} MIN AGO`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                        {ticket.tableName || ticket.pickupLabel || 'Table Order'}
                      </span>
                      <span className="text-xs font-bold uppercase text-subtle-foreground">
                        {ticket.items.reduce((acc, i) => acc + i.quantity, 0)} {ticket.items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'ITEM' : 'ITEMS'}
                      </span>
                    </div>
                  </div>

                  {/* Items & Modifiers List */}
                  <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-black text-sm bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-foreground">
                            {item.quantity}×
                          </span>
                          <span className="font-heading font-black text-sm text-foreground leading-snug">
                            {item.name}
                          </span>
                        </div>

                        {item.variants.length > 0 && (
                          <div className="pl-8 text-xs font-bold text-[#3027F5] dark:text-[#E4C174]">
                            {item.variants.map((v) => `${v.name}`).join(', ')}
                          </div>
                        )}

                        {item.modifiers.length > 0 && (
                          <div className="pl-8 text-xs text-muted-foreground">
                            {item.modifiers.map((m) => `• ${m.name}`).join(' ')}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <div className="ml-8 mt-1 p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-900 dark:text-amber-200">
                            NOTE: {item.specialInstructions.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ticket Bottom Actions */}
                  <div className="p-3 border-t border-[#E5E3DB] dark:border-white/10 bg-muted flex items-center justify-between gap-2">
                    {ticket.status === 'new' && (
                      <button
                        type="button"
                        data-testid={`kds-accept-btn-${ticket.id}`}
                        onClick={() => handleUpdateStatus(ticket.id, 'accepted')}
                        className="w-full py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Accept Ticket
                      </button>
                    )}

                    {ticket.status === 'accepted' && (
                      <button
                        type="button"
                        data-testid={`kds-prepare-btn-${ticket.id}`}
                        onClick={() => handleUpdateStatus(ticket.id, 'preparing')}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {ticket.status === 'preparing' && (
                      <button
                        type="button"
                        data-testid={`kds-ready-btn-${ticket.id}`}
                        onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {ticket.status === 'ready' && (
                      <button
                        type="button"
                        data-testid={`kds-complete-btn-${ticket.id}`}
                        onClick={() => handleUpdateStatus(ticket.id, 'completed')}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Fulfill & Complete</span>
                      </button>
                    )}

                    {(ticket.status === 'completed' || ticket.status === 'cancelled') && (
                      <div className="w-full text-center py-2 text-xs font-bold text-subtle-foreground">
                        Ticket {ticket.status.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

/** Auth + business gate for the fullscreen KDS (same rules as the dashboard). */
export const KitchenDisplayPage: React.FC<KitchenDisplayPageProps> = (props) => {
  const { navigate } = useRouter();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const unsubBiz = businessService.subscribe(bump);
    const unsubAuth = authService.subscribe(bump);
    return () => {
      unsubBiz();
      unsubAuth();
    };
  }, []);

  const user = authService.getCurrentUser();
  const loadState = businessService.getLoadState();
  const active = businessService.getActiveBusiness();

  useEffect(() => {
    if (!user) navigate('/login?redirect=/dashboard/kitchen', { replace: true });
    else if (loadState === 'ready' && !active) navigate('/dashboard', { replace: true });
  }, [user, loadState, active, navigate]);

  if (user && !user.emailVerified) return <VerifyEmailScreen />;

  const message = !user
    ? 'Redirecting to sign in…'
    : loadState === 'error'
      ? businessService.getLoadError() || 'Could not load your workspace.'
      : !active || !bizStore.isReady(active.id)
        ? 'Loading kitchen orders…'
        : null;

  if (message || !active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#3027F5] dark:text-[#E4C174]" />
          <h2 className="text-xl font-heading font-black">{message}</h2>
        </div>
      </div>
    );
  }

  return <KitchenDisplayBoard key={active.id} {...props} activeBusiness={active} />;
};
