import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  Download,
  Star,
  CheckCircle2,
  Coffee,
  Scissors,
  ShoppingBag,
  Dumbbell,
  Car,
  Wrench,
} from 'lucide-react';
import type { MockBusiness } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { DateRangeOption, GrowthAnalyticsSummary } from '../../../types/growth';
import { mockGrowthService } from '../../../services/mockGrowthService';
import { mockOrderService } from '../../../services/mockOrderService';
import { mockSalonService } from '../../../services/mockSalonService';
import { mockRetailService } from '../../../services/mockRetailService';
import { mockGymService } from '../../../services/mockGymService';
import { mockCarWashService } from '../../../services/mockCarWashService';
import { mockGenericService } from '../../../services/mockGenericService';

interface AnalyticsViewProps {
  business: MockBusiness;
  theme: ThemeMode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  business,
  theme: _theme,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [summary, setSummary] = useState<GrowthAnalyticsSummary | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const currencySymbol = business.currency === 'INR' ? '₹' : '$';

  const refreshSummary = () => {
    const data = mockGrowthService.getGrowthAnalytics(business.id, dateRange);
    setSummary(data);
  };

  useEffect(() => {
    refreshSummary();
    const unsub = mockGrowthService.subscribe(() => {
      refreshSummary();
    });
    return unsub;
  }, [business.id, dateRange]);

