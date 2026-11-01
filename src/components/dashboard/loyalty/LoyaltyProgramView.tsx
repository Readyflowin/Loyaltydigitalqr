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
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { LoyaltyProgramConfig, CustomerRecord, LoyaltyEvent } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';
import { LoyaltyCardPreview } from '../../onboarding/LoyaltyCardPreview';
import { LoyaltyProgramEditModal } from './LoyaltyProgramEditModal';
import { StampIssuanceModal } from './StampIssuanceModal';
import { StampRequestsPanel } from './StampRequestsPanel';
import { RewardRedemptionModal } from '../customers/RewardRedemptionModal';

interface LoyaltyProgramViewProps {
  business: Business;
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
  // Live reactive data from loyaltyService
  const [program, setProgram] = useState<LoyaltyProgramConfig>(() => {
    return loyaltyService.getProgram(business.id);
  });

  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    return loyaltyService.getCustomers(business.id);
  });

  const [events, setEvents] = useState<LoyaltyEvent[]>(() => {
    return loyaltyService.getEvents(business.id, 10);
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
    const unsub = loyaltyService.subscribe(() => {
      setProgram(loyaltyService.getProgram(business.id));
      setCustomers(loyaltyService.getCustomers(business.id));
      setEvents(loyaltyService.getEvents(business.id, 10));
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
    loyaltyService.saveProgram(business.id, { status: nextStatus });
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
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              LOYALTY ENGINE
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase flex items-center gap-1 ${
                program.status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
              }`} > {program.status === 'active' ? ( <> <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> <span>Active</span> </> ) : ( <> <Pause className="w-2.5 h-2.5" /> <span>Paused</span> </> )} </span> </div> <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-0.5"> {program.name} </h1> <p className="text-xs sm:text-sm text-muted-foreground mt-1"> Digital pass stamping, milestone reward thresholds, and counter staff verification. </p> </div> <div className="flex flex-wrap items-center gap-2.5"> <button type="button" onClick={handleToggleStatus} className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-1.5" title={program.status === 'active' ? 'Pause stamping' : 'Resume program'} > {program.status === 'active' ? ( <> <Pause className="w-3.5 h-3.5 text-amber-500" /> <span>Pause</span> </> ) : ( <> <Play className="w-3.5 h-3.5 text-emerald-500" /> <span>Resume</span> </> )} </button> <button type="button" data-testid="edit-program-btn" onClick={() => setEditModalOpen(true)} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-1.5" > <Edit3 className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" /> <span>Configure Rewards</span> </button> <button type="button" data-testid="issue-stamp-btn" onClick={() => setStampModalOpen(true)} className="px-5 py-2 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all" > <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Record Stamp (+1)</span> </button> </div> </div> {/* Live counter stamp-approval requests */}
      <StampRequestsPanel
        businessId={business.id}
        locationId={activeLocation.id}
        onApproved={() => {
          setCustomers(loyaltyService.getCustomers(business.id));
          setEvents(loyaltyService.getEvents(business.id, 10));
        }}
      />

      {/* 2. Program Summary Cards (4 Metrics) */} <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"> {/* Metric 1: Milestone Rule */} <div className="rounded-2xl bg-card border border-border p-5 shadow-xs"> <div className="flex items-center justify-between mb-2"> <span className="text-xs uppercase text-subtle-foreground font-bold"> REWARD THRESHOLD </span> <Award className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div className="text-2xl sm:text-3xl font-heading font-black text-foreground"> {program.stampsRequired} Visits </div> <div className="mt-1 text-xs text-muted-foreground truncate font-medium"> {program.rewardDescription} </div> </div> {/* Metric 2: Enrolled Members */} <div className="rounded-2xl bg-card border border-border p-5 shadow-xs"> <div className="flex items-center justify-between mb-2"> <span className="text-xs uppercase text-subtle-foreground font-bold"> ENROLLED MEMBERS </span> <Users className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div className="text-2xl sm:text-3xl font-heading font-black text-foreground"> {enrolledCount} </div> <div className="mt-1 text-xs text-muted-foreground"> Active customer passes </div> </div> {/* Metric 3: Total Stamps Issued */} <div className="rounded-2xl bg-card border border-border p-5 shadow-xs"> <div className="flex items-center justify-between mb-2"> <span className="text-xs uppercase text-subtle-foreground font-bold"> TOTAL VISITS RECORDED </span> <QrCode className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div className="text-2xl sm:text-3xl font-heading font-black text-foreground"> {totalVisitsIssued} </div> <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium"> Each confirmed with a staff PIN </div> </div> {/* Metric 4: Rewards Unlocked vs Redeemed */} <div className="rounded-2xl bg-card border border-border p-5 shadow-xs"> <div className="flex items-center justify-between mb-2"> <span className="text-xs uppercase text-subtle-foreground font-bold"> REWARDS EARNED </span> <Gift className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div className="text-2xl sm:text-3xl font-heading font-black text-foreground"> {totalRewardsUnlocked} </div> <div className="mt-1 text-xs text-muted-foreground"> {totalRewardsRedeemed} redeemed · {totalRewardsUnlocked - totalRewardsRedeemed} ready </div> </div> </div> {/* 3. Program Showcase & Pass Preview (2 Columns) */} <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"> {/* Left: Customer Digital Pass Live Preview (5 cols) */} <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-card border border-border shadow-xs"> <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10"> <span className="text-xs uppercase font-bold text-[#3027F5] dark:text-[#E4C174]"> LIVE CUSTOMER PASS </span> <span className="text-xs text-subtle-foreground"> Mobile Browser Card </span> </div> <LoyaltyCardPreview businessType={business.businessType} businessName={business.name} programName={program.name} stampsRequired={program.stampsRequired} rewardDescription={program.rewardDescription} accentColor={program.accentColor} theme={theme} /> <div className="w-full mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground"> <span>Card type: <strong>Digital stamp card</strong></span> <button type="button" onClick={() => setEditModalOpen(true)} className="text-[#3027F5] dark:text-[#E4C174] font-bold hover:underline cursor-pointer" > Edit Card Design → </button> </div> </div> {/* Right: Operational Configuration & Counter Staff Validation (7 cols) */} <div className="lg:col-span-7 space-y-4"> {/* Active Stamping Rule Card */} <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs"> <div className="flex items-center justify-between"> <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase"> HOW STAMPING WORKS </span> </div> <div className="space-y-2"> <h3 className="font-heading font-black text-xl text-foreground"> {program.stampsRequired} Visits = {program.rewardDescription} </h3> <p className="text-xs text-muted-foreground leading-relaxed"> Customers present their digital loyalty card on their smartphone at your counter or checkout register. Staff taps or enters the 4-digit PIN directly onto the customer screen to issue an instant stamp. </p> </div> {/* Terms */} {program.terms && ( <div className="p-3.5 rounded-2xl bg-muted border border-black/5 dark:border-white/5 text-xs text-muted-foreground"> <strong className="text-foreground">Program Terms:</strong> {program.terms} </div> )} {/* Location & PIN Info */} <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"> <div> <span className="text-subtle-foreground block text-xs uppercase"> ACTIVE LOCATION </span> <span className="font-heading font-bold text-foreground"> {activeLocation.name} </span> </div> <div> <span className="text-subtle-foreground block text-xs uppercase"> STAFF PIN (SEE SETTINGS) </span> <span className="font-mono font-black text-sm bg-black/5 dark:bg-white/10 px-2.5 py-0.5 rounded text-[#3027F5] dark:text-[#E4C174]"> •••• </span> </div> <button type="button" onClick={() => setStampModalOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-bold text-foreground cursor-pointer transition-colors" > Test Stamping → </button> </div> </div> {/* Unlocked Rewards Ready for Redemption */} <div className="p-6 rounded-3xl bg-card border border-border shadow-xs"> <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10"> <div className="flex items-center gap-2"> <Gift className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> <h4 className="font-heading font-bold text-sm text-foreground"> Rewards Ready for Counter Redemption ({customersWithRewards.length}) </h4> </div> {onNavigateToCRM && ( <button type="button" onClick={onNavigateToCRM} className="text-xs font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer" > View CRM → </button> )} </div> {customersWithRewards.length === 0 ? ( <div className="py-6 text-center text-xs text-subtle-foreground"> No pending unlocked rewards. Customers receive a voucher once they hit {program.stampsRequired} visits. </div> ) : ( <div className="mt-3 divide-y divide-black/5 dark:divide-white/5"> {customersWithRewards.map((c) => { const unlockedReward = c.rewards.find((r) => !r.isRedeemed); if (!unlockedReward) return null; return ( <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs"> <div> <div className="font-heading font-bold text-foreground"> {c.name} </div> <div className="text-xs text-[#3027F5] dark:text-[#E4C174] font-medium"> {unlockedReward.rewardDescription} · Voucher #{unlockedReward.voucherCode} </div> </div> <button type="button" data-testid={`redeem-btn-${c.id}`}
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
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-xs font-bold tracking-widest text-subtle-foreground uppercase block">
              AUDIT TRAIL
            </span>
            <h3 className="font-heading font-black text-lg text-foreground mt-0.5">
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
          <div className="py-8 text-center text-xs text-subtle-foreground">
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
                        : 'bg-black/5 dark:bg-white/5 text-subtle-foreground'
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
                    <div className="font-heading font-bold text-foreground">
                      {evt.details}
                    </div>
                    <div className="text-xs text-subtle-foreground">
                      {evt.staffIdentifier} · {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <span className="self-start sm:self-auto px-2 py-0.5 rounded text-xs uppercase bg-black/5 dark:bg-white/5 text-muted-foreground">
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
        businessType={business.businessType}
        onSaveProgram={(updates) => {
          loyaltyService.saveProgram(business.id, updates);
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
            setCustomers(loyaltyService.getCustomers(business.id));
          }}
        />
      )}

    </div>
  );
};
