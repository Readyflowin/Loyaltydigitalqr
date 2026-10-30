import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Gift,
  Plus,
  Edit2,
  Archive,
} from 'lucide-react';
import type { CustomerRecord, LoyaltyProgramConfig } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';
import { RewardRedemptionModal } from './RewardRedemptionModal';
import { StampIssuanceModal } from '../loyalty/StampIssuanceModal';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  businessId: string;
  program: LoyaltyProgramConfig;
  defaultStaffPin: string;
  locationId?: string;
  onEditCustomer: (customer: CustomerRecord) => void;
}

const CustomerProfileModalContent: React.FC<Omit<CustomerProfileModalProps, 'isOpen'>> = ({
  onClose,
  customerId,
  businessId,
  program,
  defaultStaffPin,
  locationId,
  onEditCustomer,
}) => {
  const [customer, setCustomer] = useState<CustomerRecord | null>(() => {
    return loyaltyService.getCustomer(businessId, customerId);
  });

  const [stampModalOpen, setStampModalOpen] = useState(false);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);

  // Subscribe to updates so stamps/redemptions update profile in real-time
  React.useEffect(() => {
    const unsub = loyaltyService.subscribe(() => {
      setCustomer(loyaltyService.getCustomer(businessId, customerId));
    });
    return unsub;
  }, [businessId, customerId]);

  if (!customer) return null;

  const unlockedRewards = customer.rewards.filter((r) => !r.isRedeemed);

  // Get customer specific events
  const customerEvents = loyaltyService
    .getEvents(businessId, 30)
    .filter((e) => e.customerId === customer.id);

  const handleArchive = () => {
    if (window.confirm(`Are you sure you want to archive ${customer.name}?`)) {
      loyaltyService.archiveCustomer(businessId, customer.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Profile Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-black text-lg text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: program.accentColor }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  {customer.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                    customer.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                      : 'bg-black/5 dark:bg-white/10 text-subtle-foreground'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-[#60646C] dark:text-[#AAA499] mt-0.5">
                Enrolled {new Date(customer.enrolledAt).toLocaleDateString()} · {customer.totalVisits} lifetime visits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onEditCustomer(customer);
              }}
              className="p-2 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="p-2 rounded-xl text-subtle-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
              title="Archive Customer"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">
          
          {/* Quick Contact & Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] text-xs">
            <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
              <Mail className="w-4 h-4 text-subtle-foreground flex-shrink-0" />
              <span>{customer.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
              <Phone className="w-4 h-4 text-subtle-foreground flex-shrink-0" />
              <span>{customer.phoneNumber || 'No phone provided'}</span>
            </div>
          </div>

          {/* Loyalty Pass Progress Card */}
          <div className="p-5 rounded-2xl border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#161614] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                  ACTIVE LOYALTY CARD
                </span>
                <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                  {program.name}
                </h4>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-lg text-[#3027F5] dark:text-[#E4C174]">
                  {customer.currentStamps} / {program.stampsRequired}
                </span>
                <span className="text-[10px] text-subtle-foreground block uppercase">
                  Stamps Held
                </span>
              </div>
            </div>

            {/* Stamp Dots Grid */}
            <div className="flex flex-wrap gap-2 py-1">
              {Array.from({ length: program.stampsRequired }).map((_, idx) => {
                const isStamped = idx < customer.currentStamps;
                return (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all ${
                      isStamped
                        ? 'text-white shadow-xs'
                        : 'border border-dashed border-[#DDD9CE] dark:border-white/10 text-subtle-foreground'
                    }`}
                    style={{
                      backgroundColor: isStamped ? program.accentColor : 'transparent',
                    }}
                  >
                    {isStamped ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#60646C] dark:text-[#AAA499]">
                Milestone: <strong>{program.rewardDescription}</strong>
              </span>

              <button
                type="button"
                data-testid="profile-stamp-btn"
                onClick={() => setStampModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Issue Stamp (+1)</span>
              </button>
            </div>
          </div>

          {/* Unlocked Reward Banner */}
          {unlockedRewards.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300 block">
                    REWARD UNLOCKED · READY AT COUNTER
                  </span>
                  <div className="font-heading font-black text-sm sm:text-base text-[#111318] dark:text-[#F7F3EB]">
                    {unlockedRewards[0].rewardDescription}
                  </div>
                  <div className="text-[11px] font-mono text-subtle-foreground">
                    Voucher Code: #{unlockedRewards[0].voucherCode}
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-testid="profile-redeem-btn"
                onClick={() => setRedemptionModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
              >
                Redeem Reward
              </button>
            </div>
          )}

          {/* Internal Staff Notes */}
          {customer.notes && (
            <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] text-xs space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-subtle-foreground block">
                STAFF NOTES
              </span>
              <p className="text-[#111318] dark:text-[#F7F3EB] italic leading-relaxed">
                "{customer.notes}"
              </p>
            </div>
          )}

          {/* Timeline & Audit Events */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10 dark:border-white/10">
              <span className="text-xs font-mono font-bold uppercase text-subtle-foreground">
                Visit & Redemption History
              </span>
              <span className="text-[11px] text-subtle-foreground">
                {customerEvents.length} recorded events
              </span>
            </div>

            {customerEvents.length === 0 ? (
              <p className="text-xs text-subtle-foreground py-3 text-center">
                No recent events recorded for this customer.
              </p>
            ) : (
              <div className="space-y-2.5">
                {customerEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#181816] text-xs flex items-center justify-between gap-3 border border-black/5 dark:border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          evt.type === 'reward_redeemed'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : evt.type === 'reward_unlocked'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-black/5 dark:bg-white/10 text-subtle-foreground'
                        }`}
                      >
                        {evt.type === 'reward_redeemed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : evt.type === 'reward_unlocked' ? (
                          <Award className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {evt.details}
                        </div>
                        <div className="text-[10px] text-subtle-foreground">
                          {evt.staffIdentifier} · {new Date(evt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-subtle-foreground uppercase flex-shrink-0">
                      {evt.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Nested Stamp Modal */}
      <StampIssuanceModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        businessId={businessId}
        locationId={locationId}
        defaultStaffPin={defaultStaffPin}
        program={program}
        customers={[customer]}
        initialCustomerId={customer.id}
      />

      {/* Nested Redemption Modal */}
      {unlockedRewards.length > 0 && (
        <RewardRedemptionModal
          isOpen={redemptionModalOpen}
          onClose={() => setRedemptionModalOpen(false)}
          businessId={businessId}
          locationId={locationId}
          defaultStaffPin={defaultStaffPin}
          customer={customer}
          reward={unlockedRewards[0]}
        />
      )}

    </div>
  );
};

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = (props) => {
  if (!props.isOpen || !props.customerId) return null;
  return <CustomerProfileModalContent key={props.customerId} {...props} />;
};
