import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface FinalCtaSectionProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
  onOpenVideoDemo: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  theme,
  onOpenCardBuilder,
  onOpenVideoDemo,
}) => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Conversion Banner */}
        <div
          className={`relative rounded-[36px] p-8 sm:p-14 lg:p-16 overflow-hidden border shadow-2xl ${
            theme === 'light'
              ? 'bg-[#111318] text-white border-black/10'
              : 'bg-gradient-to-b from-[#141412] to-[#0D0D0C] text-[#F7F3EB] border-[rgba(228,193,116,0.3)] shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
          }`}
        >
          {/* Subtle background decoration */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none blur-3xl"
            style={{
              background:
                theme === 'light'
                  ? 'radial-gradient(circle, #3027F5 0%, transparent 70%)'
                  : 'radial-gradient(circle, #E4C174 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#D6FF38] dark:text-[#E4C174] uppercase">
                LAUNCH IN 3 MINUTES
              </span>
            </div>

            {/* Headline */}
            <h2 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-tight">
              Give them a reason to{' '}
              <span className={theme === 'light' ? 'text-[#D6FF38]' : 'text-[#E4C174]'}>
                come back.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-white/70 dark:text-[#D0CBC1] max-w-xl leading-relaxed">
              Join thousands of independent businesses turning casual one-time visitors into loyal regulars. No app store. No POS headache.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenCardBuilder}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/30'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
                }`}
              >
                <span>Build your loyalty card</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenVideoDemo}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-semibold text-base text-white/90 hover:text-white hover:bg-white/10 border border-white/20 dark:text-[#F7F3EB] dark:border-[rgba(228,193,116,0.35)] dark:hover:bg-[#E4C174]/10 dark:hover:border-[#E4C174]/60 transition-all"
              >
                <span>Watch 1 min demo</span>
              </button>
            </div>

            {/* Reassurance */}
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/60 dark:text-[#AAA499]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6FF38] dark:text-[#E4C174]" />
                <span>30 days free</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6FF38] dark:text-[#E4C174]" />
                <span>No credit card required</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6FF38] dark:text-[#E4C174]" />
                <span>Instant setup</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
