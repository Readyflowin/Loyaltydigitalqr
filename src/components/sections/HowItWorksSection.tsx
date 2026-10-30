import React, { useState } from 'react';
import { QrCode, ArrowRight, Coffee, Check, Gift } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface HowItWorksSectionProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  theme,
  onOpenCardBuilder,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      num: '01',
      title: 'Create your card',
      badge: 'Takes 3 minutes',
      headline: 'Set up your loyalty card and define your reward.',
      description:
        'Choose your business style, pick your stamp threshold (5, 8, or 10 visits), and specify what your loyal customers receive. Upload your logo or use our elegant templates.',
    },
    {
      num: '02',
      title: 'Share your QR code',
      badge: 'Zero hardware',
      headline: 'Display the QR code at your counter or tables.',
      description:
        'Print our pre-formatted acrylic standee, sticker, or table tent PDF. Place it next to your register. No tablets to buy, no POS plugins to install.',
    },
    {
      num: '03',
      title: 'Reward your regulars',
      badge: 'Instant scan',
      headline: 'Customers join, collect visits and redeem rewards.',
      description:
        'Customers tap once to join in their mobile browser. On checkout, stamp their card with your secret staff PIN or merchant scan. Watch customer return rates surge.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)]">
            <span className="text-xs font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              SEAMLESS 3-STEP SETUP
            </span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground">
            How it works
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            No complex POS integration. No software installations. Designed to be launched in minutes by any busy business owner.
          </p>
        </div>

        {/* 3 Step Interactive Row */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Step Selector Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-white border-[#3027F5] shadow-lg shadow-[#3027F5]/5 ring-1 ring-[#3027F5]'
                        : 'bg-[#141412] border-[#E4C174] shadow-lg shadow-[rgba(228,193,116,0.05)] ring-1 ring-[#E4C174]'
                      : 'bg-transparent border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] hover:bg-white/50 dark:hover:bg-[#121211]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-[#111318]/40 dark:text-[#E4C174]/60">
                        {step.num}
                      </span>
                      <span className="font-heading font-bold text-base text-foreground">
                        {step.title}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? theme === 'light'
                            ? 'bg-[#3027F5]/10 text-[#3027F5]'
                            : 'bg-[#E4C174]/15 text-[#E4C174]'
                          : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-200">
                      <h4 className="font-semibold text-sm text-foreground">
                        {step.headline}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenCardBuilder}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-[#3027F5] text-white hover:bg-[#2319D8]'
                    : 'bg-[#E4C174] text-[#11100D] hover:bg-[#EBD294]'
                }`}
              >
                <span>Try creating your card now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Visual Preview Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl p-8 bg-[#EFECE6] dark:bg-[#121211] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.22)] shadow-xl min-h-[420px] flex items-center justify-center overflow-hidden">
              
              {/* Step 01 Preview: Card Design Workshop */}
              {activeStep === 0 && (
                <div className="w-full max-w-md bg-white dark:bg-[#1A1916] rounded-2xl p-6 border border-black/10 dark:border-[rgba(228,193,116,0.3)] shadow-lg animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 text-xs font-mono text-muted-foreground">
                    <span>STEP 1: CARD BUILDER</span>
                    <span className="text-[#3027F5] dark:text-[#E4C174] font-bold">READY</span>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-[#F8F7F2] dark:bg-[#0E0E0D] border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-white dark:text-[#11100D]" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-foreground">
                          Your Business Name
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Collect 8 stamps = 1 Free Reward
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                            i <= 3
                              ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold'
                              : 'border border-dashed border-black/20 dark:border-white/20 text-black/40 dark:text-white/40'
                          }`}
                        >
                          {i <= 3 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : i}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                      <div className="text-muted-foreground">Validation Mode</div>
                      <div className="font-bold text-foreground mt-0.5">Secret 4-Digit PIN</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                      <div className="text-muted-foreground">Customer Card</div>
                      <div className="font-bold text-foreground mt-0.5">Any phone browser</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 02 Preview: Counter QR Standee Printout */}
              {activeStep === 1 && (
                <div className="w-full max-w-sm bg-white dark:bg-[#1A1916] rounded-2xl p-6 border border-black/10 dark:border-[rgba(228,193,116,0.3)] shadow-2xl text-center animate-in zoom-in-95 duration-200">
                  <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    PRINTABLE COUNTER STANDEE
                  </div>
                  <h3 className="font-heading font-black text-lg text-foreground mt-2">
                    Join Our VIP Loyalty Club
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan with your phone camera. No app download required.
                  </p>

                  <div className="my-5 inline-block p-4 bg-white rounded-xl border-2 border-black/10 dark:border-white/10 shadow-sm">
                    <QrCode className="w-32 h-32 text-[#111318]" />
                  </div>

                  <div className="text-xs font-mono font-bold tracking-wider text-[#3027F5] dark:text-[#E4C174]">
                    SCAN · STAMP · REWARD
                  </div>
                </div>
              )}

              {/* Step 03 Preview: Customer Phone Wallet Screen */}
              {activeStep === 2 && (
                <div className="w-full max-w-xs bg-black rounded-3xl p-3 border-4 border-[#222] shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="rounded-2xl bg-[#111318] text-white p-4">
                    <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                      <span>SAFARI BROWSER</span>
                      <span>5G 100%</span>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#D6FF38] text-[#111318] flex items-center justify-center mx-auto shadow-sm">
                        <Gift className="w-6 h-6 text-[#111318]" />
                      </div>
                      <div className="font-heading font-extrabold text-base mt-2">
                        Reward Ready!
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        Show to cashier to claim your free reward
                      </div>
                    </div>

                    <div className="mt-5 p-3 rounded-xl bg-white/10 text-center">
                      <div className="text-xs font-mono text-white/50 tracking-widest">
                        ONE-TIME VERIFICATION CODE
                      </div>
                      <div className="font-mono font-bold text-lg text-[#D6FF38] mt-0.5">
                        LQR-882-VIP
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
