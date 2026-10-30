import React from 'react';
import type { ThemeMode, StoreItem } from '../../types';
import { MasterLoyaltyWallet } from '../hero/MasterLoyaltyWallet';

interface MasterWalletFeatureStoryProps {
  theme: ThemeMode;
  onViewReward: (store: StoreItem) => void;
  onOpenCardBuilder: () => void;
}

export const MasterWalletFeatureStory: React.FC<MasterWalletFeatureStoryProps> = ({
  theme: _theme,
  onViewReward,
  onOpenCardBuilder: _onOpenCardBuilder,
}) => {
  const pillars = [
    {
      title: 'ONE CARD. EVERY STORE.',
      subtitle: 'The master card represents the unified experience.',
      desc: 'Customers do not need multiple loyalty apps. A single digital pass keeps participating stores organized in one place.',
    },
    {
      title: 'ALL STORES. ONE PLACE.',
      subtitle: 'Select a business to see its loyalty progress.',
      desc: 'Whether visiting a barbershop or grabbing a coffee, customers can select a business and view its individual balance.',
    },
    {
      title: 'SEPARATE STAMPS. ONE CARD.',
      subtitle: 'Independent balances without confusion.',
      desc: 'Each participating business retains control over its own reward threshold and stamp rules.',
    },
  ];

  return (
    <section id="master-wallet" className="py-20 sm:py-28 relative overflow-hidden bg-black/5 dark:bg-[#0D0D0C] border-y border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE8E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
            <span className="w-2 h-2 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              THE UNIFIED WALLET EXPERIENCE
            </span>
          </div>

          <h2 className="mt-5 text-3xl sm:text-5xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
            One card. Multiple stores.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#60646C] dark:text-[#D0CBC1] max-w-2xl mx-auto">
            Every loyalty balance, organized in one place. No paper cards lost in wallets. No app store friction.
          </p>
        </div>

        {/* 3 User Journey Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.22)] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-[#1F1E1A] text-[#3027F5] dark:text-[#E4C174] font-mono font-bold text-xs flex items-center justify-center">
                  0{idx + 1}
                </div>
                <h3 className="mt-4 font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB] tracking-tight">
                  {pillar.title}
                </h3>
                <div className="text-[13px] font-medium text-[#3027F5] dark:text-[#E4C174] mt-1.5 leading-snug">
                  {pillar.subtitle}
                </div>
              </div>
              <p className="mt-4 text-[14.5px] text-[#60646C] dark:text-[#D0CBC1] leading-[1.6]">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Showcase Box */}
        <div className="mt-16 pt-12 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)]">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold tracking-widest text-[#60646C] dark:text-[#AAA499] uppercase">
              INTERACTIVE PREVIEW · CLICK TO TEST SWITCHING STORES
            </span>
          </div>

          <div className="flex justify-center">
            <MasterLoyaltyWallet
              onViewReward={onViewReward}
              isStandaloneSection={true}
            />
          </div>
        </div>

      </div>
    </section>
  );
};
