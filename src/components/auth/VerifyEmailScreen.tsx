import React, { useEffect, useState } from 'react';
import { MailCheck, Loader2 } from 'lucide-react';
import { useRouter } from '../../router';
import { authService, describeAuthError } from '../../services/authService';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Shown to email/password accounts until they click the link in the
 * verification email. Checks automatically every few seconds, so the user
 * can verify on their phone and this screen moves on by itself.
 */
export const VerifyEmailScreen: React.FC = () => {
  const { navigate } = useRouter();
  const email = authService.getCurrentUser()?.email || 'your email';
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Poll for verification (stops once verified: the parent re-renders without this screen).
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        authService.reloadUser().catch(() => {});
      }
    }, 4000);
    const onFocus = () => authService.reloadUser().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const checkNow = async () => {
    setChecking(true);
    setError(null);
    setNotice(null);
    try {
      const user = await authService.reloadUser();
      if (!user?.emailVerified) {
        setError("We haven't seen the confirmation yet. Click the link in the email, then try again.");
      }
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    try {
      await authService.resendVerificationEmail();
      setNotice(`A new verification email has been sent to ${email}.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(describeAuthError(err));
    }
  };

  const switchAccount = async () => {
    await authService.signOut();
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB]">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-heading font-black tracking-tight">Check your email to continue</h1>
        <p className="mt-2 text-sm text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
          We sent a verification link to <strong className="text-[#111318] dark:text-[#F7F3EB] break-all">{email}</strong>.
          Click the link, then come back here. This page continues automatically once you're verified.
        </p>
        <p className="mt-2 text-xs text-[#868A94]">Can't find it? Check your spam or promotions folder.</p>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#868A94]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Waiting for verification…</span>
        </div>

        {notice && (
          <div role="status" className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={checkNow}
          disabled={checking}
          className="mt-6 w-full py-3.5 rounded-xl font-bold text-sm bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] shadow-md cursor-pointer disabled:opacity-60"
        >
          {checking ? 'Checking…' : "I've verified my email"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="mt-3 w-full py-3 rounded-xl font-bold text-sm border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
        </button>

        <button
          type="button"
          onClick={switchAccount}
          className="mt-5 text-xs text-[#60646C] dark:text-[#AAA499] underline cursor-pointer"
        >
          Wrong email? Use a different account
        </button>
      </div>
    </div>
  );
};
