import React, { useState } from 'react';
import { X, Gift, Check, Clock, AlertCircle, BadgeCheck } from 'lucide-react';
import type { ThemeMode, StoreItem } from '../../types';

interface RewardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  store?: StoreItem | null;
}

export const RewardDetailModal: React.FC<RewardDetailModalProps> = ({
  isOpen,
  onClose,
  theme,
  store,
}) => {
  const [redeemed, setRedeemed] = useState(false);

  if (!isOpen) return null;

  const rewardTitle = store?.rewardTitle || 'Free Handcrafted Specialty Drink';
  const rewardSubtitle = store?.rewardSubtitle || 'Any size oat latte, pour-over, or cold brew on the house';
  const storeName = store?.name || 'Goodday Coffee Shop';
  const rewardCode = store?.rewardCode || 'JAVA-10X-ROAST';

  const handleRedeem = () => {
    setRedeemed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Interactive Preview Notice */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase mb-4">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>INTERACTIVE PRODUCT DEMONSTRATION</span>
        </div>

        {/* Crisp White Voucher Pass Shell */}
        <div className="rounded-2xl bg-[#FAFAF8] dark:bg-[#2D2D2D] text-foreground p-5 shadow-sm border border-[#E2E0D8] dark:border-white/10 relative overflow-hidden">
          
          {/* Top Pass Details */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#ECEAE3] dark:border-white/10">
            <div>
              <span className="text-xs text-muted-foreground tracking-widest uppercase font-semibold">
                {storeName}
              </span>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                <BadgeCheck className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                <span>CUSTOMER REWARD PASS</span>
              </div>
            </div>

            {/* Acid Lime Badge with Cobalt Gift Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#D6FF38] text-[#3027F5] dark:bg-[#E4C174] dark:text-[#11100D] flex items-center justify-center font-bold shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          {/* Reward Main Title */}
          <div className="my-4">
            <h3 className="font-heading font-black text-xl text-foreground leading-tight">
              {rewardTitle}
            </h3>
            <p className="mt-1.5 text-xs text-[#5A5D66] dark:text-[#D0CBC1] leading-relaxed">
              {rewardSubtitle}
            </p>
          </div>

          {/* Barcode / Voucher Code Block */}
          <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-[#E5E3DC] dark:border-white/10 text-center shadow-xs">
            {redeemed ? (
              <div className="py-2 animate-in zoom-in-90 duration-150">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1.5 font-bold shadow-xs">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Reward Marked as Redeemed!
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Simulated validation recorded
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1 font-semibold">
                  SHOW CASHIER CODE AT CHECKOUT
                </div>
                <div className="font-mono font-black text-2xl tracking-wider text-[#3027F5] dark:text-[#E4C174] py-0.5">
                  {rewardCode}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>Valid for 30 days from unlock</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 space-y-2.5">
          {!redeemed ? (
            <button
              type="button"
              onClick={handleRedeem}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_8px_20px_rgba(48,39,245,0.22)] ${
                theme === 'light'
                  ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white'
                  : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D]'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Simulate Cashier Redemption</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRedeemed(false)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-black/10 dark:border-white/10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              Reset Redemption State
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-muted-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer transition-colors"
          >
            Close preview
          </button>
        </div>

      </div>
    </div>
  );
};
