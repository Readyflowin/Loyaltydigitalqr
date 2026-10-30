import React from 'react';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'reward';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  reward: 'bg-reward/15 text-reward',
};

/** Small status chip: 12px, semibold, pill. Use sentence or title case text. */
export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }> = ({
  tone = 'neutral',
  dot,
  className,
  children,
  ...rest
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-semibold whitespace-nowrap',
      TONES[tone],
      className
    )}
    {...rest}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
    {children}
  </span>
);
