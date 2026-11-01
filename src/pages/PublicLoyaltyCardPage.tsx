import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Gift, Loader2, Moon, Sun, Info, Stamp, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from '../router';
import { db } from '../lib/firebase';
import { businessService } from '../services/businessService';
import { loyaltyService, enrollmentRules } from '../services/loyaltyService';
import { stampRequestService } from '../services/stampRequestService';
import type { ThemeMode } from '../types';
import type { Business } from '../types/business';
import type { EnrollmentConfig, StampRequest } from '../types/loyalty';
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
/** Remembers the customer's own open request id so a re-mount never double-sends. */
const REQUEST_KEY = (businessId: string, memberId: string) => `loyalty_request_${businessId}_${memberId}`;

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

  // Returning customer on this device: go straight to their card. The bare
  // /card/:slug link is only reached by scanning the counter QR, so mark the
  // redirect as a scan — that is what auto-sends a stamp request.
  useEffect(() => {
    if (!business) return;
    try {
      const sessionKey = `visited_card_${business.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        void businessService.recordSocialTap(business.id, 'thank_you');
      }
    } catch {
      // ignore
    }

    if (memberId) return;
    try {
      const saved = localStorage.getItem(MEMBER_KEY(business.id));
      if (saved) navigate(`/card/${business.slug}/${saved}?scan=1`, { replace: true });
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
          <div className="space-y-4">
            <JoinForm
              businessId={business.id}
              slug={business.slug}
              accent={accent}
              stampsRequired={program.stampsRequired}
              rewardDescription={program.rewardDescription}
              terms={program.terms}
              enrollment={enrollmentRules(program)}
            />
            <SocialLinksBar business={business} />
          </div>
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
  enrollment: EnrollmentConfig;
}> = ({ businessId, slug, accent, stampsRequired, rewardDescription, terms, enrollment }) => {
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showMobile = enrollment.mobile !== 'off';
  const showEmail = enrollment.email !== 'off';
  // Marketing consent is only meaningful if we hold a channel to reach them on.
  const canContact = showMobile || showEmail;

  const findByLabel =
    enrollment.mobile !== 'off' && enrollment.email !== 'off'
      ? 'mobile number or email'
      : enrollment.email !== 'off' && enrollment.mobile === 'off'
        ? 'email'
        : 'mobile number';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await loyaltyService.selfEnroll(businessId, {
      name,
      phoneNumber: showMobile ? phone : undefined,
      email: showEmail ? email : undefined,
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
      <p className="text-sm text-muted-foreground mt-1 mb-5">No app needed. Staff find your card by {findByLabel}.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Your name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
        {showMobile && (
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Mobile number {enrollment.mobile === 'optional' && <span className="text-subtle-foreground font-medium normal-case">(optional)</span>}
            </label>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required={enrollment.mobile === 'required'}
            />
          </div>
        )}
        {showEmail && (
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Email {enrollment.email === 'optional' && <span className="text-subtle-foreground font-medium normal-case">(optional)</span>}
            </label>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required={enrollment.email === 'required'}
            />
          </div>
        )}
        {canContact && (
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>I'd like to receive offers from this business by SMS/email. (Optional — you can still join without this.)</span>
          </label>
        )}

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
  const { searchParams, navigate } = useRouter();
  const program = loyaltyService.getProgram(businessId);
  const [card, setCard] = useState<MemberCard | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  // Stamp-approval request state.
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<StampRequest | null>(null);
  const [sending, setSending] = useState(false);
  const autoHandled = useRef(false);
  const scan = searchParams.get('scan') === '1';
  const programActive = program.status === 'active';
  const hasPending = request?.status === 'pending';

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

  const sendRequest = React.useCallback(
    async (source: StampRequest['source']) => {
      setSending(true);
      const res = await stampRequestService.createRequest(businessId, {
        memberId,
        customerName: card?.firstName || 'Member',
        source,
      });
      setSending(false);
      if (res.success) {
        try {
          localStorage.setItem(REQUEST_KEY(businessId, memberId), res.request.id);
        } catch {
          // ignore
        }
        setOpenRequestId(res.request.id);
        setRequest(res.request);
      }
    },
    [businessId, memberId, card]
  );

  // Once the card is loaded: resume watching an open request from this device,
  // or — if the customer just scanned the counter QR — auto-send one.
  useEffect(() => {
    if (state !== 'ready' || autoHandled.current) return;
    autoHandled.current = true;
    let savedId: string | null = null;
    try {
      savedId = localStorage.getItem(REQUEST_KEY(businessId, memberId));
    } catch {
      savedId = null;
    }
    if (savedId) {
      setOpenRequestId(savedId);
    } else if (scan && programActive) {
      void sendRequest('qr_scan');
    }
  }, [state, scan, programActive, businessId, memberId, sendRequest]);

  // Watch the open request so pending → approved/declined updates live.
  useEffect(() => {
    if (!openRequestId) return;
    const unsub = stampRequestService.watchRequest(businessId, openRequestId, (r) => {
      setRequest(r);
      if (r && r.status !== 'pending') {
        try {
          localStorage.removeItem(REQUEST_KEY(businessId, memberId));
        } catch {
          // ignore
        }
      }
    });
    return unsub;
  }, [openRequestId, businessId, memberId]);

  const forget = () => {
    try {
      localStorage.removeItem(MEMBER_KEY(businessId));
      localStorage.removeItem(REQUEST_KEY(businessId, memberId));
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
        rewardExpiry={program.rewardExpiry || business.rewardExpiry || 'Never expires'}
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

      {/* Live stamp-request status */}
      {request?.status === 'pending' && (
        <div
          className="p-4 rounded-2xl flex items-center gap-3 text-sm border"
          style={{ backgroundColor: `${accent}14`, borderColor: `${accent}40` }}
          role="status"
        >
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: accent }} />
          <div>
            <div className="font-bold text-foreground">Request sent — waiting for staff…</div>
            <div className="text-xs text-muted-foreground">Keep this screen open. Your stamp lands the moment staff approve it.</div>
          </div>
        </div>
      )}
      {request?.status === 'approved' && (
        <div className="p-4 rounded-2xl flex items-center gap-3 text-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800" role="status">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="font-bold text-emerald-800 dark:text-emerald-300">
              {request.rewardUnlocked ? 'Stamp added — reward unlocked! 🎉' : 'Stamp added! 🎉'}
            </div>
            <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Your card above is up to date.</div>
          </div>
        </div>
      )}
      {request?.status === 'declined' && (
        <div className="p-4 rounded-2xl flex items-center gap-3 text-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800" role="status">
          <XCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <div className="font-bold text-amber-800 dark:text-amber-300">Request not approved</div>
            <div className="text-xs text-amber-700/80 dark:text-amber-300/80">Please check with staff at the counter.</div>
          </div>
        </div>
      )}

      {/* Ask for a stamp */}
      {programActive ? (
        <button
          type="button"
          onClick={() => sendRequest('button')}
          disabled={sending || hasPending}
          className="w-full py-3.5 rounded-xl font-bold text-white shadow-md cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: accent }}
        >
          <Stamp className="w-5 h-5" />
          <span>{hasPending ? 'Waiting for approval…' : sending ? 'Sending…' : "I'm at the counter — request a stamp"}</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-muted text-xs text-muted-foreground text-center">
          Stamping is paused right now. Please ask at the counter.
        </div>
      )}

      {/* Stay connected and leave review links (Google, Instagram, TikTok) */}
      <SocialLinksBar business={business} />

      <div className="p-4 rounded-2xl bg-muted text-xs text-muted-foreground flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Scan the counter QR or tap the button above to ask staff for a stamp — they approve it and it appears here instantly.
          Bookmark this page or add it to your home screen. Lifetime visits: {card.totalVisits}.
        </span>
      </div>

      <button type="button" onClick={forget} className="w-full text-xs text-subtle-foreground underline cursor-pointer">
        Not you? Use a different account
      </button>
    </div>
  );
};

const SocialLinksBar: React.FC<{ business: Business }> = ({ business }) => {
  const [social, setSocial] = useState(() => businessService.getSocialLinks(business.id));

  useEffect(() => {
    const unsub = businessService.subscribe(() => {
      setSocial(businessService.getSocialLinks(business.id));
    });
    return unsub;
  }, [business.id]);

  const hasAny =
    (social.googleReviewEnabled && social.googleReviewUrl?.trim()) ||
    (social.instagramEnabled && social.instagramHandleOrUrl?.trim()) ||
    (social.tiktokEnabled && social.tiktokHandleOrUrl?.trim());

  if (!hasAny) return null;

  const handleTap = (platform: 'google' | 'instagram' | 'tiktok', url: string) => {
    void businessService.recordSocialTap(business.id, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getInstagramUrl = (handleOrUrl: string) => {
    if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) return handleOrUrl;
    const clean = handleOrUrl.replace(/^@/, '');
    return `https://instagram.com/${clean}`;
  };

  const getTikTokUrl = (handleOrUrl: string) => {
    if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) return handleOrUrl;
    const clean = handleOrUrl.replace(/^@/, '');
    return `https://tiktok.com/@${clean}`;
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-4 sm:p-5 shadow-xs space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Stay Connected & Reviews
      </div>

      <div className="space-y-2">
        {social.googleReviewEnabled && social.googleReviewUrl?.trim() && (
          <button
            type="button"
            onClick={() => handleTap('google', social.googleReviewUrl)}
            className="w-full p-3 rounded-2xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] bg-white dark:bg-[#2D2D2D] flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Leave a Google Review</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}

        {social.instagramEnabled && social.instagramHandleOrUrl?.trim() && (
          <button
            type="button"
            onClick={() => handleTap('instagram', getInstagramUrl(social.instagramHandleOrUrl))}
            className="w-full p-3 rounded-2xl border border-border hover:border-pink-500 bg-white dark:bg-[#2D2D2D] flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm leading-none">📸</span>
              <span>Follow us on Instagram</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}

        {social.tiktokEnabled && social.tiktokHandleOrUrl?.trim() && (
          <button
            type="button"
            onClick={() => handleTap('tiktok', getTikTokUrl(social.tiktokHandleOrUrl))}
            className="w-full p-3 rounded-2xl border border-border hover:border-black dark:hover:border-white bg-white dark:bg-[#2D2D2D] flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm leading-none">🎵</span>
              <span>Follow us on TikTok</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
