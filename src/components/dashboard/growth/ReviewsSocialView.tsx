import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Share2,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { Business, SocialLinksConfig } from '../../../types/business';
import { businessService } from '../../../services/businessService';

interface ReviewsSocialViewProps {
  business: Business;
}

/** Warns when a channel is switched on but has no link — it stays hidden on the pass until then. */
const MissingLinkNote: React.FC<{ show: boolean }> = ({ show }) =>
  show ? (
    <p className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Add a link above — this won't show on your loyalty pass until you do.</span>
    </p>
  ) : null;

export const ReviewsSocialView: React.FC<ReviewsSocialViewProps> = ({ business }) => {
  const [socialConfig, setSocialConfig] = useState<SocialLinksConfig>(() =>
    businessService.getSocialLinks(business.id)
  );
  const [taps, setTaps] = useState({ google: 0, instagram: 0, tiktok: 0, thankYou: 0 });
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = businessService.subscribe(() => {
      setSocialConfig(businessService.getSocialLinks(business.id));
    });
    return unsub;
  }, [business.id]);

  // Live tap counters (incremented by customers on the public loyalty card).
  useEffect(() => businessService.watchSocialTaps(business.id, setTaps), [business.id]);

  const handleToggle = (key: 'googleReviewEnabled' | 'instagramEnabled' | 'tiktokEnabled') => {
    setSocialConfig((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      businessService.updateSocialLinks(business.id, { [key]: updated[key] });
      return updated;
    });
    triggerSaved();
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await businessService.updateSocialLinks(business.id, socialConfig);
    setIsSaving(false);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150 max-w-6xl">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Reputation & Social</span>
            <span>·</span>
            <span className="text-[#3027F5] dark:text-[#E4C174] font-bold">Reviews & Social</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-1">
            Reviews & Social Links
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Display direct buttons on your customer loyalty cards to collect 5-star Google reviews and social followers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/card/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] bg-white dark:bg-[#2D2D2D] text-xs font-bold text-foreground flex items-center gap-2 shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Preview on Loyalty Card</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Settings saved! Your public customer card now reflects these links.</span>
        </div>
      )}

      {/* Main 2-Column Grid (Matching Image 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Link Configuration Cards (approx 7-8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Google Review Box */}
            <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    Google review button
                  </h3>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={socialConfig.googleReviewEnabled}
                  onClick={() => handleToggle('googleReviewEnabled')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    socialConfig.googleReviewEnabled
                      ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                      : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform ${
                      socialConfig.googleReviewEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Google review link
                </label>
                <input
                  type="text"
                  value={socialConfig.googleReviewUrl}
                  onChange={(e) =>
                    setSocialConfig((prev) => ({ ...prev, googleReviewUrl: e.target.value }))
                  }
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
                <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                  <span>From your Google Business Profile → "Ask for reviews" → copy link.</span>
                </p>
                <MissingLinkNote show={socialConfig.googleReviewEnabled && !socialConfig.googleReviewUrl.trim()} />
              </div>
            </div>

            {/* 2. Instagram Box */}
            <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    Instagram follow button
                  </h3>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={socialConfig.instagramEnabled}
                  onClick={() => handleToggle('instagramEnabled')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    socialConfig.instagramEnabled
                      ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                      : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform ${
                      socialConfig.instagramEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Instagram username or link
                </label>
                <input
                  type="text"
                  value={socialConfig.instagramHandleOrUrl}
                  onChange={(e) =>
                    setSocialConfig((prev) => ({ ...prev, instagramHandleOrUrl: e.target.value }))
                  }
                  placeholder="@yourshop"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
                <MissingLinkNote show={socialConfig.instagramEnabled && !socialConfig.instagramHandleOrUrl.trim()} />
              </div>
            </div>

            {/* 3. TikTok Box */}
            <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    TikTok follow button
                  </h3>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={socialConfig.tiktokEnabled}
                  onClick={() => handleToggle('tiktokEnabled')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    socialConfig.tiktokEnabled
                      ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                      : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform ${
                      socialConfig.tiktokEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  TikTok username or link
                </label>
                <input
                  type="text"
                  value={socialConfig.tiktokHandleOrUrl}
                  onChange={(e) =>
                    setSocialConfig((prev) => ({ ...prev, tiktokHandleOrUrl: e.target.value }))
                  }
                  placeholder="@yourshop"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
                <MissingLinkNote show={socialConfig.tiktokEnabled && !socialConfig.tiktokHandleOrUrl.trim()} />
              </div>
            </div>

            {/* Submit / Save action */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] font-bold text-sm shadow-md cursor-pointer transition-all"
              >
                {isSaving ? 'Saving changes…' : 'Save Links & Settings'}
              </button>

              <span className="text-xs text-muted-foreground">
                Changes apply instantly to live passes.
              </span>
            </div>

          </form>
        </div>

        {/* Right Column: Analytics & Tap Counters (Matching Image 7) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-heading font-black text-lg text-foreground">
                All-time taps
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
                Tap Tracking
              </span>
            </div>

            {/* 4 Metrics Grid (Matching Image 7) */}
            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-4 rounded-2xl bg-muted border border-border">
                <span className="text-xs uppercase text-subtle-foreground font-semibold block mb-1">
                  Thank-you screens
                </span>
                <div className="text-2xl font-heading font-black text-foreground">
                  {taps.thankYou}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted border border-border">
                <span className="text-xs uppercase text-subtle-foreground font-semibold block mb-1">
                  Google taps
                </span>
                <div className="text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
                  {taps.google}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted border border-border">
                <span className="text-xs uppercase text-subtle-foreground font-semibold block mb-1">
                  Instagram taps
                </span>
                <div className="text-2xl font-heading font-black text-pink-600 dark:text-pink-400">
                  {taps.instagram}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted border border-border">
                <span className="text-xs uppercase text-subtle-foreground font-semibold block mb-1">
                  TikTok taps
                </span>
                <div className="text-2xl font-heading font-black text-foreground">
                  {taps.tiktok}
                </div>
              </div>

            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              We count taps only. We can't see whether someone actually posted a review or followed you.
            </p>

          </div>

          {/* Placement Notice Card */}
          <div className="rounded-3xl bg-muted/70 border border-border p-5 space-y-2 text-xs text-muted-foreground">
            <div className="font-heading font-bold text-foreground flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
              <span>Where do these appear?</span>
            </div>
            <p>
              When active, responsive buttons appear below the customer's digital loyalty card when they visit your card link or ask for a stamp at the counter.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
