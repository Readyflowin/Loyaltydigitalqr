import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { CustomerRecord, LoyaltyProgramConfig } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CustomerEditModal } from './CustomerEditModal';
import { StampIssuanceModal } from '../loyalty/StampIssuanceModal';
import { RewardRedemptionModal } from './RewardRedemptionModal';

interface CustomerCrmViewProps {
  business: Business;
  theme: ThemeMode;
  onNavigateToLoyalty?: () => void;
  onNavigateToQR?: () => void;
}

export const CustomerCrmView: React.FC<CustomerCrmViewProps> = ({
  business,
  theme: _theme,
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    return loyaltyService.getCustomers(business.id);
  });

  const [program, setProgram] = useState<LoyaltyProgramConfig>(() => {
    return loyaltyService.getProgram(business.id);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reward_ready' | 'in_progress' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'last_visit' | 'name' | 'visits'>('last_visit');

  // Modals
  const [profileCustomerId, setProfileCustomerId] = useState<string | null>(null);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [stampingCustomer, setStampingCustomer] = useState<CustomerRecord | null>(null);
  const [redeemingCustomer, setRedeemingCustomer] = useState<CustomerRecord | null>(null);

  const activeLocation =
    business.locations.find((l) => l.id === business.activeLocationId) ||
    business.locations[0];

  useEffect(() => {
    const unsub = loyaltyService.subscribe(() => {
      setCustomers(loyaltyService.getCustomers(business.id));
      setProgram(loyaltyService.getProgram(business.id));
    });
    return unsub;
  }, [business.id]);

  // Filtering
  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'archived') {
      return c.status === 'archived';
    }

    if (c.status === 'archived') return false;

    if (statusFilter === 'reward_ready') {
      return c.rewards.some((r) => !r.isRedeemed);
    }

    if (statusFilter === 'in_progress') {
      return !c.rewards.some((r) => !r.isRedeemed);
    }

    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'visits') {
      return b.totalVisits - a.totalVisits;
    }
    // Default last_visit
    const timeA = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
    const timeB = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
    return timeB - timeA;
  });

  const activeCount = customers.filter((c) => c.status === 'active').length;
  const rewardReadyCount = customers.filter(
    (c) => c.status === 'active' && c.rewards.some((r) => !r.isRedeemed)
  ).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Loyalty Members & Customer CRM
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Search members, view individual stamp balances, record counter visits, and redeem unlocked rewards.
          </p>
        </div>

        <button
          type="button"
          data-testid="add-customer-btn"
          onClick={() => setAddCustomerModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Enroll New Customer</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            ENROLLED MEMBERS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {activeCount}
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-0.5">
            Active digital passes
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            REWARDS UNLOCKED
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-amber-600 dark:text-amber-400">
            {rewardReadyCount}
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-0.5">
            Ready for counter redemption
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            RECORDED VISITS
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {customers.reduce((acc, c) => acc + c.totalVisits, 0)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Verified visits across counters
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
          <span className="text-[10px] uppercase text-subtle-foreground font-bold block mb-1">
            ACTIVE STAMPS HELD
          </span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {customers.reduce((acc, c) => acc + c.currentStamps, 0)}
          </div>
          <div className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-0.5">
            In customer wallet cards
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            data-testid="crm-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#141412] text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#141412] text-xs text-[#111318] dark:text-[#F7F3EB] font-medium"
          >
            <option value="all">All Statuses ({activeCount})</option>
            <option value="reward_ready">Reward Ready ({rewardReadyCount})</option>
            <option value="in_progress">In Progress</option>
            <option value="archived">Archived Members</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#141412] text-xs text-[#111318] dark:text-[#F7F3EB] font-medium"
          >
            <option value="last_visit">Sort: Recent Visit</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="visits">Sort: Most Visits</option>
          </select>
        </div>
      </div>

      {/* 4. Customer Table (Desktop) & Card List (Mobile) */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] overflow-hidden shadow-xs">
        
        {sorted.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 text-subtle-foreground mx-auto opacity-40" />
            <h4 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
              No Customers Found
            </h4>
            <p className="text-xs text-[#60646C] dark:text-[#AAA499] max-w-sm mx-auto">
              {searchQuery
                ? `No customer profiles matching "${searchQuery}".`
                : 'Enroll your first loyalty member to begin recording stamps.'}
            </p>
            <button
              type="button"
              onClick={() => setAddCustomerModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer"
            >
              Enroll New Member
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-[10px] font-bold uppercase text-subtle-foreground">
              <span className="col-span-4">MEMBER & CONTACT</span>
              <span className="col-span-3">LOYALTY PROGRESS</span>
              <span className="col-span-2">TOTAL VISITS</span>
              <span className="col-span-3 text-right">ACTIONS</span>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {sorted.map((c) => {
                const hasUnlocked = c.rewards.some((r) => !r.isRedeemed);

                return (
                  <div
                    key={c.id}
                    className="p-4 sm:px-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Desktop Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      
                      {/* Member & Contact */}
                      <div className="col-span-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setProfileCustomerId(c.id)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm text-white shadow-xs cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: program.accentColor }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </button>
                        <div className="truncate">
                          <button
                            type="button"
                            onClick={() => setProfileCustomerId(c.id)}
                            className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB] hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors text-left truncate block cursor-pointer"
                          >
                            {c.name}
                          </button>
                          <div className="text-[11px] text-subtle-foreground truncate">
                            {c.email || c.phoneNumber || 'No contact on file'}
                          </div>
                        </div>
                      </div>

                      {/* Loyalty Progress Bar & Counter */}
                      <div className="col-span-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                            {c.currentStamps} / {program.stampsRequired} visits
                          </span>
                          {hasUnlocked ? (
                            <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              Reward Ready
                            </span>
                          ) : (
                            <span className="text-[10px] text-subtle-foreground">
                              {program.stampsRequired - c.currentStamps} to reward
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (c.currentStamps / program.stampsRequired) * 100)}%`,
                              backgroundColor: hasUnlocked ? '#F59E0B' : program.accentColor,
                            }}
                          />
                        </div>
                      </div>

                      {/* Total Visits & Last Activity */}
                      <div className="col-span-2 text-xs">
                        <div className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {c.totalVisits} visits
                        </div>
                        <div className="text-[10px] text-subtle-foreground">
                          {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString() : 'Never'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        {hasUnlocked && (
                          <button
                            type="button"
                            data-testid={`crm-redeem-${c.id}`}
                            onClick={() => setRedeemingCustomer(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Redeem
                          </button>
                        )}

                        <button
                          type="button"
                          data-testid={`crm-stamp-${c.id}`}
                          onClick={() => setStampingCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 hover:border-[#3027F5] dark:hover:border-[#E4C174] text-xs font-semibold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all"
                        >
                          Stamp (+1)
                        </button>

                        <button
                          type="button"
                          data-testid={`crm-view-${c.id}`}
                          onClick={() => setProfileCustomerId(c.id)}
                          className="p-1.5 text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
                          title="View Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Mobile Card Row */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setProfileCustomerId(c.id)}
                          className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB] text-left"
                        >
                          {c.name}
                        </button>
                        {hasUnlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Reward Ready
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-[#3027F5] dark:text-[#E4C174]">
                            {c.currentStamps}/{program.stampsRequired} visits
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-subtle-foreground">
                        <span>{c.email || c.phoneNumber || 'No contact info'}</span>
                        <span>{c.totalVisits} visits</span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
                        {hasUnlocked && (
                          <button
                            type="button"
                            onClick={() => setRedeemingCustomer(c)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Redeem Reward
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setStampingCustomer(c)}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 text-xs font-bold cursor-pointer"
                        >
                          Stamp (+1)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileCustomerId(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-bold cursor-pointer"
                        >
                          Profile &rarr;
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Profile Modal */}
      {profileCustomerId && (
        <CustomerProfileModal
          isOpen={!!profileCustomerId}
          onClose={() => setProfileCustomerId(null)}
          customerId={profileCustomerId}
          businessId={business.id}
          program={program}
          defaultStaffPin={activeLocation.staffPin}
          locationId={activeLocation.id}
          onEditCustomer={(c) => {
            setEditingCustomer(c);
          }}
        />
      )}

      {/* Add / Edit Customer Modal */}
      <CustomerEditModal
        isOpen={addCustomerModalOpen || !!editingCustomer}
        onClose={() => {
          setAddCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        businessId={business.id}
        customer={editingCustomer}
        onSuccess={(c) => {
          setCustomers(loyaltyService.getCustomers(business.id));
          if (!editingCustomer) {
            setProfileCustomerId(c.id);
          }
        }}
      />

      {/* Stamp Issuance Modal */}
      {stampingCustomer && (
        <StampIssuanceModal
          isOpen={!!stampingCustomer}
          onClose={() => setStampingCustomer(null)}
          businessId={business.id}
          locationId={activeLocation.id}
          defaultStaffPin={activeLocation.staffPin}
          program={program}
          customers={[stampingCustomer]}
          initialCustomerId={stampingCustomer.id}
          onStampSuccess={() => {
            setCustomers(loyaltyService.getCustomers(business.id));
          }}
        />
      )}

      {/* Reward Redemption Modal */}
      {redeemingCustomer && (
        <RewardRedemptionModal
          isOpen={!!redeemingCustomer}
          onClose={() => setRedeemingCustomer(null)}
          businessId={business.id}
          locationId={activeLocation.id}
          defaultStaffPin={activeLocation.staffPin}
          customer={redeemingCustomer}
          onRedemptionSuccess={() => {
            setCustomers(loyaltyService.getCustomers(business.id));
          }}
        />
      )}

    </div>
  );
};
