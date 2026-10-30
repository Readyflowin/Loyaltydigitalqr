import React, { useState } from 'react';
import {
  Award,
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Play,
  Pause,
  Gift,
  ArrowRight,
} from 'lucide-react';
import type { MockBusiness } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { LoyaltyProgramConfig, CustomerRecord, LoyaltyEvent } from '../../../types/loyalty';
import { mockLoyaltyService } from '../../../services/mockLoyaltyService';
import { LoyaltyCardPreview } from '../../onboarding/LoyaltyCardPreview';
import { LoyaltyProgramEditModal } from './LoyaltyProgramEditModal';
import { StampIssuanceModal } from './StampIssuanceModal';
import { RewardRedemptionModal } from '../customers/RewardRedemptionModal';

interface LoyaltyProgramViewProps {
  business: MockBusiness;
  theme: ThemeMode;
  onNavigateToCRM?: () => void;
  onNavigateToQR?: () => void;
}

export const LoyaltyProgramView: React.FC<LoyaltyProgramViewProps> = ({
  business,
  theme,
  onNavigateToCRM,
  onNavigateToQR,
}) => {
  // Live reactive data from mockLoyaltyService
  const [program, setProgram] = useState<LoyaltyProgramConfig>(() => {
    return mockLoyaltyService.getProgram(business.id);
  });

  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    return mockLoyaltyService.getCustomers(business.id);
  });

  const [events, setEvents] = useState<LoyaltyEvent[]>(() => {
    return mockLoyaltyService.getEvents(business.id, 10);
  });

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stampModalOpen, setStampModalOpen] = useState(false);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);
  const [targetRedemptionCustomer, setTargetRedemptionCustomer] = useState<CustomerRecord | null>(null);

  const activeLocation =
    business.locations.find((l) => l.id === business.activeLocationId) ||
    business.locations[0];

  // Refresh local state when service updates
  React.useEffect(() => {
    const unsub = mockLoyaltyService.subscribe(() => {
      setProgram(mockLoyaltyService.getProgram(business.id));
      setCustomers(mockLoyaltyService.getCustomers(business.id));
      setEvents(mockLoyaltyService.getEvents(business.id, 10));
    });
    return unsub;
  }, [business.id]);

  // Derived metrics
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const enrolledCount = activeCustomers.length;
  const totalVisitsIssued = activeCustomers.reduce((acc, c) => acc + c.totalVisits, 0);

  // Unlocked rewards (available for redemption)
  const customersWithRewards = activeCustomers.filter((c) =>
    c.rewards.some((r) => !r.isRedeemed)
  );

  const totalRewardsRedeemed = activeCustomers.reduce(
    (acc, c) => acc + c.rewards.filter((r) => r.isRedeemed).length,
    0
  );

  const totalRewardsUnlocked = activeCustomers.reduce(
    (acc, c) => acc + c.rewards.length,
    0
  );

  const handleToggleStatus = () => {
    const nextStatus = program.status === 'active' ? 'paused' : 'active';
    mockLoyaltyService.saveProgram(business.id, { status: nextStatus });
  };

  const handleOpenRedeem = (customer: CustomerRecord) => {
    setTargetRedemptionCustomer(customer);
    setRedemptionModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      
      {/* 1. Page Header with Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              LOYALTY ENGINE
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                program.status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
              }`}
            >
              {program.status === 'active' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5" />
                  <span>Paused</span>
                </>
              )}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            {program.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Digital pass stamping, milestone reward thresholds, and counter staff verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleStatus}
            className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] text-xs font-semibold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            title={program.status === 'active' ? 'Pause stamping' : 'Resume program'}
          >
            {program.status === 'active' ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="edit-program-btn"
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-bold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Configure Rewards</span>
          </button>

          <button
            type="button"
            data-testid="issue-stamp-btn"
            onClick={() => setStampModalOpen(true)}
            className="px-5 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Stamp (+1)</span>
          </button>
        </div>
      </div>

      {/* 2. Program Summary Cards (4 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Milestone Rule */}
        <div className="rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold">
              REWARD THRESHOLD
            </span>
            <Award className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {program.stampsRequired} Visits
          </div>
          <div className="mt-1 text-[11px] text-[#60646C] dark:text-[#AAA499] truncate font-medium">
            {program.rewardDescription}
          </div>
        </div>

        {/* Metric 2: Enrolled Members */}
        <div className="rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold">
              ENROLLED MEMBERS
            </span>
            <Users className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {enrolledCount}
          </div>
          <div className="mt-1 text-[11px] text-[#60646C] dark:text-[#AAA499]">
            Active customer passes
          </div>
        </div>

        {/* Metric 3: Total Stamps Issued */}
        <div className="rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold">
              TOTAL VISITS RECORDED
            </span>
            <QrCode className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {totalVisitsIssued}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Verified with counter PIN
          </div>
        </div>

        {/* Metric 4: Rewards Unlocked vs Redeemed */}
        <div className="rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold">
              REWARDS EARNED
            </span>
            <Gift className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {totalRewardsUnlocked}
          </div>
          <div className="mt-1 text-[11px] text-[#60646C] dark:text-[#AAA499]">
            {totalRewardsRedeemed} redeemed · {totalRewardsUnlocked - totalRewardsRedeemed} ready
          </div>
        </div>

      </div>

      {/* 3. Program Showcase & Pass Preview (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Customer Digital Pass Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
          <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase font-bold text-[#3027F5] dark:text-[#E4C174]">
              LIVE CUSTOMER PASS
            </span>
            <span className="text-[11px] font-mono text-[#868A94]">
              Apple / Google Wallet Format
            </span>
          </div>

          <LoyaltyCardPreview
            businessName={business.name}
            programName={program.name}
            stampsRequired={program.stampsRequired}
            rewardDescription={program.rewardDescription}
            accentColor={program.accentColor}
            theme={theme}
          />

          <div className="w-full mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-[#60646C] dark:text-[#AAA499]">
            <span>Model: <strong>Digital Stamp Card</strong></span>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="text-[#3027F5] dark:text-[#E4C174] font-bold hover:underline cursor-pointer"
            >
              Edit Card Design →
            </button>
          </div>
        </div>

        {/* Right: Operational Configuration & Counter Staff Validation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Stamping Rule Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                COUNTER STAMPING SPECIFICATION
              </span>
              <span className="font-mono text-xs text-[#868A94]">
                ID: {program.id}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-[#111318] dark:text-[#F7F3EB]">
                {program.stampsRequired} Visits = {program.rewardDescription}
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                Customers present their digital loyalty card on their smartphone at your counter or checkout register. Staff taps or enters the 4-digit PIN directly onto the customer screen to issue an instant stamp.
              </p>
            </div>

            {/* Terms */}
            {program.terms && (
              <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-black/5 dark:border-white/5 text-xs text-[#60646C] dark:text-[#AAA499]">
                <strong className="text-[#111318] dark:text-[#F7F3EB]">Program Terms:</strong> {program.terms}
              </div>
            )}

            {/* Location & PIN Info */}
            <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#868A94] block text-[10px] uppercase font-mono">
                  ACTIVE LOCATION
                </span>
                <span className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB]">
                  {activeLocation.name}
                </span>
              </div>

              <div>
                <span className="text-[#868A94] block text-[10px] uppercase font-mono">
                  COUNTER STAFF PIN
                </span>
                <span className="font-mono font-black text-sm bg-black/5 dark:bg-white/10 px-2.5 py-0.5 rounded text-[#3027F5] dark:text-[#E4C174]">
                  {activeLocation.staffPin}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStampModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-bold text-[#111318] dark:text-[#F7F3EB] cursor-pointer transition-colors"
              >
                Test Stamping →
              </button>
            </div>
          </div>

          {/* Unlocked Rewards Ready for Redemption */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
                <h4 className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                  Rewards Ready for Counter Redemption ({customersWithRewards.length})
                </h4>
              </div>
              {onNavigateToCRM && (
                <button
                  type="button"
                  onClick={onNavigateToCRM}
                  className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  View CRM →
                </button>
              )}
            </div>

            {customersWithRewards.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#868A94]">
                No pending unlocked rewards. Customers receive a voucher once they hit {program.stampsRequired} visits.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-black/5 dark:divide-white/5">
                {customersWithRewards.map((c) => {
                  const unlockedReward = c.rewards.find((r) => !r.isRedeemed);
                  if (!unlockedReward) return null;

                  return (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[#3027F5] dark:text-[#E4C174] font-medium">
                          {unlockedReward.rewardDescription} · Voucher #{unlockedReward.voucherCode}
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`redeem-btn-${c.id}`}
                        onClick={() => handleOpenRedeem(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        Redeem Reward
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. Recent Audit History Table */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#868A94] uppercase block">
              AUDIT TRAIL
            </span>
            <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              Recent Loyalty Events & Stamping Log
            </h3>
          </div>
          {onNavigateToQR && (
            <button
              type="button"
              onClick={onNavigateToQR}
              className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Get Counter QR Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#868A94]">
            No activity recorded yet. Issue your first stamp above.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-black/5 dark:divide-white/5">
            {events.map((evt) => (
              <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      evt.type === 'reward_unlocked'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : evt.type === 'reward_redeemed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-black/5 dark:bg-white/5 text-[#868A94]'
                    }`}
                  >
                    {evt.type === 'reward_unlocked' ? (
                      <Award className="w-3.5 h-3.5" />
                    ) : evt.type === 'reward_redeemed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB]">
                      {evt.details}
                    </div>
                    <div className="text-[11px] text-[#868A94]">
                      {evt.staffIdentifier} · {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 text-[#60646C] dark:text-[#AAA499]">
                  {evt.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LoyaltyProgramEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        program={program}
        businessName={business.name}
        onSaveProgram={(updates) => {
          mockLoyaltyService.saveProgram(business.id, updates);
        }}
        theme={theme}
      />

      <StampIssuanceModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        businessId={business.id}
        locationId={activeLocation.id}
        defaultStaffPin={activeLocation.staffPin}
        program={program}
        customers={activeCustomers}
      />

      {targetRedemptionCustomer && (
        <RewardRedemptionModal
          isOpen={redemptionModalOpen}
          onClose={() => {
            setRedemptionModalOpen(false);
            setTargetRedemptionCustomer(null);
          }}
          businessId={business.id}
          locationId={activeLocation.id}
          defaultStaffPin={activeLocation.staffPin}
          customer={targetRedemptionCustomer}
          onRedemptionSuccess={() => {
            setCustomers(mockLoyaltyService.getCustomers(business.id));
          }}
        />
      )}

    </div>
  );
};
