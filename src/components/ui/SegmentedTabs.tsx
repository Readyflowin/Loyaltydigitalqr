import React from 'react';
import { cx } from './cx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** Pill-style segmented control (date ranges, filters). 36px tall, 14px labels. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cx('inline-flex p-1 gap-1 rounded-control bg-muted border border-border', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'h-8 px-3 rounded-[0.5rem] text-sm font-medium transition-colors cursor-pointer',
              active ? 'bg-card text-foreground shadow-e1' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
