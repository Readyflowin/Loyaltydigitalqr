import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Link, useRouter } from '../../router';
import type { ThemeMode } from '../../types';

interface FooterProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
  onOpenCardBuilder: () => void;
  onOpenVideoDemo: () => void;
  onOpenLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  theme,
  onThemeToggle,
  onOpenCardBuilder: _onOpenCardBuilder,
  onOpenVideoDemo,
  onOpenLogin: _onOpenLogin,
}) => {
  const { currentPath, navigate } = useRouter();

  const handleNavAnchor = (target: string) => {
    if (currentPath === '/') {
      const el = document.getElementById(target.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/${target}`);
    }
  };

  return (
    <footer className="pt-16 pb-12 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] bg-[#F8F7F2] dark:bg-[#090909]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)]">
          
          {/* Brand Info (2 cols on md) */}
          <div className="col-span-2">
            <Logo size="md" />
            <p className="mt-4 text-sm text-[#60646C] dark:text-[#D0CBC1] max-w-sm leading-relaxed">
              A digital loyalty card your customers can join in seconds. No app. No POS integration. Just a simple reason to return.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs font-mono font-medium text-[#60646C] dark:text-[#AAA499]">
                Theme:
              </span>
              <ThemeToggle theme={theme} onToggle={onThemeToggle} />
            </div>
          </div>

          {/* Navigation Column 1: Product */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111318] dark:text-[#E4C174] uppercase">
              Product
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#60646C] dark:text-[#D0CBC1]">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavAnchor('#how-it-works')}
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer text-left"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavAnchor('#master-wallet')}
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer text-left"
                >
                  Master Loyalty Card
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenVideoDemo}
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors text-left cursor-pointer"
                >
                  Watch 1-min demo
                </button>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors inline-block"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: For Businesses */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111318] dark:text-[#E4C174] uppercase">
              Businesses
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#60646C] dark:text-[#D0CBC1]">
              <li>
                <Link
                  href="/industries/cafes"
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors inline-block"
                >
                  Cafés & Coffee Shops
                </Link>
              </li>
              <li>
                <Link
                  href="/industries/salons"
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors inline-block"
                >
                  Salons & Barbers
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavAnchor('#industries')}
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer text-left"
                >
                  All Industries
                </button>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors inline-block"
                >
                  Regional Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Account & Support */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111318] dark:text-[#E4C174] uppercase">
              Account
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#60646C] dark:text-[#D0CBC1]">
              <li>
                <Link
                  href="/signup"
                  className="hover:text-[#111318] dark:hover:text-[#EBD294] transition-colors text-left font-semibold text-[#3027F5] dark:text-[#E4C174] inline-block"
                >
                  Start Free Trial →
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors text-left inline-block"
                >
                  Merchant Log in
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavAnchor('#faq')}
                  className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer text-left"
                >
                  FAQ & Support
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#868A94] dark:text-[#AAA499]">
          <div>
            © 2026 Loyaltydigitalqr.com. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-[#111318] dark:hover:text-[#E4C174] cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-[#111318] dark:hover:text-[#E4C174] cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-[#111318] dark:hover:text-[#E4C174] cursor-pointer">
              Cookie Preferences
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
