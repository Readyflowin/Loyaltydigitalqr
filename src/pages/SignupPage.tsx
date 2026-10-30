import React, { useState } from 'react';
import { ArrowRight, Check, Lock, Mail } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { Link, useRouter } from '../router';
import { authService, describeAuthError, getDefaultOnboardingData } from '../services/authService';
import type { ThemeMode } from '../types';
import type { OperatingRegion } from '../types/onboarding';

interface SignupPageProps {
  theme: ThemeMode;
  onOpenCardBuilder?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ theme }) => {
  const { searchParams, navigate } = useRouter();
  const regionParam = searchParams.get('region');
  const region: OperatingRegion = regionParam === 'india' ? 'india' : 'usa';
  const planName = 'Starter';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pricingDetails =
    region === 'india'
      ? {
          country: 'India',
          currency: 'INR',
          priceFormatted: '₹299/month',
          switchHref: '/signup?region=usa&plan=starter',
          switchLabel: 'Switch to US ($10/month)',
        }
      : {
          country: 'United States',
          currency: 'USD',
          priceFormatted: '$10/month',
          switchHref: '/signup?region=india&plan=starter',
          switchLabel: 'Switch to India (₹299/month)',
        };

  const startOnboarding = (contactEmail: string, displayName?: string) => {
    const draft = authService.getOnboardingDraft();
    authService.saveOnboardingDraft({
      ...(draft ? {} : getDefaultOnboardingData(region, planName.toLowerCase())),
      region,
      contactEmail: draft?.contactEmail || contactEmail,
      displayName: draft?.displayName || displayName || '',
      timeZone: draft?.timeZone || (region === 'india' ? 'Asia/Kolkata' : 'America/New_York'),
    });
    navigate(`/onboarding?region=${region}&plan=${planName.toLowerCase()}`);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await authService.signInWithGoogle();
      startOnboarding(user.email, user.displayName);
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter an email and a password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await authService.signUpWithEmail(email, password, fullName);
      startOnboarding(user.email, fullName);
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 sm:py-20 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg mx-auto">
        
        {/* Top Brand Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 shadow-xl transition-all">
          
          {/* Eyebrow badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] shadow-xs mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
              <span className="text-xs font-bold tracking-wider text-[#3027F5] dark:text-[#E4C174] uppercase">
                30-DAY UNRESTRICTED FREE TRIAL
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground leading-tight">
              Set up your business for repeat customers.
            </h1>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Join local businesses replacing paper punch cards with a friction-free digital loyalty wallet.
            </p>
          </div>

          {/* Selected Region / Plan Context Callout */}
          <div className="mt-6 p-4 rounded-2xl bg-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">
                SELECTED REGIONAL PLAN
              </span>
              <div className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5">
                {planName} Plan · {pricingDetails.country} ({pricingDetails.priceFormatted})
              </div>
              <div className="text-xs text-[#3027F5] dark:text-[#E4C174] font-semibold mt-0.5">
                First 30 days are 100% free · Cancel anytime
              </div>
            </div>

            <Link
              href={pricingDetails.switchHref}
              className="text-xs font-semibold text-muted-foreground hover:text-[#111318] dark:hover:text-[#E4C174] underline self-start sm:self-auto"
            >
              {pricingDetails.switchLabel}
            </Link>
          </div>

          {errorMsg && (
            <div role="alert" className="mt-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Primary Action: Google Sign Up Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/25'
                  : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
              }`}
            >
              {/* Google SVG G-Mark */}
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <span>{isLoading ? 'Please wait…' : 'Sign up with Google'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 font-mono text-subtle-foreground dark:text-[#AAA499]">
                or sign up with work email
              </span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase mb-1">
                Your Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Patel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase mb-1">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourbusiness.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm border-2 border-[#3027F5] dark:border-[#E4C174] text-[#3027F5] dark:text-[#E4C174] hover:bg-[#3027F5]/5 dark:hover:bg-[#E4C174]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Creating account…' : 'Create account & continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Guarantees */}
          <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
              <span>No credit card required to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
              <span>Instant counter QR display generation (print-ready PDF)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
              <span>Full 30-day unrestricted trial</span>
            </div>
          </div>

          {/* Navigation to Login */}
          <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline"
            >
              Sign in to merchant portal →
            </Link>
          </div>

        </div>

        {/* Legal Disclaimers & Back Link */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-2">
          <p>
            By continuing, you agree to Loyaltydigitalqr's Terms of Service and Privacy Policy.
          </p>
          <div>
            <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
              ← Return to Loyaltydigitalqr Homepage
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