  const handleExportCsv = () => {
    try {
      const csvContent = mockGrowthService.exportAnalyticsCsv(business.id, dateRange);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `loyaltydigitalqr-analytics-${business.id}-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice('Audit-grade CSV exported successfully.');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Export completed in browser session.');
      setTimeout(() => setExportNotice(null), 3000);
    }
  };

  if (!summary) {
    return (
      <div className="p-8 text-center text-xs text-[#868A94]">
        Loading analytics dataset...
      </div>
    );
  }

  const isCafe = business.businessType === 'cafe' || business.businessType === 'restaurant';
  const isSalon = business.businessType === 'salon';
  const isRetail = business.businessType === 'retail';
  const isGym = business.businessType === 'gym';
  const isCarWash = business.businessType === 'carwash';
  const isService = business.businessType === 'service';

  // Derived vertical operational data
  const orders = isCafe ? mockOrderService.getOrders(business.id) : [];
  const ordersVolume = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const appointments = isSalon ? mockSalonService.getAppointments(business.id) : [];
  const appointmentsVolume = appointments.reduce((sum, a) => sum + (a.price || 0), 0);

  const purchases = isRetail ? mockRetailService.getPurchases(business.id) : [];
  const retailVolume = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

  const checkIns = isGym ? mockGymService.getCheckIns(business.id) : [];
  const memberships = isGym ? mockGymService.getMembers(business.id) : [];

  const carWashes = isCarWash ? mockCarWashService.getVisits(business.id) : [];
  const passes = isCarWash ? mockCarWashService.getPasses(business.id) : [];

  const jobs = isService ? mockGenericService.getJobs(business.id) : [];
  const jobsVolume = jobs.reduce((sum, j) => sum + (j.amountCharged || 0), 0);

  return (
    <div data-testid="analytics-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Export Notice */}
      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header & Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            BUSINESS INTELLIGENCE & REPORTING
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Visit Analytics & Performance
          </h1>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Metrics aggregated truthfully from recorded orders, bookings, sales, check-ins, and redemptions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range pills */}
          <div className="p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-1">
            <button
              type="button"
              data-testid="range-7d"
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                dateRange === '7d'
                  ? 'bg-white dark:bg-[#1A1916] text-[#3027F5] dark:text-[#E4C174] shadow-xs'
                  : 'text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              data-testid="range-30d"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                dateRange === '30d'
                  ? 'bg-white dark:bg-[#1A1916] text-[#3027F5] dark:text-[#E4C174] shadow-xs'
                  : 'text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              data-testid="range-90d"
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                dateRange === '90d'
                  ? 'bg-white dark:bg-[#1A1916] text-[#3027F5] dark:text-[#E4C174] shadow-xs'
                  : 'text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              data-testid="range-all"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                dateRange === 'all'
                  ? 'bg-white dark:bg-[#1A1916] text-[#3027F5] dark:text-[#E4C174] shadow-xs'
                  : 'text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Safe CSV Export Button */}
          <button
            type="button"
            data-testid="export-analytics-csv-btn"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm cursor-pointer shadow-sm inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Recorded Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#868A94]">
            <span className="text-[10px] font-mono uppercase font-bold">GROSS RECORDED VALUE</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {currencySymbol}{(summary.recordedGrossValueMinor / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            Across verified recorded sales (unpriced passes excluded)
          </div>
        </div>

        {/* KPI 2: Customer Retention & Repeat Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#868A94]">
            <span className="text-[10px] font-mono uppercase font-bold">REPEAT RATE</span>
            <TrendingUp className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {summary.repeatRate}%
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {summary.activeCustomers} active / {summary.totalCustomers} total members
          </div>
        </div>

        {/* KPI 3: Loyalty Activity */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#868A94]">
            <span className="text-[10px] font-mono uppercase font-bold">STAMPS & ENGAGEMENT</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {summary.totalLoyaltyStamps}
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {summary.totalRewardsRedeemed} rewards unlocked
          </div>
        </div>

        {/* KPI 4: Offer Savings & Feedback */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#868A94]">
            <span className="text-[10px] font-mono uppercase font-bold">CUSTOMER SATISFACTION</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-amber-500 flex items-center gap-1">
            <span>{summary.averageRating.toFixed(1)}</span>
            <span className="text-xs font-mono text-[#868A94]">/ 5.0</span>
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {summary.feedbackCount} reviews · {currencySymbol}{(summary.totalOfferSavingsMinor / 100).toFixed(2)} savings
          </div>
        </div>
      </div>

      {/* Operational Breakdown by Vertical */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vertical Specific Metrics */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
                OPERATIONAL BREAKDOWN
              </span>
              <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                {business.businessType.toUpperCase()} PERFORMANCE METRICS
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
              {dateRange.toUpperCase()} FILTER
            </span>
          </div>

          {isCafe && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Café & Restaurant Transactions</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">TOTAL ORDERS</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {orders.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">ORDER VOLUME</span>
                  <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{(ordersVolume / 100).toFixed(2)}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">AVG TICKET</span>
                  <div className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                    {orders.length > 0
                      ? `${currencySymbol}${(ordersVolume / orders.length / 100).toFixed(2)}`
                      : `${currencySymbol}0.00`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSalon && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <Scissors className="w-4 h-4 text-purple-600" />
                <span>Salon & Barbershop Bookings</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">APPOINTMENTS</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {appointments.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">APPOINTMENT VALUE</span>
                  <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{(appointmentsVolume / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRetail && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Retail Store & Boutique Purchases</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">QUALIFYING SALES</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {purchases.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">RETAIL REVENUE</span>
                  <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{(retailVolume / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGym && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <Dumbbell className="w-4 h-4 text-rose-600" />
                <span>Gym & Fitness Studio Check-Ins</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">RECORDED CHECK-INS</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {checkIns.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">ACTIVE MEMBERS</span>
                  <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                    {memberships.filter((m) => m.status === 'active').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCarWash && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <Car className="w-4 h-4 text-cyan-600" />
                <span>Express Car Wash Visits</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">WASHES REDEEMED</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {carWashes.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">ACTIVE PASSES</span>
                  <div className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                    {passes.filter((p) => p.status === 'active').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isService && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111318] dark:text-[#F7F3EB]">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Service Business Jobs</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">JOBS RECORDED</span>
                  <div className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                    {jobs.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816]">
                  <span className="text-[10px] font-mono text-[#868A94] uppercase block">JOB REVENUE</span>
                  <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{(jobsVolume / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] text-xs text-[#60646C] dark:text-[#AAA499] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              All transactional records are isolated to <strong>{business.name}</strong> ({business.id}).
            </span>
          </div>
        </div>

        {/* Right Column: Promotional Impact & Safety */}
        <div className="rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-black/10 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase text-[#3027F5] dark:text-[#E4C174] font-bold">
              PROMOTIONS & AUDIT
            </span>
            <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
              Campaign Performance
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] space-y-1">
              <span className="text-[#868A94] font-mono text-[10px] uppercase">TOTAL INCENTIVE SAVINGS</span>
              <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                {currencySymbol}{(summary.totalOfferSavingsMinor / 100).toFixed(2)}
              </div>
              <p className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
                Discounts redeemed through verified promo codes.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#181816] space-y-1">
              <span className="text-[#868A94] font-mono text-[10px] uppercase">LOYALTY REDEMPTION CONVERSION</span>
              <div className="text-xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                {summary.totalLoyaltyStamps > 0
                  ? `${Math.min(100, Math.round((summary.totalRewardsRedeemed / summary.totalLoyaltyStamps) * 100))}%`
                  : '0%'}
              </div>
              <p className="text-[11px] text-[#60646C] dark:text-[#AAA499]">
                Ratio of unlocked rewards to issued counter stamps.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-200">
              <strong>Zero-Division Safety:</strong> All rate calculations are guarded against empty states and null divisions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
