import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Gift, Loader2, Moon, Sun, Info } from 'lucide-react';
import { useRouter } from '../router';
import { db } from '../lib/firebase';
import { businessService } from '../services/businessService';
import { loyaltyService } from '../services/loyaltyService';
import type { ThemeMode } from '../types';
import type { Business } from '../types/business';
import { LoyaltyCard } from '../components/ui';

interface PublicLoyaltyCardPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

interface MemberCard {
  id: string;
  firstName: string;
  currentStamps: number;
  lifetimeStamps: number;
  totalVisits: number;
  enrolledAt: string | null;
  lastVisitAt: string | null;
  rewards: Array<{
    id: string;
    rewardDescription: string;
    voucherCode: string;
    unlockedAt: string;
    isRedeemed: boolean;
    redeemedAt: string | null;
  }>;
}

const MEMBER_KEY = (businessId: string) => `loyalty_member_${businessId}`;

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-foreground text-base focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]';

/**
 * Customer-facing loyalty card.
 *   /card/:slug            join form (opened from the counter QR code)
 *   /card/:slug/:memberId  the customer's live stamp card
 */
export const PublicLoyaltyCardPage: React.FC<PublicLoyaltyCardPageProps> = ({ theme, onThemeToggle }) => {
  const { currentPath, navigate } = useRouter();
  const parts = currentPath.replace(/^\/card\/?/, '').split('/');
  const slug = decodeURIComponent(parts[0] || '');
  const memberId = parts[1] ? decodeURIComponent(parts[1]) : '';

  const business = businessService.findBusinessBySlug(slug);
  const program = business ? loyaltyService.getProgram(business.id) : null;

  // Returning customer on this device: go straight to their card.
  useEffect(() => {
    if (!business || memberId) return;
    try {
      const saved = localStorage.getItem(MEMBER_KEY(business.id));
      if (saved) navigate(`/card/${business.slug}/${saved}`, { replace: true });
    } catch {
      // storage unavailable
    }
  }, [business, memberId, navigate]);

  if (!business || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-heading font-black">Loyalty card not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be mistyped or the business is no longer active. Please scan the QR code at the counter again.
          </p>
        </div>
      </div>
    );
  }

  const accent = program.accentColor || business.accentColor || '#3027F5';
  const logoUrl = (business as typeof business & { logoUrl?: string | null }).logoUrl;

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-heading font-black text-lg overflow-hidden flex-shrink-0"
              style={{ backgroundColor: accent }}
            >
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : business.logoInitial}
            </div>
            <div className="min-w-0">
              <div className="font-heading font-black text-lg truncate">{business.name}</div>
              <div className="text-xs text-muted-foreground truncate">{program.name}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {memberId ? (
          <MemberCardView business={business} slug={business.slug} memberId={memberId} accent={accent} />
        ) : program.status !== 'active' ? (
          <div className="p-5 rounded-3xl bg-card border border-[#E5E3DB] dark:border-white/10 text-sm text-center">
            This loyalty program is paused right now. Please ask at the counter.
          </div>
        ) : (
          <JoinForm
            businessId={business.id}
            slug={business.slug}
            accent={accent}
            stampsRequired={program.stampsRequired}
            rewardDescription={program.rewardDescription}
            terms={program.terms}
          />
        )}
      </div>
    </div>
  );
};

const JoinForm: React.FC<{
  businessId: string;
  slug: string;
  accent: string;
  stampsRequired: number;
  rewardDescription: string;
  terms?: string;
}> = ({ businessId, slug, accent, stampsRequired, rewardDescription, terms }) => {
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await loyaltyService.selfEnroll(businessId, {
      name,
      phoneNumber: phone,
      email,
      marketingConsent: consent,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    try {
      localStorage.setItem(MEMBER_KEY(businessId), res.memberId);
    } catch {
      // storage unavailable: the URL itself is the card link
    }
    navigate(`/card/${slug}/${res.memberId}`, { replace: true });
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-xl">
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ backgroundColor: `${accent}14` }}>
        <Gift className="w-6 h-6 flex-shrink-0" style={{ color: accent }} />
        <div className="text-sm">
          <div className="font-bold">Collect {stampsRequired} stamps</div>
          <div className="text-muted-foreground">and get: {rewardDescription}</div>
        </div>
      </div>

      <h1 className="text-xl font-heading font-black">Join in seconds</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-5">No app needed. Staff find your card by phone number.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Your name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Mobile number</label>
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Email (optional)</label>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>I'd like to receive offers from this business by SMS/email. (Optional — you can still join without this.)</span>
        </label>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-bold text-white shadow-md cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {submitting ? 'Joining…' : 'Get my loyalty card'}
        </button>
        <p className="text-xs text-subtle-foreground text-center">
          Your details are shared only with this business to run its loyalty program.
          {terms ? ` ${terms}` : ''}
        </p>
      </form>
    </div>
  );
};

