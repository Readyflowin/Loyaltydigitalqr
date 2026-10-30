import React from 'react';
import { Link } from '../../router';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group select-none ${className}`}
      aria-label="Loyaltydigitalqr Homepage"
    >
      {/* Geometric QR-inspired brand mark */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top-left finder: rounded square with center dot */}
          <rect
            x="3"
            y="3"
            width="11"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />
          <rect
            x="6.75"
            y="6.75"
            width="3.5"
            height="3.5"
            rx="1"
            fill="currentColor"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />

          {/* Top-right finder */}
          <rect
            x="18"
            y="3"
            width="11"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />
          <circle
            cx="23.5"
            cy="8.5"
            r="1.75"
            fill="currentColor"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />

          {/* Bottom-left: solid rounded square */}
          <rect
            x="3"
            y="18"
            width="11"
            height="11"
            rx="3"
            fill="currentColor"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />
          <rect
            x="6.5"
            y="21.5"
            width="4"
            height="4"
            rx="0.75"
            fill="currentColor"
            className="text-[#F8F7F2] dark:text-[#090909]"
          />

          {/* Bottom-right: dynamic QR accent bits */}
          <rect
            x="18"
            y="18"
            width="5"
            height="5"
            rx="1.5"
            fill="currentColor"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />
          <rect
            x="24"
            y="24"
            width="5"
            height="5"
            rx="1.5"
            fill="currentColor"
            className="text-[#3027F5] dark:text-[#E4C174]"
          />
          <rect
            x="24"
            y="18"
            width="5"
            height="3"
            rx="1"
            fill="currentColor"
            className="text-[#D6FF38] dark:text-[#E4C174]"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <span
          className={`font-heading font-extrabold tracking-tight transition-colors duration-150 ${textSizes[size]}`}
        >
          <span className="text-[#111318] dark:text-[#F7F3EB]">Loyalty</span>
          <span className="text-[#3027F5] dark:text-[#E4C174]">digitalqr</span>
        </span>
      )}
    </Link>
  );
};
