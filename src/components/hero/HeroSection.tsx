import React from 'react';
import {
  ArrowRight,
  Play,
  Check,
  Pencil,
  QrCode,
  UsersRound,
} from 'lucide-react';
import type { ThemeMode, StoreItem } from '../../types';
import { HeroLightComposition } from './HeroLightComposition';
import { MasterLoyaltyWallet } from './MasterLoyaltyWallet';

interface HeroSectionProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
  onOpenVideoDemo: () => void;
  onViewReward: (store?: StoreItem) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  theme,
  onOpenCardBuilder,
  onOpenVideoDemo,
  onViewReward,
}) => {
  return (
    <section className="relative pt-2 sm:pt-4 xl:pt-6 dark:xl:pt-11 pb-6 overflow-hidden bg-[#F8F7F2] dark:bg-[#090909] w-full">
      {/* Responsive page container spanning 90-92% width on desktop (~5% side gutters) */}
      <div className="w-full max-w-[1536px] mx-auto px-6 sm:px-8 lg:px-[4.5%] xl:px-[5%]">
        
        {/* Main Hero Grid: Wide Asymmetric 42% / 58% Desktop Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          
          {/* Left Column: Messaging & CTAs (~42% on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-start z-10 pt-2 sm:pt-4 xl:pt-6">
            
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECEAE3] dark:bg-[#1A1916] dark:border dark:border-[rgba(228,193,116,0.3)] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
              <span className="text-[10px] xl:text-[11px] font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
                LOYALTY, WITHOUT THE FRICTION
              </span>
            </div>

            {/* Confident, Ultra-Bold Headline */}
            <h1 className="mt-4 xl:mt-5 text-[52px] sm:text-[62px] xl:text-[72px] 2xl:text-[76px] font-heading font-black tracking-[-0.028em] leading-[0.98] text-[#111318] dark:text-[#F7F3EB]">
              Give them
              <br />
              a reason to
              <br />
              <span className="relative inline-block text-[#3027F5] dark:text-[#E4C174] mt-0.5">
                come back.
                {/* Precision Anchored Highlighter Underline */}
                <svg
                  className="absolute -bottom-1 -left-1 w-[106%] h-[14px] xl:h-[18px] -z-1 pointer-events-none"
                  viewBox="0 0 260 14"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 3 7 Q 130 5, 257 7"
                    strokeWidth="13"
                    strokeLinecap="round"
                    className="stroke-[#D6FF38] dark:stroke-[#E4C174]/70"
                  />
                </svg>
              </span>
            </h1>

            {/* Supporting Paragraph with Exact Reference Line Breaks */}
            <p className="mt-4 xl:mt-5 text-[15px] xl:text-[17px] text-[#4A4D55] dark:text-[#D0CBC1] leading-[1.55] max-w-[360px] xl:max-w-[440px]">
              A digital loyalty card your customers can join in seconds. No app. No POS integration.
              <br className="hidden sm:inline" />
              Just a simple reason to return.
            </p>

            {/* CTAs Row */}
            <div className="mt-6 xl:mt-8 flex flex-wrap items-center gap-5 xl:gap-6">
              {/* Primary CTA: "Build your loyalty card ->" */}
              <button
                type="button"
                onClick={onOpenCardBuilder}
                className="h-[46px] xl:h-[50px] inline-flex items-center justify-center gap-2 px-6 xl:px-7 rounded-[12px] font-bold text-[14px] xl:text-[15px] bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-[0_8px_20px_rgba(48,39,245,0.28)] dark:shadow-[0_8px_20px_rgba(228,193,116,0.20)] transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Build your loyalty card</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Secondary CTA: Borderless "Watch 1 min demo" with Circular Play Icon */}
              <button
                type="button"
                onClick={onOpenVideoDemo}
                className="inline-flex items-center gap-2.5 text-[14px] xl:text-[15px] font-bold text-[#111318] dark:text-[#F7F3EB] hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors group cursor-pointer"
              >
                <div className="w-[30px] h-[30px] xl:w-[34px] xl:h-[34px] rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span>Watch 1 min demo</span>
              </button>
            </div>

            {/* Trial Reassurance */}
            <div className="mt-6 xl:mt-8 flex flex-wrap items-center gap-2 xl:gap-3 text-[12px] xl:text-[13px] text-[#60646C] dark:text-[#AAA499] font-medium">
              <div className="inline-flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full border border-[#60646C] dark:border-[#AAA499] flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[2.5]" />
                </div>
                <span>30 days free</span>
              </div>
              <span className="text-[#A0A2A8] dark:text-[#898477]">·</span>
              <div className="inline-flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full border border-[#60646C] dark:border-[#AAA499] flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[2.5]" />
                </div>
                <span>No credit card required</span>
              </div>
              <span className="text-[#A0A2A8] dark:text-[#898477]">·</span>
              <div className="inline-flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full border border-[#60646C] dark:border-[#AAA499] flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[2.5]" />
                </div>
                <span>Instant setup</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Product Showcase (~58% on desktop) */}
          <div className="lg:col-span-7 flex justify-end items-center overflow-visible">
            {theme === 'light' ? (
              <HeroLightComposition
                onViewReward={() => onViewReward()}
                onOpenCardBuilder={onOpenCardBuilder}
              />
            ) : (
              <MasterLoyaltyWallet
                onViewReward={(store) => onViewReward(store)}
              />
            )}
          </div>
        </div>

        {/* NARROW THREE-PART WORKFLOW STRIP ALONG HERO BOTTOM */}
        <div className="mt-10 xl:mt-14 pt-6 pb-2 border-t border-[#E0DED6] dark:border-[rgba(228,193,116,0.18)] w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 items-center">
            
            {/* Step 01 */}
            <div className="flex items-center gap-4 pr-4">
              <span className="text-[14px] xl:text-[16px] font-mono font-bold text-[#111318] dark:text-[#E4C174]">
                01
              </span>
              <div className="w-[40px] h-[40px] xl:w-[46px] xl:h-[46px] rounded-full flex-shrink-0 flex items-center justify-center bg-[#D6FF38] text-[#111318] dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs">
                <Pencil className="w-4 h-4 xl:w-5 xl:h-5 text-current" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[14px] xl:text-[15.5px] text-[#111318] dark:text-[#F7F3EB] leading-tight">
                  Create your card
                </h3>
                <p className="mt-0.5 text-[12px] xl:text-[13px] text-[#5A5D66] dark:text-[#AAA499] leading-snug">
                  Set up in minutes with ready-made rewards for your business.
                </p>
              </div>
            </div>

            {/* Step 02 (with vertical divider) */}
            <div className="flex items-center gap-4 px-4 md:border-l md:border-[#E0DED6] dark:md:border-[rgba(228,193,116,0.18)]">
              <span className="text-[14px] xl:text-[16px] font-mono font-bold text-[#111318] dark:text-[#E4C174]">
                02
              </span>
              <div className="w-[40px] h-[40px] xl:w-[46px] xl:h-[46px] rounded-full flex-shrink-0 flex items-center justify-center bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs">
                <QrCode className="w-4 h-4 xl:w-5 xl:h-5 text-current" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[14px] xl:text-[15.5px] text-[#111318] dark:text-[#F7F3EB] leading-tight">
                  Share your QR code
                </h3>
                <p className="mt-0.5 text-[12px] xl:text-[13px] text-[#5A5D66] dark:text-[#AAA499] leading-snug">
                  Display it at your counter or anywhere your customers visit.
                </p>
              </div>
            </div>

            {/* Step 03 (with vertical divider) */}
            <div className="flex items-center gap-4 pl-4 md:border-l md:border-[#E0DED6] dark:md:border-[rgba(228,193,116,0.18)]">
              <span className="text-[14px] xl:text-[16px] font-mono font-bold text-[#111318] dark:text-[#E4C174]">
                03
              </span>
              <div className="w-[40px] h-[40px] xl:w-[46px] xl:h-[46px] rounded-full flex-shrink-0 flex items-center justify-center bg-[#D6FF38] text-[#111318] dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs">
                <UsersRound className="w-4 h-4 xl:w-5 xl:h-5 text-current" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[14px] xl:text-[15.5px] text-[#111318] dark:text-[#F7F3EB] leading-tight">
                  Reward your regulars
                </h3>
                <p className="mt-0.5 text-[12px] xl:text-[13px] text-[#5A5D66] dark:text-[#AAA499] leading-snug">
                  Customers join, collect visits and redeem rewards — all in their phone.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
