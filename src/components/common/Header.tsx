import React, { useState } from 'react';
import { ChevronDown, Menu, X, ArrowRight, Coffee, Scissors, UtensilsCrossed, Play, HelpCircle } from 'lucide-react';
import { Logo } from './Logo';
import { Link, useRouter } from '../../router';
import type { ThemeMode } from '../../types';

interface HeaderProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
  onOpenCardBuilder: () => void;
  onOpenVideoDemo: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme: _theme,
  onThemeToggle: _onThemeToggle,
  onOpenCardBuilder: _onOpenCardBuilder,
  onOpenVideoDemo,
  onOpenLogin: _onOpenLogin,
}) => {
  const { currentPath, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessesDropdownOpen, setBusinessesDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);

  const handleNavClick = (target: string) => {
    setMobileMenuOpen(false);
    if (target.startsWith('#')) {
      if (currentPath === '/') {
        const el = document.getElementById(target.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${target}`);
      }
    } else {
      navigate(target);
    }
  };

  const isPricingActive = currentPath === '/pricing' || currentPath === '/usa' || currentPath === '/india';
  const signupHref = currentPath === '/india'
    ? '/signup?region=india&plan=starter'
    : currentPath === '/usa'
    ? '/signup?region=usa&plan=starter'
    : '/signup';

  return (
    <header className="relative w-full z-40 bg-transparent">
      {/* Full-width responsive container with 5% desktop gutters */}
      <div className="w-full max-w-[1536px] mx-auto px-6 sm:px-8 lg:px-[4.5%] xl:px-[5%]">
        <div className="flex items-center justify-between h-16 xl:h-20">
          
          {/* Logo Group */}
          <div className="flex items-center">
            <Logo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-[14px] xl:text-[15px] font-medium tracking-normal text-[#22242A] dark:text-[#E5DFD3]">
            <button
              type="button"
              onClick={() => handleNavClick('#how-it-works')}
              className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer"
            >
              How it works
            </button>

            {/* For Businesses Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setBusinessesDropdownOpen(true)}
              onMouseLeave={() => setBusinessesDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setBusinessesDropdownOpen(!businessesDropdownOpen)}
                className="inline-flex items-center gap-1 hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors focus:outline-none cursor-pointer"
                aria-expanded={businessesDropdownOpen}
              >
                <span>For businesses</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#22242A]/70 dark:text-[#B8AE9B]" />
              </button>

              {businessesDropdownOpen && (
                <div className="absolute top-full left-0 w-60 pt-2 z-50">
                  <div className="p-2.5 bg-white dark:bg-[#1A1916] rounded-2xl shadow-xl border border-[#E7E5DE] dark:border-[rgba(228,193,116,0.25)] animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/industries/cafes"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-white/5 transition-colors text-xs font-semibold text-foreground"
                      onClick={() => setBusinessesDropdownOpen(false)}
                    >
                      <Coffee className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                      <span>Cafés & Coffee Shops</span>
                    </Link>
                    <Link
                      href="/industries/salons"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-white/5 transition-colors text-xs font-semibold text-foreground"
                      onClick={() => setBusinessesDropdownOpen(false)}
                    >
                      <Scissors className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                      <span>Salons & Barbershops</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessesDropdownOpen(false);
                        handleNavClick('#industries');
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-white/5 transition-colors text-xs font-semibold text-foreground cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                      <span>All Industries</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className={`transition-colors cursor-pointer ${
                isPricingActive
                  ? 'text-[#3027F5] dark:text-[#E4C174] font-bold'
                  : 'hover:text-[#111318] dark:hover:text-[#E4C174]'
              }`}
            >
              Pricing
            </Link>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesDropdownOpen(true)}
              onMouseLeave={() => setResourcesDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                className="inline-flex items-center gap-1 hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors focus:outline-none cursor-pointer"
                aria-expanded={resourcesDropdownOpen}
              >
                <span>Resources</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#22242A]/70 dark:text-[#B8AE9B]" />
              </button>

              {resourcesDropdownOpen && (
                <div className="absolute top-full left-0 w-56 pt-2 z-50">
                  <div className="p-2.5 bg-white dark:bg-[#1A1916] rounded-2xl shadow-xl border border-[#E7E5DE] dark:border-[rgba(228,193,116,0.25)] animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setResourcesDropdownOpen(false);
                        onOpenVideoDemo();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-white/5 transition-colors text-xs font-semibold text-foreground cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                      <span>Watch 1 min demo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResourcesDropdownOpen(false);
                        handleNavClick('#faq');
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-white/5 transition-colors text-xs font-semibold text-foreground cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
                      <span>FAQ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: Exactly "Log in" and "Start Free Trial ->" */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link
              href="/login"
              className="text-[14px] xl:text-[15px] font-medium text-foreground hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors cursor-pointer"
            >
              Log in
            </Link>

            <Link
              href={signupHref}
              className="inline-flex items-center gap-1.5 px-5 xl:px-6 py-2.5 xl:py-3 rounded-full font-semibold text-[13.5px] xl:text-[14.5px] bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-sm transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 stroke-[2.5]" />
            </Link>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F8F7F2] dark:bg-[#121211] border-b border-[#E7E5DE] dark:border-[rgba(228,193,116,0.2)] px-6 py-6 shadow-xl">
          <div className="flex flex-col gap-4 text-sm font-semibold text-foreground">
            <button
              type="button"
              onClick={() => handleNavClick('#how-it-works')}
              className="text-left py-1 hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors"
            >
              How it works
            </button>
            <Link
              href="/industries/cafes"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors"
            >
              Cafés & Coffee Shops
            </Link>
            <Link
              href="/industries/salons"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors"
            >
              Salons & Barbershops
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left py-1 transition-colors ${
                isPricingActive ? 'text-[#3027F5] dark:text-[#E4C174] font-bold' : 'hover:text-[#3027F5] dark:hover:text-[#E4C174]'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-[#3027F5] dark:hover:text-[#E4C174] transition-colors"
            >
              Log in
            </Link>
            <Link
              href={signupHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-center mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
