import React from 'react';
import { ArrowRight, Check, ShieldCheck, Globe, Store, Award, Smartphone } from 'lucide-react';
import { Link } from '../router';
import type { ThemeMode } from '../types';

interface PricingSelectorPageProps {
  theme: ThemeMode;
  onOpenCardBuilder: () => void;
}

export const PricingSelectorPage: React.FC<PricingSelectorPageProps> = ({
  theme: _theme,
  onOpenCardBuilder: _onOpenCardBuilder,
}) => {
  const commonFeatures = [
    '30-day free trial without a credit card',
    'Custom digital loyalty card with your logo & colors',
    'Print-ready counter standee QR kit (PDF export)',
    'Unlimited customer joins and visit stamps',
    'Fraud-resistant 4-digit staff PIN verification',
    'Card works in any phone browser — no app',
    'Works on any smartphone browser — no app required',
  ];

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">Pricing</span>
        </div>

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBE9E1] dark:bg-[#2D2D2D] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] shadow-xs">
            <Globe className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
            <span className="text-xs font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
              SELECT YOUR REGION
            </span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-foreground leading-[1.08]">
            Simple pricing. Built for your business.
          </h1>

          <p className="mt-4 text-base sm:text-xl text-muted-foreground leading-relaxed">
            Choose your region to see your local subscription price and plan details.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E8E6DE]/60 dark:bg-[#161614] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] text-xs text-foreground">
            <ShieldCheck className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
            <span>30 days free · No credit card required · Instant counter setup</span>
          </div>
        </div>

        {/* Region Cards Grid */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Card 1: United States */}
          <div className="relative rounded-3xl bg-card border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Region Tag */}
              <div className="flex items-center justify-between pb-6 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center font-heading font-black text-sm text-[#3027F5] dark:text-[#E4C174]">
                    US
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                      REGION
                    </span>
                    <h2 className="text-xl font-heading font-black text-foreground">
                      United States
                    </h2>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#F2F0E8] dark:bg-[#1E1D19] text-xs font-mono font-bold text-muted-foreground">
                  USD ($)
                </span>
              </div>

              {/* Price Display */}
              <div className="mt-8">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl sm:text-6xl font-heading font-black text-foreground tracking-tight">
                    $10
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-xs font-mono font-semibold text-[#3027F5] dark:text-[#E4C174]">
                  FIRST 30 DAYS FREE · NO CREDIT CARD
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Transparent single-plan pricing for coffee shops, bakeries, salons, and retail shops across North America.
                </p>
              </div>

              {/* Highlights */}
              <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 space-y-2.5">
                <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  PLAN HIGHLIGHTS:
                </div>
                {['Single flat price — no tiers', 'Unlimited loyalty members', 'Works in any phone browser'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-10">
              <Link
                href="/usa"
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 transform group-hover:-translate-y-0.5 bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-md group-hover:shadow-xl"
              >
                <span>View US pricing</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Card 2: India */}
          <div className="relative rounded-3xl bg-card border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Region Tag */}
              <div className="flex items-center justify-between pb-6 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center font-heading font-black text-sm text-[#3027F5] dark:text-[#E4C174]">
                    IN
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                      REGION
                    </span>
                    <h2 className="text-xl font-heading font-black text-foreground">
                      India
                    </h2>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#F2F0E8] dark:bg-[#1E1D19] text-xs font-mono font-bold text-muted-foreground">
                  INR (₹)
                </span>
              </div>

              {/* Price Display */}
              <div className="mt-8">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl sm:text-6xl font-heading font-black text-foreground tracking-tight">
                    ₹299
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-xs font-mono font-semibold text-[#3027F5] dark:text-[#E4C174]">
                  FIRST 30 DAYS FREE · NO CREDIT CARD
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Accessible local pricing designed for chai bars, salons, sweet shops, and retail storefronts across India.
                </p>
              </div>

              {/* Highlights */}
              <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 space-y-2.5">
                <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  PLAN HIGHLIGHTS:
                </div>
                {['Single flat price — no tiers', 'Unlimited loyalty members', 'Works in any phone browser'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-10">
              <Link
                href="/india"
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 transform group-hover:-translate-y-0.5 bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-md group-hover:shadow-xl"
              >
                <span>View India pricing</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

        </div>

        {/* Feature Comparison Guarantee */}
        <div className="mt-16 sm:mt-24 max-w-4xl mx-auto rounded-3xl bg-[#F0EEE6] dark:bg-[#242424] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                COMPLETE INCLUSION
              </span>
              <h3 className="text-2xl font-heading font-black text-foreground mt-1">
                Both regions receive the full platform
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Store className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
              <span>Independent & local businesses</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commonFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                </div>
                <span className="text-xs sm:text-sm text-foreground">
                  {feat}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
              <span>No hardware to purchase or maintain</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
              <span>Customers scan via phone camera</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
