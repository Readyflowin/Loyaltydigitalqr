import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { Link, useRouter } from '../router';
import { authService, describeAuthError } from '../services/authService';
import type { ThemeMode } from '../types';

interface LoginPageProps {
  theme: ThemeMode;
}

export const LoginPage: React.FC<LoginPageProps> = ({ theme }) => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const existingUser = authService.getCurrentUser();

  const goAfterSignIn = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      navigate(redirect);
    } else {
      // The dashboard sends people without a business to onboarding.
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setDemoNotice(null);
    try {
      await authService.signInWithGoogle();
      goAfterSignIn();
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setDemoNotice(null);
    try {
      await authService.signInWithEmail(email, password);
      goAfterSignIn();
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setDemoNotice(null);
    if (!email) {
      setErrorMsg('Enter your email above, then click "Forgot password?" again.');
      return;
    }
    try {
      await authService.sendPasswordReset(email);
      setDemoNotice(`If an account exists for ${email}, a password reset link has been sent.`);
    } catch (err) {
      setErrorMsg(describeAuthError(err));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 sm:py-20 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        
        {/* Top Brand Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-8 sm:p-10 shadow-xl transition-all">
          
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.3)] shadow-xs mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#111318] dark:text-[#E4C174] uppercase">
                MERCHANT PORTAL
              </span>
            </div>

            <h1 className="text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
              Welcome back.
            </h1>

            <p className="mt-2 text-sm text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
              Sign in to manage your loyalty cards, view customer stamp activity, and print counter displays.
            </p>
          </div>

          {/* Existing Session Shortcut */}
          {existingUser && (
            <div className="mt-6 p-3.5 rounded-2xl bg-[#3027F5]/5 dark:bg-[#E4C174]/10 border border-[#3027F5]/20 dark:border-[#E4C174]/25 flex items-center justify-between gap-3 text-xs">
              <div className="truncate">
                <span className="font-mono text-[10px] uppercase font-bold text-[#3027F5] dark:text-[#E4C174] block">
                  Already signed in
                </span>
                <span className="font-medium text-[#111318] dark:text-[#F7F3EB] truncate block">
                  {existingUser.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs inline-flex items-center gap-1 shadow-xs hover:opacity-90"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {demoNotice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              {demoNotice}
            </div>
          )}

          {/* Primary Action: Google sign-in */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] hover:border-[#3027F5] dark:hover:border-[#E4C174] bg-white dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Google SVG G-Mark */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Signing in…' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#141412] px-3 font-mono text-subtle-foreground dark:text-[#AAA499]">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Email + password sign-in */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@localbusiness.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase">
                  Password
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-[11px] text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-subtle-foreground absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-md'
                  : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-md'
              }`}
            >
              <span>{isLoading ? 'Signing in…' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 text-center text-xs text-[#60646C] dark:text-[#AAA499]">
            Don't have an account yet?{' '}
            <Link
              href="/signup"
              className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline"
            >
              Start 30-day free trial →
            </Link>
          </div>

        </div>

        {/* Back Link */}
        <div className="mt-6 text-center text-xs text-[#60646C] dark:text-[#AAA499]">
          <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
            ← Return to Loyaltydigitalqr Homepage
          </Link>
        </div>

      </div>
    </div>
  );
};
