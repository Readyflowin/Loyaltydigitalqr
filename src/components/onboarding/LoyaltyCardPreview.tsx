import React from 'react';
import { Check, QrCode } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface LoyaltyCardPreviewProps {
  businessName: string;
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  accentColor: string;
  theme: ThemeMode;
}

export const LoyaltyCardPreview: React.FC<LoyaltyCardPreviewProps> = ({
  businessName,
  programName,
  stampsRequired,
  rewardDescription,
  accentColor,
  theme: _theme,
}) => {
  const displayBiz = businessName.trim() || 'Your Business Name';
  const displayProg = programName.trim() || 'Loyalty Club';
  const displayReward = rewardDescription.trim() || '1 Free Reward after visit milestone';

  return (
    <div className="w-full max-w-[340px] mx-auto rounded-3xl bg-white dark:bg-[#121211] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] p-5 sm:p-6 shadow-xl select-none transition-all">
      {/* Top Header of Card */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            {displayBiz.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] truncate max-w-[150px]">
              {displayBiz}
            </div>
            <div className="text-[10px] font-mono text-[#60646C] dark:text-[#AAA499] uppercase">
              {displayProg}
            </div>
          </div>
        </div>

        <div className="text-right">
          <QrCode className="w-5 h-5 text-[#60646C] dark:text-[#AAA499]" />
        </div>
      </div>

      {/* Reward Milestone Banner */}
      <div
        className="my-4 p-3 rounded-2xl text-center transition-all border border-black/5 dark:border-white/5"
        style={{
          backgroundColor: `${accentColor}15`,
        }}
      >
        <span
          className="text-[10px] font-mono uppercase font-bold tracking-wider block"
          style={{ color: accentColor }}
        >
          EARN REWARD AT {stampsRequired} STAMPS
        </span>
        <div className="font-heading font-bold text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] mt-0.5 line-clamp-2">
          {displayReward}
        </div>
      </div>

      {/* Stamp Slots Grid */}
      <div className="grid grid-cols-5 gap-2 my-4">
        {Array.from({ length: stampsRequired }).map((_, idx) => {
          const isStamped = idx < 2; // preview with 2 active stamps
          return (
            <div
              key={idx}
              className={`h-9 sm:h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all ${
                isStamped
                  ? 'text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-[#868A94] dark:text-[#AAA499] border border-black/5 dark:border-white/5'
              }`}
              style={isStamped ? { backgroundColor: accentColor } : undefined}
            >
              {isStamped ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
            </div>
          );
        })}
      </div>

      {/* Card Footer / Pass Indication */}
      <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-[#868A94] dark:text-[#AAA499]">
        <span>Scan camera · Staff PIN</span>
        <span>Apple & Google Wallet</span>
      </div>
    </div>
  );
};
