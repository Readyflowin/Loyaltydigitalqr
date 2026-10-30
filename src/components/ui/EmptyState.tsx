import React from 'react';
import { cx } from './cx';

/** Friendly empty state: tinted icon, 16px title, 14px description, optional action. */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div className={cx('flex flex-col items-center text-center px-6 py-10 rounded-card border border-dashed border-border-strong', className)}>
    {icon && (
      <span className="w-11 h-11 rounded-control bg-primary-soft text-primary flex items-center justify-center mb-4 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </span>
    )}
    <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-body-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
