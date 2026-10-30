import React from 'react';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface PricingSectionProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  theme,
  onOpenCardBuilder,
}) => {
  const features = [
    '30 days completely free trial',
    'No credit card required to get started',
    'Custom digital loyalty card for your business',
    'Print-ready PDF counter display & QR kit',
    'Unlimited customer visits and joins',
    'Staff PIN stamp validation system',
    'Customer retention & visit analytics',
    'Card works in any phone browser — no app',
    'Mobile browser access — no app required',
    'Standard email & customer support',
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
            <span className="text-[11px] font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              TRANSPARENT & HONEST PRICING
            </span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
            Plans from $10/month.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#60646C] dark:text-[#D0CBC1]">
            Try everything free for 30 days. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing Card Showcase */}
        <div className="mt-12 max-w-xl mx-auto">
          <div className="relative rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#3027F5] dark:border-[#E4C174] p-8 sm:p-10 shadow-2xl transition-all">
            
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                  STARTER PLAN
                </span>
                <h3 className="font-heading font-black text-2xl text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                  Small Business Edition
                </h3>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-heading font-black text-4xl sm:text-5xl text-[#111318] dark:text-[#F7F3EB]">
                    $10
                  </span>
                  <span className="text-sm font-semibold text-[#60646C] dark:text-[#D0CBC1]">
                    /month
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#3027F5] dark:text-[#E4C174] font-semibold mt-0.5">
                  FIRST 30 DAYS FREE
                </div>
              </div>
            </div>

            {/* Trial Reassurance Banner */}
            <div className="mt-6 p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1E1D19] border border-black/5 dark:border-[rgba(228,193,116,0.2)] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
              <div className="text-xs text-[#111318] dark:text-[#F7F3EB]">
                <strong className="font-bold">Zero risk:</strong> 30-day free trial. Test with real customers at your counter before paying anything.
              </div>
            </div>

            {/* Features Checklist */}
            <div className="mt-8 space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#60646C] dark:text-[#AAA499] uppercase mb-4">
                EVERYTHING INCLUDED:
              </div>

              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-[#111318] dark:text-[#F7F3EB]">
                  <div className="w-5 h-5 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Button */}
            <div className="mt-10">
              <button
                type="button"
                onClick={onOpenCardBuilder}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/25'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
                }`}
              >
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 text-center text-xs text-[#60646C] dark:text-[#AAA499]">
                Instant setup · No credit card required · Cancel anytime
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
