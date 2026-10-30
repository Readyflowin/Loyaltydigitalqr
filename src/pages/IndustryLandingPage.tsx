import React from 'react';
import {
  Coffee,
  Scissors,
  Utensils,
  ShoppingBag,
  Dumbbell,
  Car,
  ArrowRight,
  Check,
  QrCode,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Link } from '../router';
import { INDUSTRIES_DATA } from '../data/industriesData';
import type { ThemeMode } from '../types';

interface IndustryLandingPageProps {
  industryId: string;
  theme: ThemeMode;
  onOpenCardBuilder: (industryId?: string) => void;
  onOpenVideoDemo: () => void;
}

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cafes: Coffee,
  restaurants: Utensils,
  salons: Scissors,
  retail: ShoppingBag,
  gyms: Dumbbell,
  carwash: Car,
};

export const IndustryLandingPage: React.FC<IndustryLandingPageProps> = ({
  industryId,
  theme,
  onOpenCardBuilder,
  onOpenVideoDemo,
}) => {
  const data = INDUSTRIES_DATA.find((item) => item.id === industryId) || INDUSTRIES_DATA[0];
  const Icon = INDUSTRY_ICONS[industryId] || Coffee;

  const getPoints = () => {
    switch (industryId) {
      case 'cafes':
        return [
          'No app for customers to download while waiting in the coffee queue',
          'Fast 3-second staff PIN stamping to prevent line bottlenecks',
          'Replace bent, lost, or water-damaged paper punch cards completely',
          'Customers earn stamps effortlessly — no app to download',
        ];
      case 'salons':
        return [
          'Encourage repeat haircut, styling, and color appointments without manual SMS',
          'Protect margins by rewarding regular grooming cycles rather than giving random discounts',
          'Staff PIN validation allows each barber or stylist to stamp instantly',
          'Clean QR standee fits perfectly on your reception counter or styling station',
        ];
      case 'restaurants':
        return [
          'Reward mid-week dining milestones and encourage repeat table reservations',
          'Print QR codes directly onto table tents, receipt slips, or takeout bags',
          'Increase average spend per cover with milestone dining perks',
          'Zero app download required for dining guests scanning from their table',
        ];
      case 'retail':
        return [
          'Reward repeat shoppers and increase average customer basket size',
          'QR touchpoint right at the cash register or on receipt slips',
          'Customers earn stamps on qualifying purchases without complex POS integration',
          'Turn neighborhood walk-ins into brand champions with digital loyalty cards',
        ];
      case 'gyms':
        return [
          'Incentivize workout streaks, class attendance, and fitness consistency',
          'Fast front-desk check-in terminal with instant member search',
          'Prevents duplicate check-ins and detects expired memberships automatically',
          'Digital membership cards open in any phone browser',
        ];
      case 'carwash':
        return [
          'Drive vehicle return cycles every 2 to 3 weeks with prepaid wash packages',
          'Scan license plates or passes right from the driver-side window',
          'Automated duplicate redemption protection with cooldown enforcement',
          'Reward regular wash bundles with ceramic wax upgrades',
        ];
      default:
        return [
          'Turn one-time visitors into repeat regulars with digital loyalty cards',
          'Zero app downloads required — works straight from mobile camera scans',
          'Instant staff PIN validation for frictionless in-person stamping',
          'Digital passes open instantly in any phone browser',
        ];
    }
  };
  const points = getPoints();

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wider text-[#60646C] dark:text-[#AAA499]">
          <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#60646C] dark:text-[#AAA499]">Industries</span>
          <span>/</span>
          <span className="text-[#111318] dark:text-[#F7F3EB] font-bold">{data.title}</span>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] shadow-xs">
              <Icon className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
              <span className="text-[11px] font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
                {data.badge} INDUSTRY SOLUTION
              </span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] leading-[1.08]">
              Digital loyalty cards for {data.title.toLowerCase()}.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#4A4D55] dark:text-[#D0CBC1] leading-relaxed max-w-xl">
              {data.subtitle} No apps to download, no expensive POS integrations, and no lost paper cards.
            </p>

            {/* Benefit Bullets */}
            <div className="mt-8 space-y-3.5">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                  </div>
                  <span className="text-sm text-[#111318] dark:text-[#F7F3EB]">
                    {pt}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenCardBuilder(industryId)}
                className={`px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/25'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
                }`} > <span>Build your {data.title.split('&')[0].trim().toLowerCase()} card</span> <ArrowRight className="w-4 h-4 stroke-[2.5]" /> </button> <button type="button" onClick={onOpenVideoDemo} className="px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.25)] text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" > Watch 1-min demo </button> </div> {/* Reassurance */} <div className="mt-6 flex items-center gap-2 text-xs text-[#60646C] dark:text-[#AAA499]"> <ShieldCheck className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> <span>30 days free · No credit card required · Instant setup</span> </div> </div> {/* Right Column: Visual Card Preview */} <div className="lg:col-span-5 flex justify-center"> <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-6 sm:p-8 shadow-xl"> <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10"> <div className="flex items-center gap-2.5"> <div className="w-9 h-9 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center"> <Icon className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div> <h3 className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB]"> Sample Program </h3> <span className="text-[10px] text-[#60646C] dark:text-[#AAA499]"> {data.stampsRequired} STAMP MILESTONE </span> </div> </div> <QrCode className="w-5 h-5 text-[#3027F5] dark:text-[#E4C174]" /> </div> <div className="my-6 p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-black/5 dark:border-[rgba(228,193,116,0.15)] text-center"> <span className="text-[10px] uppercase text-[#3027F5] dark:text-[#E4C174] font-bold"> SAMPLE REWARD </span> <p className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB] mt-1"> "{data.sampleReward}" </p> <p className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-1"> Customizable to whatever offer fits your margins </p> </div> {/* Stamp Grid Mockup */} <div className="grid grid-cols-4 gap-2 mb-6"> {Array.from({ length: data.stampsRequired }).map((_, i) => ( <div key={i} className={`h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      i < 3
                        ? theme === 'light'
                          ? 'bg-[#3027F5] text-white'
                          : 'bg-[#E4C174] text-[#11100D]'
                        : 'bg-black/5 dark:bg-white/5 text-subtle-foreground border border-black/5 dark:border-white/5'
                    }`}
                  >
                    {i < 3 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-[#60646C] dark:text-[#AAA499]">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>No app needed</span>
                </div>
                <Link
                  href="/pricing"
                  className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline"
                >
                  View pricing →
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
