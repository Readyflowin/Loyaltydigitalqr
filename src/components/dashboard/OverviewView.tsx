import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  QrCode,
  Smartphone,
  Clock,
  Store,
  ChevronRight,
  Flame,
  Calendar,
  Car,
  Wrench,
  ExternalLink,
  UserCheck,
  Tag,
  Star,
} from 'lucide-react';
import type { Business, BusinessMetrics, BusinessActivity, ChecklistItem } from '../../types/business';
import type { ThemeMode } from '../../types';
import { orderService } from '../../services/orderService';
import { salonService } from '../../services/salonService';
import { retailService } from '../../services/retailService';
import { gymService } from '../../services/gymService';
import { carWashService } from '../../services/carWashService';
import { genericService } from '../../services/genericService';
import { growthService } from '../../services/growthService';
import { loyaltyService } from '../../services/loyaltyService';
import { StatCard } from '../ui';

interface OverviewViewProps {
  business: Business;
  metrics: BusinessMetrics;
  activities: BusinessActivity[];
  checklist: ChecklistItem[];
  onNavigate: (viewId: string) => void;
  onOpenCardPreview: () => void;
  theme: ThemeMode;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  business,
  metrics,
  activities,
  checklist,
  onNavigate,
  onOpenCardPreview,
  theme: _theme,
}) => {
  const isFoodService = business.businessType === 'cafe' || business.businessType === 'restaurant';
  const isSalon = business.businessType === 'salon';
  const isRetail = business.businessType === 'retail';
  const isGym = business.businessType === 'gym';
  const isCarWash = business.businessType === 'carwash';
  const isService = business.businessType === 'service';

  const currencySymbol = business.currency === 'INR' ? '₹' : '$';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsubOrders = orderService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubSalon = salonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubRetail = retailService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubGym = gymService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubCarWash = carWashService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubGeneric = genericService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    const unsubGrowth = growthService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return () => {
      unsubOrders();
      unsubSalon();
      unsubRetail();
      unsubGym();
      unsubCarWash();
      unsubGeneric();
      unsubGrowth();
    };
  }, []);

  const orderMetrics = orderService.getOrderMetrics(business.id);
  const salonMetrics = salonService.getSalonMetrics(business.id);
  const retailMetrics = retailService.getRetailMetrics(business.id);
  const gymMetrics = gymService.getGymMetrics(business.id);
  const carwashMetrics = carWashService.getCarWashMetrics(business.id);
  const genericMetrics = genericService.getMetrics(business.id);

  const growthOffers = growthService.getOffers(business.id);
  const activeOffersCount = growthOffers.filter((o) => o.status === 'active').length;
  const growthFeedback = growthService.getCustomerFeedback(business.id);
  const avgGrowthRating =
    growthFeedback.length > 0
      ? (growthFeedback.reduce((acc, f) => acc + f.rating, 0) / growthFeedback.length).toFixed(1)
      : '—';
  const growthSummary = growthService.getAnalyticsSummary(business.id, 'all');

  const activeLocation =
    business.locations.find((l) => l.id === business.activeLocationId) || business.locations[0];

  const nowMs = Date.now();
  const joinedThisWeek = loyaltyService
    .getCustomers(business.id)
    .filter((c) => nowMs - new Date(c.enrolledAt).getTime() < 7 * 86400000).length;
  const trialDaysLeft = business.trialEndsAt
    ? Math.ceil((new Date(business.trialEndsAt).getTime() - nowMs) / 86400000)
    : 0;

  const completedCount = checklist.filter((c) => c.isDone).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* 1. Welcome Banner */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#2D2D2D] text-xs font-bold text-[#3027F5] dark:text-[#E4C174] uppercase">
              {business.businessType.toUpperCase()} WORKSPACE
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-xs font-mono font-medium text-muted-foreground">
              {business.planPrice} · {business.region === 'india' ? 'India Region' : 'US Region'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              {trialDaysLeft > 0 ? `Free trial · ${trialDaysLeft}d left` : 'Trial ended'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Welcome to {business.name}
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Active location: <strong className="text-foreground">{activeLocation.name}</strong> · Staff PINs are in Settings
          </p>
        </div>

        {/* Quick pass preview trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCardPreview}
            className="px-4 py-2.5 rounded-xl border-2 border-[#3027F5] dark:border-[#E4C174] text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:bg-[#3027F5]/5 dark:hover:bg-[#E4C174]/10 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Smartphone className="w-4 h-4" />
            <span>Preview Card Pass</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total customers"
          value={metrics.totalCustomers}
          meta={`${joinedThisWeek} joined in the last 7 days`}
          icon={<Users />}
        />
        <StatCard
          label="Loyalty visits"
          value={metrics.loyaltyVisits}
          meta="Stamps issued at your counter"
          icon={<QrCode />}
        />
        <StatCard
          label="Rewards redeemed"
          value={metrics.rewardsRedeemed}
          meta="Vouchers used at the counter"
          icon={<Award />}
        />
        <StatCard
          label="Repeat rate"
          value={`${metrics.repeatRate}%`}
          meta="2+ recorded counter visits"
          icon={<TrendingUp />}
        />
      </div>

      {/* Restaurant Live Order Operations (Café & Restaurant workspaces only) */}
      {isFoodService && (
        <div
          data-testid="restaurant-operations-card"
          className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                LIVE ORDER OPERATIONS
              </span>
              <h3 className="font-heading font-black text-lg text-foreground mt-0.5">
                Kitchen & Table Queue
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="overview-view-orders-btn"
                onClick={() => onNavigate('orders')}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer"
              >
                View Orders Queue
              </button>
              <button
                type="button"
                data-testid="overview-view-kds-btn"
                onClick={() => onNavigate('kitchen')}
                className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Kitchen Display</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                NEW AWAITING
              </span>
              <div className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                {orderMetrics.newOrders}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                IN PREPARATION
              </span>
              <div className="text-xl font-heading font-black text-amber-600 dark:text-amber-400">
                {orderMetrics.preparingOrders}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                READY TO SERVE
              </span>
              <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                {orderMetrics.readyOrders}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                COMPLETED TODAY
              </span>
              <div className="text-xl font-heading font-black text-foreground">
                {orderMetrics.completedOrders}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon Live Operations (Salon & Barbershop workspaces only) */}
      {isSalon && (
        <div
          data-testid="salon-operations-card"
          className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                SALON & STYLIST OPERATIONS
              </span>
              <h3 className="font-heading font-black text-lg text-foreground mt-0.5">
                Appointments & Chairs Overview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="overview-view-appointments-btn"
                onClick={() => onNavigate('appointments')}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer"
              >
                View Appointments
              </button>
              <button
                type="button"
                data-testid="overview-view-calendar-btn"
                onClick={() => onNavigate('calendar')}
                className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Chairs Calendar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                TODAY'S APPOINTMENTS
              </span>
              <div data-testid="salon-metric-today" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                {salonMetrics.totalAppointmentsToday}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                AWAITING CONFIRMATION
              </span>
              <div data-testid="salon-metric-awaiting" className="text-xl font-heading font-black text-amber-600 dark:text-amber-400">
                {salonMetrics.awaitingConfirmation}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                UPCOMING THIS WEEK
              </span>
              <div data-testid="salon-metric-week" className="text-xl font-heading font-black text-blue-600 dark:text-blue-400">
                {salonMetrics.upcomingThisWeek}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                COMPLETED TODAY
              </span>
              <div data-testid="salon-metric-completed" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                {salonMetrics.completedToday}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted border border-border">
              <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5">
                CANCELLED / NO-SHOW
              </span>
              <div data-testid="salon-metric-cancelled" className="text-xl font-heading font-black text-muted-foreground">
                {salonMetrics.cancelledOrNoShowToday}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retail Operations Card (Retail workspaces only) */}
      {isRetail && (
        <div
          data-testid="retail-operations-card"
          className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                RETAIL & STOREFRONT OPERATIONS
              </span>
              <h3 className="font-heading font-black text-lg text-foreground mt-0.5">
                Product Catalogue & Sales Overview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="overview-view-catalogue-btn"
                onClick={() => onNavigate('catalogue')}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer"
              >
                View Catalogue
              </button>
              <a
                href={`/catalog/${business.slug}`} target="_blank" rel="noreferrer" data-testid="overview-preview-catalog-btn" className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5" > <ExternalLink className="w-3.5 h-3.5" /> <span>Public Lookbook</span> </a> </div> </div> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> ACTIVE PRODUCTS </span> <div data-testid="retail-metric-products" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]"> {retailMetrics.activeProducts} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> IN-STOCK & AVAILABLE </span> <div data-testid="retail-metric-active" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {retailMetrics.availableProducts} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> SALES RECORDED </span> <div data-testid="retail-metric-sales" className="text-xl font-heading font-black text-foreground"> {retailMetrics.qualifyingPurchases} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> GROSS REVENUE </span> <div data-testid="retail-metric-revenue" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {currencySymbol}{(retailMetrics.totalRevenueMinor / 100).toFixed(2)} </div> </div> </div> </div> )} {/* Gym Operations Card (Gym & Fitness workspaces only) */} {isGym && ( <div data-testid="gym-operations-card" className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4" > <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10"> <div> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block"> GYM & FITNESS OPERATIONS </span> <h3 className="font-heading font-black text-lg text-foreground mt-0.5"> Memberships & Studio Capacity Overview </h3> </div> <div className="flex items-center gap-2"> <button type="button" data-testid="overview-view-members-btn" onClick={() => onNavigate('members')} className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer" > Members Roster </button> <button type="button" data-testid="overview-view-checkin-btn" onClick={() => onNavigate('visit-tracking')} className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5" > <UserCheck className="w-3.5 h-3.5" /> <span>Visit Terminal</span> </button> </div> </div> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> ACTIVE MEMBERS </span> <div data-testid="gym-metric-members" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]"> {gymMetrics.activeMemberships} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> VISITS TODAY </span> <div data-testid="gym-metric-visits" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {gymMetrics.visitsToday} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> EXPIRING IN 7 DAYS </span> <div data-testid="gym-metric-expiring" className="text-xl font-heading font-black text-amber-600 dark:text-amber-400"> {gymMetrics.expiringMemberships} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> CLASS OCCUPANCY </span> <div data-testid="gym-metric-occupancy" className="text-xl font-heading font-black text-blue-600 dark:text-blue-400"> {gymMetrics.classOccupancyPercent}% </div> </div> </div> </div> )} {/* Car Wash Operations Card (Car Wash workspaces only) */} {isCarWash && ( <div data-testid="carwash-operations-card" className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4" > <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10"> <div> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block"> CAR WASH & TUNNEL OPERATIONS </span> <h3 className="font-heading font-black text-lg text-foreground mt-0.5"> Passes & Tunnel Bay Activity </h3> </div> <div className="flex items-center gap-2"> <button type="button" data-testid="overview-view-wash-bundles-btn" onClick={() => onNavigate('wash-bundles')} className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer" > Wash Passes </button> <button type="button" data-testid="overview-view-wash-terminal-btn" onClick={() => onNavigate('wash-visits')} className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5" > <Car className="w-3.5 h-3.5" /> <span>Tunnel Check-In</span> </button> </div> </div> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> ACTIVE VEHICLE PASSES </span> <div data-testid="carwash-metric-passes" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]"> {carwashMetrics.activePasses} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> WASHES TODAY </span> <div data-testid="carwash-metric-washes" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {carwashMetrics.washesToday} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> EXPIRING PASSES </span> <div data-testid="carwash-metric-expiring" className="text-xl font-heading font-black text-amber-600 dark:text-amber-400"> {carwashMetrics.expiringPasses} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> TOP TIER </span> <div data-testid="carwash-metric-tier" className="text-sm font-heading font-bold text-foreground truncate mt-1"> {carwashMetrics.popularTier} </div> </div> </div> </div> )} {/* Service Business Operations Card (Generic Service workspaces only) */} {isService && ( <div data-testid="service-operations-card" className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4" > <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10"> <div> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block"> SERVICE BUSINESS OPERATIONS </span> <h3 className="font-heading font-black text-lg text-foreground mt-0.5"> Offerings & Job Queue Overview </h3> </div> <div className="flex items-center gap-2"> <button type="button" data-testid="overview-view-services-btn" onClick={() => onNavigate('service-catalogue')} className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer" > Service Offerings </button> <button type="button" data-testid="overview-view-jobs-btn" onClick={() => onNavigate('service-visits')} className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5" > <Wrench className="w-3.5 h-3.5" /> <span>Job Terminal</span> </button> </div> </div> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> ACTIVE OFFERINGS </span> <div data-testid="service-metric-offerings" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]"> {genericMetrics.totalServices} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> JOBS TODAY </span> <div data-testid="service-metric-completed" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {genericMetrics.jobsCompletedToday} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> IN PROGRESS </span> <div data-testid="service-metric-active" className="text-xl font-heading font-black text-amber-600 dark:text-amber-400"> {genericMetrics.activeJobsCount} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> SERVICE REVENUE </span> <div data-testid="service-metric-revenue" className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {currencySymbol}{(genericMetrics.totalServiceRevenueCents / 100).toFixed(2)} </div> </div> </div> </div> )} {/* Growth & Retention Highlight Card */} <div data-testid="growth-overview-card" className="rounded-3xl bg-card border-2 border-[#3027F5]/20 dark:border-[rgba(228,193,116,0.3)] p-6 sm:p-7 shadow-xs space-y-4" > <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10"> <div> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block"> GROWTH & CUSTOMER RETENTION </span> <h3 className="font-heading font-black text-lg text-foreground mt-0.5"> Promotions, Win-Backs & Reputation </h3> </div> <div className="flex items-center gap-2"> <button type="button" data-testid="overview-view-offers-btn" onClick={() => onNavigate('offers')} className="px-3.5 py-1.5 rounded-xl border border-border bg-muted text-xs font-bold text-foreground hover:bg-white dark:hover:bg-[#201F1B] transition-colors cursor-pointer flex items-center gap-1.5" > <Tag className="w-3.5 h-3.5" /> <span>Offers & Win-Back</span> </button> <button type="button" data-testid="overview-view-analytics-btn" onClick={() => onNavigate('analytics')} className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5" > <TrendingUp className="w-3.5 h-3.5" /> <span>Detailed Analytics</span> </button> </div> </div> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> ACTIVE OFFERS </span> <div data-testid="overview-active-offers-metric" className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]"> {activeOffersCount} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> FIXED-DISCOUNT SAVINGS </span> <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400"> {currencySymbol}{(growthSummary.totalOfferSavingsMinor / 100).toFixed(2)} </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> CUSTOMER SATISFACTION </span> <div className="text-xl font-heading font-black text-amber-500 flex items-center gap-1"> <span>{avgGrowthRating}</span> <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> </div> </div> <div className="p-3.5 rounded-2xl bg-muted border border-border"> <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5"> REPEAT RATE </span> <div className="text-xl font-heading font-black text-foreground"> {growthSummary.repeatRate}% </div> </div> </div> </div> {/* 3. Getting Started Checklist & Program Showcase */} <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"> {/* Checklist (~7 cols) */} <div className="lg:col-span-7 rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-xs"> <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10"> <div> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block"> ACTIVATION CHECKLIST </span> <h3 className="font-heading font-black text-lg text-foreground mt-0.5"> Counter Setup Progress ({completedCount}/{checklist.length}) </h3> </div> <span className="text-sm font-bold text-[#3027F5] dark:text-[#E4C174]"> {progressPercent}% Done </span> </div> <div className="mt-5 space-y-3"> {checklist.map((item) => ( <div key={item.id} onClick={() => onNavigate(item.targetView)} className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  item.isDone
                    ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-[#F8F7F2] dark:bg-[#161614] hover:border-[#3027F5]/40 dark:hover:border-[#E4C174]/40'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-subtle-foreground" />
                  )}
                </div>

                <div className="flex-1 truncate">
                  <div className="font-heading font-bold text-xs sm:text-sm text-foreground truncate">
                    {item.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-subtle-foreground self-center flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Program Overview & Quick Actions (~5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Loyalty Program Snapshot */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs">
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block mb-1">
              ACTIVE PROGRAM
            </span>
            <h4 className="font-heading font-black text-base text-foreground">
              {business.programName}
            </h4>

            <div
              className="mt-3 p-3.5 rounded-2xl border border-black/5 dark:border-white/5"
              style={{ backgroundColor: `${business.accentColor}12` }}
            >
              <span
                className="text-xs uppercase font-bold tracking-wider block"
                style={{ color: business.accentColor }}
              >
                MILESTONE: {business.stampsRequired} STAMPS
              </span>
              <p className="font-heading font-bold text-xs sm:text-sm text-foreground mt-0.5">
                {business.rewardDescription}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Staff PIN: <strong className="font-mono">{activeLocation.staffPin}</strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('loyalty')}
                className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
              >
                Edit Program →
              </button>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-2">
            <span className="text-xs font-bold tracking-widest text-subtle-foreground dark:text-[#AAA499] uppercase block mb-2">
              WORKSPACE SHORTCUTS
            </span>

            <button
              type="button"
              onClick={() => onNavigate('qr-studio')}
              className="w-full p-2.5 rounded-xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] flex items-center justify-between text-xs font-bold text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
                <span>Open Counter QR Studio</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-subtle-foreground" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="w-full p-2.5 rounded-xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] flex items-center justify-between text-xs font-bold text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
                <span>View Customer CRM</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-subtle-foreground" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="w-full p-2.5 rounded-xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] flex items-center justify-between text-xs font-bold text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
                <span>Counter & Staff PIN Settings</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-subtle-foreground" />
            </button>
          </div>

        </div>

      </div>

      {/* 4. Activity Feed */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-xs font-bold tracking-widest text-subtle-foreground dark:text-[#AAA499] uppercase block">
              LIVE ACTIVITY LOG
            </span>
            <h3 className="font-heading font-black text-lg text-foreground mt-0.5">
              Recent Customer Visits & Stamping
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Latest 6 events
          </span>
        </div>

        <div className="mt-5 space-y-3.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#161614] border border-border flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-subtle-foreground" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-bold text-xs sm:text-sm text-foreground">
                      {act.title}
                    </span>
                    {act.badge && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-subtle-foreground flex-shrink-0">
                {act.timeAgo}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
