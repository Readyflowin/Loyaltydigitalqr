import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
  /** Icon rendered after the label. */
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-e1',
  secondary: 'bg-card text-foreground border border-border-strong hover:bg-muted',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  danger: 'bg-danger text-white hover:opacity-90 shadow-e1',
  success: 'bg-success text-white hover:opacity-90 shadow-e1',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

/**
 * The one button. Variants: primary (main action), secondary (outlined),
 * ghost (low emphasis), danger, success. Sizes: sm 32px, md 40px, lg 48px.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, icon, iconRight, fullWidth, className, children, disabled, type, ...rest },
    ref
  ) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center rounded-control font-semibold whitespace-nowrap select-none cursor-pointer',
        'transition-[background-color,box-shadow,opacity,transform] duration-150 active:translate-y-px',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
        'disabled:opacity-55 disabled:cursor-not-allowed disabled:active:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
);
Button.displayName = 'Button';
