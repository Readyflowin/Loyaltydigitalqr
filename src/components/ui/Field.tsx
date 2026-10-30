import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from './cx';

const controlBase =
  'w-full rounded-control border bg-muted text-foreground text-[15px] placeholder:text-subtle-foreground ' +
  'transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const controlBorder = (invalid?: boolean) => (invalid ? 'border-danger' : 'border-border-strong');

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }> = ({
  className,
  children,
  required,
  ...rest
}) => (
  <label className={cx('block text-label text-foreground mb-1.5', className)} {...rest}>
    {children}
    {required && (
      <span className="text-danger ml-0.5" aria-hidden="true">
        *
      </span>
    )}
  </label>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Icon shown inside the field on the left. */
  leading?: React.ReactNode;
  /** Monospace + wide tracking, for PINs and codes. */
  code?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, leading, code, className, ...rest }, ref) => (
    <div className="relative">
      {leading && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground pointer-events-none [&>svg]:w-4 [&>svg]:h-4">
          {leading}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(
          controlBase,
          controlBorder(invalid),
          'h-11 px-3.5',
          !!leading && 'pl-10',
          code && 'font-mono tracking-[0.2em] text-center',
          className
        )}
        {...rest}
      />
    </div>
  )
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ invalid, className, children, ...rest }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(controlBase, controlBorder(invalid), 'h-11 pl-3.5 pr-10 appearance-none cursor-pointer', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground pointer-events-none" />
    </div>
  )
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ invalid, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(controlBase, controlBorder(invalid), 'px-3.5 py-2.5 min-h-[96px] leading-6', className)}
      {...rest}
    />
  )
);
Textarea.displayName = 'Textarea';

/**
 * Label + control + hint/error, wired for accessibility. The child control
 * receives the generated id via render prop.
 */
export const Field: React.FC<{
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: (props: { id: string; invalid: boolean; 'aria-describedby'?: string }) => React.ReactNode;
}> = ({ label, required, hint, error, className, children }) => {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, invalid: !!error, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
