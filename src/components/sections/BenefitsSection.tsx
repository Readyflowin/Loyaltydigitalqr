import React from 'react';
import {
  Smartphone,
  Zap,
  ShieldCheck,
  BarChart3,
  QrCode,
  Wallet,
} from 'lucide-react';
import type { ThemeMode } from '../../types';

interface BenefitsSectionProps {
  theme?: ThemeMode;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = () => {
  const benefits = [
    {
      icon: Smartphone,
      title: 'No app download required',
      subtitle: 'ZERO APP STORE BARRIERS',
      desc: 'Customers simply point their camera and join in Safari or Chrome. No accounts to create, no passwords forgotten, no downloads clogging phone storage.',
    },
    {
      icon: Zap,
      title: 'Zero POS integration needed',
      subtitle: 'STANDALONE AGNOSTIC ENGINE',
      desc: 'Works alongside Toast, Clover, Square, traditional cash registers, or cash drawers. No messy API keys, terminal firmware updates, or IT headaches.',
    },
    {
      icon: ShieldCheck,
      title: 'Fraud-proof staff validation',
      subtitle: 'MERCHANT CONTROLLED',
      desc: 'Prevent unauthorized stamps with a staff-only 4-digit master PIN or rapid QR scanner from your own phone. Every stamp is verified at checkout.',
    },
    {
      icon: Wallet,
      title: 'Save to home screen',
      subtitle: 'NATIVE 1-TAP INTEGRATION',
      desc: 'Customers can bookmark their card or add it to their phone home screen to check stamps any time.',
    },
    {
      icon: BarChart3,
      title: 'Visit insights & retention trends',
      subtitle: 'TRANSPARENT DASHBOARD',
      desc: 'See exactly how many new members join weekly, identify your most frequent regulars, and measure the real redemption frequency of your rewards.',
    },
    {
      icon: QrCode,
      title: 'Ready-to-print counter kits',
      subtitle: 'INSTANT PHYSICAL ASSETS',
      desc: 'Export beautifully formatted PDF standees, table tents, and window stickers sized for standard acrylic holders with one click.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-[#F4F2EB] dark:bg-[#0D0D0C] border-y border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE8E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              WHY SMALL BUSINESSES CHOOSE US
            </span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
            All the loyalty power. None of the enterprise complexity.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#60646C] dark:text-[#D0CBC1]">
            Traditional loyalty programs demand expensive POS contracts, tablet hardware, and clunky apps. We stripped away all the friction.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.22)] shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-[#1F1E1A] border border-black/5 dark:border-[rgba(228,193,116,0.2)] flex items-center justify-center text-[#3027F5] dark:text-[#E4C174]">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="mt-5 text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                  {b.subtitle}
                </div>

                <h3 className="mt-1 font-heading font-black text-lg sm:text-xl text-[#111318] dark:text-[#F7F3EB]">
                  {b.title}
                </h3>

                <p className="mt-2 text-sm text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
