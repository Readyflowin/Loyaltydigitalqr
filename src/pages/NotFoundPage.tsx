import React from 'react';
import { FileQuestion, Home, Tag, LogIn } from 'lucide-react';
import { useRouter, Link } from '../router';
import type { ThemeMode } from '../types';

interface NotFoundPageProps {
  theme: ThemeMode;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-6">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
          <FileQuestion className="w-4 h-4" />
          <span>404 — PAGE NOT FOUND</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-foreground tracking-tight">
            Lost in the digital rewards matrix?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page you requested does not exist, may have been relocated, or is an invalid route.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="px-5 py-2.5 rounded-xl bg-card hover:bg-neutral-100 dark:hover:bg-[#1E1D19] border border-border text-foreground font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Tag className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
            <span>View Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-card hover:bg-neutral-100 dark:hover:bg-[#1E1D19] border border-border text-foreground font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Merchant Login</span>
          </button>
        </div>

        {/* Quick Industry Navigation Links */}
        <div className="pt-8 border-t border-black/10 dark:border-white/10">
          <p className="text-xs text-subtle-foreground uppercase tracking-wider mb-3">
            Explore Industry Loyalty Programs
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Link
              href="/industries/cafes"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Cafés & Coffee
            </Link>
            <Link
              href="/industries/salons"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Salons & Barbers
            </Link>
            <Link
              href="/industries/retail"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Retail & Boutiques
            </Link>
            <Link
              href="/industries/gyms"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Gyms & Fitness
            </Link>
            <Link
              href="/industries/carwash"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Car Wash
            </Link>
            <Link
              href="/industries/restaurants"
              className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
            >
              Restaurants & Bistros
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