const MemberCardView: React.FC<{ business: Business; slug: string; memberId: string; accent: string }> = ({
  business,
  slug,
  memberId,
  accent,
}) => {
  const businessId = business.id;
  const { navigate } = useRouter();
  const program = loyaltyService.getProgram(businessId);
  const [card, setCard] = useState<MemberCard | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    setState('loading');
    const unsub = onSnapshot(
      doc(db, 'businesses', businessId, 'memberCards', memberId),
      (snap) => {
        if (snap.exists()) {
          setCard(snap.data() as MemberCard);
          setState('ready');
        } else {
          setState('missing');
        }
      },
      () => setState('missing')
    );
    return unsub;
  }, [businessId, memberId]);

  const forget = () => {
    try {
      localStorage.removeItem(MEMBER_KEY(businessId));
    } catch {
      // ignore
    }
    navigate(`/card/${slug}`, { replace: true });
  };

  if (state === 'loading') {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
      </div>
    );
  }

  if (state === 'missing' || !card) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-[#E5E3DB] dark:border-white/10 text-center space-y-3">
        <h2 className="font-heading font-black text-lg">Card not found</h2>
        <p className="text-sm text-muted-foreground">This card may have been removed by the business.</p>
        <button type="button" onClick={forget} className="text-sm font-bold underline cursor-pointer" style={{ color: accent }}>
          Join again
        </button>
      </div>
    );
  }

  const required = program.stampsRequired;
  const remaining = Math.max(0, required - card.currentStamps);
  const unredeemed = card.rewards.filter((r) => !r.isRedeemed);
  const memberNo = `No. ${memberId.slice(-6).toUpperCase()}`;

  return (
    <div className="space-y-4">
      <div className="text-caption font-semibold text-muted-foreground px-1">Hi {card.firstName} 👋</div>

      <LoyaltyCard
        size="full"
        businessType={business.businessType}
        businessName={business.name}
        programName={program.name}
        rewardDescription={program.rewardDescription}
        stampsRequired={required}
        currentStamps={card.currentStamps}
        accentColor={accent}
        memberCode={memberNo}
        logoUrl={(business as Business & { logoUrl?: string | null }).logoUrl}
      />

      <p className="text-sm text-muted-foreground px-1">
        {remaining === 0 ? (
          <strong className="text-foreground">Reward unlocked — show the code below at the counter.</strong>
        ) : (
          <>
            {remaining} more {remaining === 1 ? 'visit' : 'visits'} to unlock:{' '}
            <strong className="text-foreground">{program.rewardDescription}</strong>
          </>
        )}
      </p>

      {unredeemed.length > 0 && (
        <div className="rounded-3xl p-5 text-white shadow-lg" style={{ backgroundColor: accent }}>
          <div className="flex items-center gap-2 font-heading font-black text-lg">
            <Gift className="w-5 h-5" /> Reward ready!
          </div>
          {unredeemed.map((r) => (
            <div key={r.id} className="mt-3 p-3 rounded-2xl bg-white/15">
              <div className="text-sm">{r.rewardDescription}</div>
              <div className="font-mono font-black text-xl tracking-widest mt-1">{r.voucherCode}</div>
            </div>
          ))}
          <p className="text-xs mt-3 opacity-90">Show this code to staff to redeem.</p>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-muted text-xs text-muted-foreground flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          To collect a stamp, tell staff your mobile number at the counter. Bookmark this page or add it to your home screen to
          check your progress. Lifetime visits: {card.totalVisits}.
        </span>
      </div>

      <button type="button" onClick={forget} className="w-full text-xs text-subtle-foreground underline cursor-pointer">
        Not you? Use a different number
      </button>
    </div>
  );
};
