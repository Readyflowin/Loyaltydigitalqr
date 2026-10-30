import React from 'react';
import { Sun, Moon } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: (newTheme: ThemeMode) => void;
  className?: string;
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onToggle(theme === 'light' ? 'dark' : 'light')}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        className={`p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174] ${
          theme === 'light'
            ? 'bg-[#E7E5DE] text-[#111318] hover:bg-[#DDD9CE]'
            : 'bg-[#1A1916] text-[#E4C174] hover:bg-[#252420] border border-[rgba(228,193,116,0.25)]'
        } ${className}`}
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={`inline-flex items-center p-1 rounded-full border transition-all duration-200 ${
        theme === 'light'
          ? 'bg-[#EAE8E1] border-[#DDD9CE]'
          : 'bg-[#141412] border-[rgba(228,193,116,0.25)]'
      } ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => onToggle('light')}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white text-[#111318] shadow-sm'
            : 'text-[#B8B2A6] hover:text-[#F7F3EB]'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => onToggle('dark')}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-[#1F1E1A] text-[#E4C174] border border-[rgba(228,193,116,0.4)] shadow-sm'
            : 'text-[#63666E] hover:text-[#111318]'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-[#E4C174]" />
        <span>Dark</span>
      </button>
    </div>
  );
};
