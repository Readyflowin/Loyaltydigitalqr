import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BusinessType } from '../../types/onboarding';
import { LoyaltyCard } from '../ui';
import { cx } from '../ui/cx';

/**
 * A coverflow-style carousel that showcases the real LoyaltyCard design for
 * every business type. One card sits centre-stage; its neighbours peek in from
 * either side, scaled back and dimmed for depth — the same stacked, auto-
 * advancing motion as the reference reel. The cards carry their own colours, so
 * they read on their own; only the stage behind them adapts to light/dark.
 */

interface CarouselCard {
  businessType: BusinessType;
  label: string;
  businessName: string;
  programName: string;
  rewardDescription: string;
  stampsRequired: number;
  currentStamps: number;
  accentColor: string;
  memberCode: string;
}

const CARDS: CarouselCard[] = [
  {
    businessType: 'cafe',
    label: 'Café',
    businessName: 'Café Aroma',
    programName: 'Coffee Club',
    rewardDescription: 'A free handcrafted drink',
    stampsRequired: 10,
    currentStamps: 5,
    accentColor: '#E4C174',
    memberCode: 'MEMBER · 014',
  },
  {
    businessType: 'restaurant',
    label: 'Restaurant',
    businessName: 'La Tavola',
    programName: 'Diners Rewards',
    rewardDescription: 'A dessert on the house',
    stampsRequired: 8,
    currentStamps: 3,
    accentColor: '#E8A33D',
    memberCode: 'MEMBER · 207',
  },
  {
    businessType: 'salon',
    label: 'Salon',
    businessName: 'Lumière Salon',
    programName: 'Style Society',
    rewardDescription: 'A complimentary blow-dry',
    stampsRequired: 6,
    currentStamps: 4,
    accentColor: '#D4AF37',
    memberCode: 'MEMBER · 046',
  },
  {
    businessType: 'retail',
    label: 'Retail',
    businessName: 'Nord & Co.',
    programName: 'Member Rewards',
    rewardDescription: '15% off your next haul',
    stampsRequired: 10,
    currentStamps: 6,
    accentColor: '#3027F5',
    memberCode: 'MEMBER · 318',
  },
  {
    businessType: 'gym',
    label: 'Gym',
    businessName: 'Iron Pulse',
    programName: 'Training Club',
    rewardDescription: 'One free PT session',
    stampsRequired: 12,
    currentStamps: 8,
    accentColor: '#84CC16',
    memberCode: 'MEMBER · 092',
  },
  {
    businessType: 'carwash',
    label: 'Car Wash',
    businessName: 'AquaShine',
    programName: 'Wash Pass',
    rewardDescription: 'A free premium wash',
    stampsRequired: 8,
    currentStamps: 4,
    accentColor: '#FACC15',
    memberCode: 'MEMBER · 155',
  },
  {
    businessType: 'service',
    label: 'Services',
    businessName: 'FixIt Pro',
    programName: 'Service Club',
    rewardDescription: 'A free diagnostic visit',
    stampsRequired: 10,
    currentStamps: 5,
    accentColor: '#38BDF8',
    memberCode: 'MEMBER · 271',
  },
];

const N = CARDS.length;
const AUTOPLAY_MS = 3200;

/** Signed circular distance from the active index, wrapped to [-N/2, N/2]. */
function circularOffset(i: number, active: number): number {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

export const CardCarousel: React.FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    setActive((a) => (a + dir + N) % N);
  }, []);

  // Autoplay, paused on hover / focus or when the user prefers reduced motion.
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % N), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Stage: soft gradient that works in both themes, with a warm centre glow */}
      <div
        className={cx(
          'relative overflow-hidden rounded-[32px] border',
          'border-[#E6E2D7] dark:border-[rgba(228,193,116,0.18)]',
          'bg-gradient-to-br from-[#EEF0FF] via-[#F8F4EC] to-[#FCEEF4]',
          'dark:from-[#1E1E1E] dark:via-[#1A1A1A] dark:to-[#201C16]',
        )}
      >
        {/* Centre glow — cobalt in light, warm gold in dark */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl bg-[radial-gradient(circle,rgba(48,39,245,0.16),transparent_62%)] dark:opacity-60 dark:bg-[radial-gradient(circle,rgba(228,193,116,0.14),transparent_62%)]"
        />

        {/* Coverflow track */}
        <div
          className="relative mx-auto h-[480px] sm:h-[500px]"
          style={{ perspective: '1600px' }}
        >
          {CARDS.map((card, i) => {
            const o = circularOffset(i, active);
            const abs = Math.abs(o);
            const visible = abs <= 2;
            // Depth: step out ~56% of a card width, shrink and dim with distance.
            const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.64;
            const opacity = abs === 0 ? 1 : abs === 1 ? 0.9 : 0.55;
            const translatePct = o * 56;
            const rotate = o * -9;
            const brightness = abs === 0 ? 1 : abs === 1 ? 0.9 : 0.78;

            return (
              <button
                key={card.businessType}
                type="button"
                aria-hidden={!visible}
                tabIndex={visible && abs !== 0 ? 0 : -1}
                aria-label={abs === 0 ? undefined : `Show ${card.label} card`}
                onClick={() => abs !== 0 && setActive(i)}
                className={cx(
                  'absolute left-1/2 top-1/2 w-[300px] sm:w-[320px] origin-center',
                  'transition-[transform,opacity,filter] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                  abs === 0 ? 'cursor-default' : 'cursor-pointer',
                  !visible && 'pointer-events-none',
                )}
                style={{
                  transform: `translate(-50%, -50%) translateX(${translatePct}%) scale(${scale}) rotateY(${rotate}deg)`,
                  opacity: visible ? opacity : 0,
                  zIndex: 20 - abs,
                  filter: `brightness(${brightness})`,
                }}
              >
                <LoyaltyCard
                  businessType={card.businessType}
                  businessName={card.businessName}
                  programName={card.programName}
                  rewardDescription={card.rewardDescription}
                  stampsRequired={card.stampsRequired}
                  currentStamps={card.currentStamps}
                  accentColor={card.accentColor}
                  memberCode={card.memberCode}
                  className="!mx-0 w-full"
                />
              </button>
            );
          })}
        </div>

        {/* Arrows */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous card"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur border border-[#E2DED3] dark:border-[rgba(228,193,116,0.28)] text-foreground shadow-md hover:scale-105 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next card"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur border border-[#E2DED3] dark:border-[rgba(228,193,116,0.28)] text-foreground shadow-md hover:scale-105 active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active label + dots */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <span className="text-sm font-heading font-bold text-foreground tracking-tight">
          {CARDS[active].label}
        </span>
        <div className="flex items-center gap-2" role="tablist" aria-label="Card designs">
          {CARDS.map((card, i) => (
            <button
              key={card.businessType}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={card.label}
              onClick={() => setActive(i)}
              className={cx(
                'h-2 rounded-full transition-all duration-300',
                i === active
                  ? 'w-7 bg-[#3027F5] dark:bg-[#E4C174]'
                  : 'w-2 bg-[#D6D2C7] dark:bg-[#3A3A3A] hover:bg-[#BDB9AD] dark:hover:bg-[#4A4A4A]',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
