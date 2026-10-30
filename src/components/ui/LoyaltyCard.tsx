import React from 'react';
import { Coffee, UtensilsCrossed, Scissors, ShoppingBag, Dumbbell, Car, BadgeCheck, Gift, QrCode } from 'lucide-react';
import type { BusinessType } from '../../types/onboarding';
import { getCardTheme, stampColumns, type StampIconName } from '../../data/cardThemes';
import { cx } from './cx';

const STAMP_ICONS: Record<StampIconName, React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>> = {
  coffee: Coffee,
  utensils: UtensilsCrossed,
  scissors: Scissors,
  bag: ShoppingBag,
  dumbbell: Dumbbell,
  car: Car,
  badge: BadgeCheck,
};

export interface LoyaltyCardProps {
  businessType?: BusinessType;
  businessName: string;
  programName: string;
  rewardDescription: string;
  stampsRequired: number;
  /** Earned stamps. Omit to show the preview default (2). */
  currentStamps?: number;
  /** Merchant brand colour; fills earned stamps and the reward accent. */
  accentColor: string;
  /** Short member number shown top-right. */
  memberCode?: string;
  logoUrl?: string | null;
  /** 'full' is larger (customer card page); 'preview' fits dashboards. */
  size?: 'preview' | 'full';
  className?: string;
}

/** Readable text colour (black/white) for content laid over `hex`. */
function onColor(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return '#fff';
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#17130F' : '#FFFFFF';
}

/**
 * The customer loyalty card. One component, one look, themed per business type
 * and tinted by the merchant's accent colour. Used by the public card page and
 * every in-app preview, so they can never drift apart again.
 */
export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  businessType,
  businessName,
  programName,
  rewardDescription,
  stampsRequired,
  currentStamps,
  accentColor,
  memberCode,
  logoUrl,
  size = 'preview',
  className,
}) => {
  const theme = getCardTheme(businessType);
  const StampIcon = STAMP_ICONS[theme.stampIcon];
  const name = businessName.trim() || 'Your Business';
  const program = programName.trim() || 'Loyalty Club';
  const reward = rewardDescription.trim() || 'A free reward after enough visits';
  const earned = currentStamps ?? Math.min(2, stampsRequired);
  const remaining = Math.max(0, stampsRequired - earned);
  const cols = stampColumns(stampsRequired);
  const full = size === 'full';
  const stampInk = onColor(accentColor);

  return (
    <div
      className={cx('relative w-full mx-auto overflow-hidden select-none', full ? 'max-w-[420px]' : 'max-w-[340px]', className)}
      style={{ background: theme.background, color: theme.ink, borderRadius: 24, boxShadow: 'var(--shadow-e3)' }}
    >
      {theme.topBand && <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.topBand }} />}

      <div className={cx(full ? 'p-6' : 'p-5', theme.topBand && 'pt-6')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="rounded-xl flex items-center justify-center font-heading font-bold overflow-hidden flex-shrink-0"
              style={{ width: full ? 44 : 38, height: full ? 44 : 38, background: accentColor, color: stampInk }}
            >
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className={cx('font-heading font-bold truncate', full ? 'text-lg' : 'text-[15px]')}>{name}</div>
              <div className="text-caption truncate" style={{ color: theme.inkMuted }}>
                {program}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            {memberCode ? (
              <span className="font-mono text-caption tracking-wide" style={{ color: theme.inkMuted }}>
                {memberCode}
              </span>
            ) : (
              <QrCode className="w-5 h-5" style={{ color: theme.inkMuted }} />
            )}
          </div>
        </div>

        {/* Stamp inset panel */}
        <div className="mt-4 rounded-[20px] p-4" style={{ background: theme.inset }}>
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            aria-label={`${earned} of ${stampsRequired} ${theme.noun} collected`}
          >
            {Array.from({ length: stampsRequired }).map((_, i) => {
              const filled = i < earned;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-full flex items-center justify-center"
                  style={
                    filled
                      ? { background: accentColor }
                      : { background: theme.stampEmptyBg, boxShadow: `inset 0 0 0 1px ${theme.line}` }
                  }
                >
                  <StampIcon
                    className={full ? 'w-5 h-5' : 'w-[18px] h-[18px]'}
                    strokeWidth={2}
                    style={{ color: filled ? stampInk : theme.stampEmptyInk }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-caption font-semibold" style={{ color: theme.inkMuted }}>
              {theme.noun.charAt(0).toUpperCase() + theme.noun.slice(1)}
            </div>
            <div className="font-heading font-bold tabular-nums leading-none mt-0.5" style={{ fontSize: full ? 28 : 24 }}>
              {String(earned).padStart(2, '0')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-caption font-semibold" style={{ color: theme.inkMuted }}>
              {theme.remainingLabel}
            </div>
            <div className="font-heading font-bold tabular-nums leading-none mt-0.5" style={{ fontSize: full ? 28 : 24 }}>
              {String(remaining).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Reward line */}
        <div className="mt-4 pt-4 flex items-start gap-2.5" style={{ borderTop: `1px solid ${theme.line}` }}>
          <span
            className="flex-shrink-0 rounded-lg flex items-center justify-center"
            style={{ width: 32, height: 32, background: accentColor, color: stampInk }}
          >
            <Gift className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.inkMuted }}>
              Reward at {stampsRequired} {theme.noun}
            </div>
            <div className={cx('font-heading font-semibold leading-snug', full ? 'text-[15px]' : 'text-sm')}>{reward}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
