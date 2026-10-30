import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoggedIn ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="mt-4 text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
              Welcome back!
            </h3>
            <p className="mt-2 text-xs text-[#60646C] dark:text-[#D0CBC1]">
              Logged in as <strong>{email || 'merchant@gooddaycoffee.com'}</strong>. Redirecting to your live analytics dashboard...
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-6 w-full py-3 rounded-xl font-bold text-sm ${
                theme === 'light'
                  ? 'bg-[#3027F5] text-white hover:bg-[#2319D8]'
                  : 'bg-[#E4C174] text-[#11100D] hover:bg-[#EBD294]'
              }`}
            >
              Continue to Merchant Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] text-[10px] font-mono font-bold uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MERCHANT PORTAL</span>
            </div>

            <h3 className="text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
              Log in to your account
            </h3>
            <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
              Access your loyalty card analytics, print QR stands, and manage reward settings.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#868A94] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase">
                    Password
                  </label>
                  <span className="text-[11px] text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#868A94] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-md'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-md'
                }`}
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 text-center text-xs text-[#60646C] dark:text-[#AAA499]">
              Don't have a program yet?{' '}
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline"
              >
                Start 30-day free trial
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
