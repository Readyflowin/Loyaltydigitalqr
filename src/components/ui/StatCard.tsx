import React from 'react';
import { cx } from './cx';

export type StatTone = 'neutral' | 'positive' | 'negative' | 'attention';

const META_TONES: Record<StatTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-success',
  negative: 'text-danger',
  attention: 'text-warning',
};

/**
 * KPI tile: label (13px) on top, value (32px, tabular, ink) in the middle,
 * meta line (13px) at the bottom. Colour only ever goes on the meta line.
 */
export const StatCard: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
  metaTone?: StatTone;
  icon?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}> = ({ label, value, meta, metaTone = 'neutral', icon, className, ...rest }) => (
  <div className={cx('rounded-card bg-card border border-border p-5 shadow-e1', className)} {...rest}>
    <div className="flex items-start justify-between gap-3">
      <span className="text-caption font-medium text-muted-foreground">{label}</span>
      {icon && (
        <span className="w-9 h-9 -mt-1 -mr-1 rounded-control bg-primary-soft text-primary flex items-center justify-center flex-shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]">
          {icon}
        </span>
      )}
    </div>
    <div className="mt-2 text-stat text-foreground tabular-nums">{value}</div>
    {meta && <div className={cx('mt-1 text-caption', META_TONES[metaTone])}>{meta}</div>}
  </div>
);
