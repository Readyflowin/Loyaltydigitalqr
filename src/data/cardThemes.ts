/**
 * Visual identity for the customer loyalty card, one per business type.
 *
 * The card is a self-contained object (like a wallet pass): it carries its own
 * background and ink colours, so it looks the same whether the surrounding page
 * is light or dark. The merchant's chosen accent colour fills earned stamps and
 * the reward highlight, personalising every theme.
 */

import type { BusinessType } from '../types/onboarding';

export interface CardTheme {
  /** CSS background (gradient or solid) for the card face. */
  background: string;
  /** Primary text colour on the card. */
  ink: string;
  /** Muted text colour on the card. */
  inkMuted: string;
  /** Inset panel background (holds the stamp grid). */
  inset: string;
  /** Hairline / divider colour on the card. */
  line: string;
  /** Empty stamp cell background. */
  stampEmptyBg: string;
  /** Empty stamp icon / number colour. */
  stampEmptyInk: string;
  /** Lucide icon name used as the stamp motif. */
  stampIcon: StampIconName;
  /** What one stamp represents, e.g. "visits", "washes". */
  noun: string;
  /** Word for the remaining counter, e.g. "Remaining", "Washes left". */
  remainingLabel: string;
  /** Optional thin top band (barber stripe, etc.) as a CSS background. */
  topBand?: string;
}

export type StampIconName = 'coffee' | 'utensils' | 'scissors' | 'bag' | 'dumbbell' | 'car' | 'badge';

export const CARD_THEMES: Record<BusinessType, CardTheme> = {
  cafe: {
    background: 'linear-gradient(145deg, #3B2418 0%, #593826 100%)',
    ink: '#F6ECE0',
    inkMuted: 'rgba(246,236,224,0.62)',
    inset: 'rgba(246,236,224,0.08)',
    line: 'rgba(246,236,224,0.14)',
    stampEmptyBg: 'rgba(246,236,224,0.07)',
    stampEmptyInk: 'rgba(246,236,224,0.45)',
    stampIcon: 'coffee',
    noun: 'visits',
    remainingLabel: 'Remaining',
  },
  restaurant: {
    background: 'linear-gradient(145deg, #4A1520 0%, #6B2131 100%)',
    ink: '#F8EEE6',
    inkMuted: 'rgba(248,238,230,0.62)',
    inset: 'rgba(248,238,230,0.08)',
    line: 'rgba(248,238,230,0.14)',
    stampEmptyBg: 'rgba(248,238,230,0.07)',
    stampEmptyInk: 'rgba(248,238,230,0.45)',
    stampIcon: 'utensils',
    noun: 'visits',
    remainingLabel: 'Remaining',
  },
  salon: {
    background: 'linear-gradient(145deg, #161619 0%, #2A2A31 100%)',
    ink: '#EDE6DA',
    inkMuted: 'rgba(237,230,218,0.60)',
    inset: 'rgba(237,230,218,0.07)',
    line: 'rgba(237,230,218,0.14)',
    stampEmptyBg: 'rgba(237,230,218,0.06)',
    stampEmptyInk: 'rgba(237,230,218,0.42)',
    stampIcon: 'scissors',
    noun: 'visits',
    remainingLabel: 'Remaining',
    topBand: 'linear-gradient(90deg, #C8102E 0 33%, #F4F1EC 33% 66%, #1D4ED8 66% 100%)',
  },
  retail: {
    background: 'linear-gradient(160deg, #FBF8F3 0%, #FFFFFF 100%)',
    ink: '#17130F',
    inkMuted: '#6B6559',
    inset: '#F1EEE7',
    line: 'rgba(23,19,15,0.10)',
    stampEmptyBg: 'rgba(23,19,15,0.05)',
    stampEmptyInk: 'rgba(23,19,15,0.35)',
    stampIcon: 'bag',
    noun: 'purchases',
    remainingLabel: 'Remaining',
  },
  gym: {
    background: 'linear-gradient(150deg, #0E1013 0%, #1C2127 100%)',
    ink: '#F4F6F8',
    inkMuted: 'rgba(244,246,248,0.58)',
    inset: 'rgba(244,246,248,0.06)',
    line: 'rgba(244,246,248,0.12)',
    stampEmptyBg: 'rgba(244,246,248,0.05)',
    stampEmptyInk: 'rgba(244,246,248,0.40)',
    stampIcon: 'dumbbell',
    noun: 'workouts',
    remainingLabel: 'Remaining',
  },
  carwash: {
    background: 'linear-gradient(140deg, #0B3EA8 0%, #1DB4E8 100%)',
    ink: '#FFFFFF',
    inkMuted: 'rgba(255,255,255,0.72)',
    inset: 'rgba(255,255,255,0.15)',
    line: 'rgba(255,255,255,0.22)',
    stampEmptyBg: 'rgba(255,255,255,0.12)',
    stampEmptyInk: 'rgba(255,255,255,0.55)',
    stampIcon: 'car',
    noun: 'washes',
    remainingLabel: 'Washes left',
  },
  service: {
    background: 'linear-gradient(150deg, #1E293B 0%, #334155 100%)',
    ink: '#F8FAFC',
    inkMuted: 'rgba(248,250,252,0.60)',
    inset: 'rgba(248,250,252,0.07)',
    line: 'rgba(248,250,252,0.13)',
    stampEmptyBg: 'rgba(248,250,252,0.06)',
    stampEmptyInk: 'rgba(248,250,252,0.42)',
    stampIcon: 'badge',
    noun: 'visits',
    remainingLabel: 'Remaining',
  },
};

export function getCardTheme(type: BusinessType | undefined): CardTheme {
  return CARD_THEMES[type ?? 'cafe'] ?? CARD_THEMES.cafe;
}

/** Map loose category strings (from the homepage builder etc.) to a BusinessType. */
export function toBusinessType(category: string | undefined): BusinessType {
  switch ((category || '').toLowerCase()) {
    case 'coffee':
    case 'cafe':
    case 'café':
      return 'cafe';
    case 'dining':
    case 'restaurant':
      return 'restaurant';
    case 'salon':
    case 'barber':
      return 'salon';
    case 'retail':
    case 'boutique':
      return 'retail';
    case 'gym':
    case 'fitness':
      return 'gym';
    case 'carwash':
    case 'car wash':
      return 'carwash';
    case 'service':
      return 'service';
    default:
      return 'cafe';
  }
}

/**
 * Columns for the stamp grid, tuned so the common reward sizes lay out balanced:
 *   5 → one row of 5,  6 → 3×2,  8 → 4×2,  10 → 5×2,  12 → 6×2.
 * Keeps every card to at most two rows so the whole page fits a phone screen.
 */
export function stampColumns(count: number): number {
  if (count <= 5) return count;
  if (count === 6) return 3;
  if (count <= 8) return 4;
  if (count <= 10) return 5;
  return 6;
}
