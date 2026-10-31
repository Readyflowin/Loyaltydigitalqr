import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { GymMemberRecord, GymMembershipPlan, GymPlanType } from '../../../types/gym';
import { gymService } from '../../../services/gymService';
import { loyaltyService } from '../../../services/loyaltyService';
import { formatMinorUnits } from '../../../types/cafe';
import { localDateKey } from '../../../utils/dates';

interface GymMembersViewProps {
  business: Business;
  theme: ThemeMode;
}

export const GymMembersView: React.FC<GymMembersViewProps> = ({ business }) => {
  // Reactive pubsub
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = gymService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [activeTab, setActiveTab] = useState<'members' | 'plans'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(() => localDateKey());
  const [assignError, setAssignError] = useState<string | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planType, setPlanType] = useState<GymPlanType>('recurring_monthly');
  const [planPrice, setPlanPrice] = useState('65.00');
  const [planVisits, setPlanVisits] = useState('10');
  const [planDays, setPlanDays] = useState('30');
  const [planClassAccess, setPlanClassAccess] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  const members: GymMemberRecord[] = gymService.getMembers(business.id, searchQuery, statusFilter);
  const plans: GymMembershipPlan[] = gymService.getAllPlans(business.id);
  const customers = loyaltyService.getCustomers(business.id);

  const handleOpenAssignModal = () => {
    setAssignCustomerId(customers[0]?.id || '');
    setAssignPlanId(plans[0]?.id || '');
    setAssignStartDate(localDateKey());
    setAssignError(null);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    const customer = customers.find((c) => c.id === assignCustomerId);
    if (!customer) {
      setAssignError('Please select a valid customer.');
      return;
    }
    if (!assignPlanId) {
      setAssignError('Please select a membership plan.');
      return;
    }

    const res = gymService.assignMembership(business.id, {
      businessId: business.id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phoneNumber,
      planId: assignPlanId,
      startDate: assignStartDate,
    });

    if (!res.success) {
      setAssignError(res.error || 'Failed to assign membership.');
      return;
    }

    setIsAssignModalOpen(false);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);

    const priceNum = parseFloat(planPrice);
    if (!planName.trim()) {
      setPlanError('Plan name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setPlanError('Valid plan price is required.');
      return;
    }

    const res = gymService.createPlan({
      businessId: business.id,
      name: planName.trim(),
      description: planDesc.trim(),
      planType,
      durationDays:
        planType === 'recurring_monthly'
          ? 30
          : planType === 'recurring_annual'
          ? 365
          : parseInt(planDays, 10) || undefined,
      includedVisits:
        planType === 'visit_pass' || planType === 'class_pack'
          ? parseInt(planVisits, 10) || 10
          : undefined,
      price: Math.round(priceNum * 100),
      currency: business.currency,
      hasClassAccess: planClassAccess,
    });

    if (!res.success) {
      setPlanError(res.error || 'Failed to create plan.');
      return;
    }

    setIsPlanModalOpen(false);
    setPlanName('');
    setPlanDesc('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D97706]/10 text-[#D97706] text-xs font-bold uppercase tracking-wider">
              FITNESS & WELLNESS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Members & Membership Plans
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage fitness memberships, visit packages, active member statuses, and pricing tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'members' ? (
            <button
              type="button"
              data-testid="assign-membership-btn"
              onClick={handleOpenAssignModal}
              className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Membership</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="create-plan-btn"
              onClick={() => setIsPlanModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Membership Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#E5E3DB] dark:border-white/10 pb-2 text-xs font-bold">
        <button
          type="button"
          data-testid="tab-members"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Members Roster ({members.length})
        </button>
        <button
          type="button"
          data-testid="tab-plans"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Membership Plans ({plans.length})
        </button>
      </div>

      {/* 3. Members Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground" />
              <input
                type="text"
                data-testid="search-members-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name or email..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-subtle-foreground text-xs uppercase font-bold mr-1">Status:</span>
              {(['all', 'active', 'expired', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  data-testid={`status-filter-${st}`}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-[#D97706] text-white'
                      : 'bg-muted text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          {members.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
              <UserCheck className="w-10 h-10 mx-auto text-subtle-foreground" />
              <h3 className="font-heading font-black text-base text-foreground">
                No Members Found
              </h3>
              <p className="text-xs text-muted-foreground">
                Assign your first gym membership to a customer profile.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table data-testid="gym-members-table" className="w-full text-left text-xs">
                  <thead className="bg-muted border-b border-[#E5E3DB] dark:border-white/10 text-subtle-foreground uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Remaining Visits</th>
                      <th className="py-3 px-4">Valid Through</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DB] dark:divide-white/10">
                    {members.map((mem) => (
                      <tr key={mem.id} data-testid={`member-row-${mem.id}`} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div>{mem.customerName}</div>
                          {mem.customerEmail && (
                            <div className="text-xs font-normal text-subtle-foreground">{mem.customerEmail}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {mem.planName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs text-muted-foreground">
                            {mem.planType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {mem.remainingVisits !== undefined ? (
                            <span data-testid={`member-remaining-${mem.id}`} className={mem.remainingVisits <= 1 ? 'text-amber-600' : 'text-emerald-600'}>
                              {mem.remainingVisits} of {mem.totalVisitsAllowed} left
                            </span>
                          ) : (
                            <span className="text-subtle-foreground">Unlimited</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {mem.endDate || 'No Expiry'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            data-testid={`member-status-${mem.id}`}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase font-mono ${
                              mem.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            }`}
                          >
                            {mem.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Plans Tab Content */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              data-testid={`plan-card-${p.id}`}
              className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[#D97706]/10 text-[#D97706] text-xs font-bold uppercase">
                    {p.planType.replace('_', ' ')}
                  </span>
                  <span className="font-heading font-black text-lg text-foreground">
                    {formatMinorUnits(p.price, p.currency)}
                  </span>
                </div>

                <h3 className="font-heading font-black text-base text-foreground">
                  {p.name}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 space-y-1 text-xs text-subtle-foreground">
                {p.includedVisits && <div>Allowance: {p.includedVisits} total visits</div>}
                {p.durationDays && <div>Validity: {p.durationDays} days</div>}
                <div>Class Access: {p.hasClassAccess ? 'Included' : 'Floor Only'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Assign Membership Modal */}
      {isAssignModalOpen && (
        <div
          data-testid="assign-membership-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-foreground">
                Assign Membership
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                {assignError}
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Customer Profile
                </label>
                <select
                  data-testid="assign-customer-select"
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Membership Plan
                </label>
                <select
                  data-testid="assign-plan-select"
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-medium"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatMinorUnits(p.price, p.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  data-testid="assign-start-date"
                  value={assignStartDate}
                  onChange={(e) => setAssignStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-assign-membership"
                  className="px-5 py-2 rounded-xl bg-[#D97706] text-white font-bold hover:bg-[#B45309] cursor-pointer shadow-md"
                >
                  Confirm & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Create Plan Modal */}
      {isPlanModalOpen && (
        <div
          data-testid="create-plan-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-foreground">
                New Membership Plan
              </h3>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg text-subtle-foreground hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {planError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                {planError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  data-testid="input-plan-name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. 10-Visit Punch Pass"
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Plan Type
                  </label>
                  <select
                    data-testid="input-plan-type"
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as GymPlanType)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground"
                  >
                    <option value="recurring_monthly">Monthly Membership</option>
                    <option value="recurring_annual">Annual Membership</option>
                    <option value="visit_pass">Prepaid Visit Pass</option>
                    <option value="class_pack">Studio Class Pack</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    data-testid="input-plan-price"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {(planType === 'visit_pass' || planType === 'class_pack') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Included Visits
                    </label>
                    <input
                      type="number"
                      data-testid="input-plan-visits"
                      value={planVisits}
                      onChange={(e) => setPlanVisits(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Validity (Days)
                    </label>
                    <input
                      type="number"
                      data-testid="input-plan-days"
                      value={planDays}
                      onChange={(e) => setPlanDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  data-testid="input-plan-desc"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10 text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="classAccess"
                  checked={planClassAccess}
                  onChange={(e) => setPlanClassAccess(e.target.checked)}
                  className="rounded-sm accent-[#D97706]"
                />
                <label htmlFor="classAccess" className="font-bold text-foreground">
                  Includes studio class attendance
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-plan-btn"
                  className="px-5 py-2 rounded-xl bg-[#D97706] text-white font-bold hover:bg-[#B45309] cursor-pointer shadow-md"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
