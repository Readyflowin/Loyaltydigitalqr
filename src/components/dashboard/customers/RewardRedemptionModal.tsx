import React, { useState } from 'react';
import { X, Gift, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import type { CustomerRecord, CustomerReward } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';

interface RewardRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  locationId?: string;
  defaultStaffPin: string;
  customer: CustomerRecord;
  reward?: CustomerReward;
  onRedemptionSuccess?: () => void;
}

export const RewardRedemptionModal: React.FC<RewardRedemptionModalProps> = ({
  isOpen,
  onClose,
  businessId,
  locationId,
  defaultStaffPin,
  customer,
  reward: explicitReward,
  onRedemptionSuccess,
}) => {
  // If no explicit reward is passed, select the first unredeemed reward
  const availableRewards = customer.rewards.filter((r) => !r.isRedeemed);
  const targetReward = explicitReward || availableRewards[0];

  const [staffPin, setStaffPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRedeemedSuccess, setIsRedeemedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirmRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReward) {
      setErrorMsg('No unlocked reward is available for redemption.');
      return;
    }

    if (!staffPin || staffPin.trim().length < 4 || !/^\d{4,6}$/.test(staffPin.trim())) {
      setErrorMsg('Please enter a valid 4-digit staff PIN.');
      return;
    }

    // Strict staff PIN verification
    if (staffPin.trim() !== defaultStaffPin.trim()) {
      setErrorMsg('Invalid staff confirmation PIN. Access denied.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = loyaltyService.redeemReward({
        businessId,
        locationId,
        customerId: customer.id,
        rewardId: targetReward.id,
        staffPin: staffPin.trim(),
      });

      if (res.success) {
        setIsRedeemedSuccess(true);
        if (onRedemptionSuccess) onRedemptionSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to redeem reward.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during reward redemption.');
    } finally {
      setIsSubmitting(false);
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

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              REWARD REDEMPTION WORKFLOW
            </span>
            <h3 className="text-lg sm:text-xl font-heading font-black text-foreground mt-0.5">
              Redeem Customer Reward
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {isRedeemedSuccess ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block">
                REDEMPTION CONFIRMED
              </span>
              <h4 className="text-xl font-heading font-black text-foreground mt-0.5">
                {customer.name}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Voucher <strong>#{targetReward?.voucherCode}</strong> has been marked as redeemed and cannot be reused.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted border border-black/5 dark:border-white/5 text-xs text-muted-foreground">
              The audit event has been logged and the program redemption metrics have been updated.
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        ) : !targetReward ? (
          /* Empty / No Available Reward State */
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h4 className="font-heading font-bold text-base text-foreground">
              No Available Unlocked Rewards
            </h4>
            <p className="text-xs text-muted-foreground">
              {customer.name} has no pending rewards ready for redemption. Record more visits to reach the reward milestone.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          /* Redemption Confirmation Form */
          <form onSubmit={handleConfirmRedeem} className="space-y-4">
            
            {/* Voucher Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 block">
                  VOUCHER #{targetReward.voucherCode}
                </span>
                <div className="font-heading font-black text-base text-foreground">
                  {targetReward.rewardDescription}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Unlocked by: <strong>{customer.name}</strong> on {new Date(targetReward.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Confirmation Alert */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirm that the customer is present and receiving this benefit at the counter. Once confirmed, this voucher cannot be redeemed a second time.
            </p>

            {/* Staff PIN input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Staff Confirmation PIN
                </label>
                <span className="text-xs font-mono text-subtle-foreground">
                  Authorization Required
                </span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full font-mono text-center text-lg font-bold tracking-widest px-4 py-2 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-[#F0EEE6] dark:bg-[#2D2D2D] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.15)] flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0 mt-0.5" />
              <span>
                Each voucher can be redeemed only once, and every redemption is logged.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Reward Redemption'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
