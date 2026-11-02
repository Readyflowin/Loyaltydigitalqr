import React, { useState } from 'react';
import { Star, X, Copy, Check, ExternalLink } from 'lucide-react';
import { businessService } from '../../services/businessService';
import type { Business } from '../../types/business';
import { getInstagramUrl, getTikTokUrl } from '../../utils/socialUrls';

/**
 * Shown right after a stamp request is approved at the counter. Asks the
 * customer to rate their visit, then — for a happy rating — offers a ready-made
 * Google review they can copy and post in one tap (Google doesn't support
 * pre-filling the review text via URL, so we copy it to the clipboard and open
 * the review page). A lower rating is kept private and simply thanked, so only
 * genuinely happy customers are nudged toward a public review.
 */
export const ExperienceModal: React.FC<{
  business: Business;
  open: boolean;
  onClose: () => void;
}> = ({ business, open, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [copied, setCopied] = useState(false);

  const social = businessService.getSocialLinks(business.id);
  const accent = business.accentColor || '#3027F5';

  const googleReady = social.googleReviewEnabled && !!social.googleReviewUrl?.trim();
  const instagramReady = social.instagramEnabled && !!social.instagramHandleOrUrl?.trim();
  const tiktokReady = social.tiktokEnabled && !!social.tiktokHandleOrUrl?.trim();

  const [reviewText, setReviewText] = useState(
    `Had a wonderful time at ${business.name}! Great service and a lovely experience — highly recommend. I'll definitely be back.`
  );

  if (!open) return null;

  const isHappy = rating >= 4;

  const postToGoogle = async () => {
    try {
      await navigator.clipboard?.writeText(reviewText);
      setCopied(true);
    } catch {
      // Clipboard blocked — the review text is still visible to copy manually.
    }
    void businessService.recordSocialTap(business.id, 'google');
    window.open(social.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const followSocial = (platform: 'instagram' | 'tiktok', url: string) => {
    void businessService.recordSocialTap(business.id, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="How was your experience"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Stamp added</span>
            </div>
            <h2 className="text-xl font-heading font-black text-foreground leading-tight">
              How was your experience?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              A quick rating helps {business.name} improve.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className="w-9 h-9 transition-colors"
                  style={{
                    fill: active ? accent : 'transparent',
                    color: active ? accent : 'var(--color-border-strong, #D3CFC3)',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Result step */}
        {rating === 0 ? (
          <p className="text-center text-xs text-muted-foreground">Tap a star to rate your visit.</p>
        ) : isHappy ? (
          <div className="space-y-3 animate-in fade-in duration-150">
            {googleReady ? (
              <>
                <p className="text-sm font-semibold text-foreground text-center">
                  So glad you enjoyed it! 🎉 Mind sharing it on Google?
                </p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as string]: accent }}
                />
                <p className="text-[11px] text-muted-foreground -mt-1">
                  We'll copy this for you — just paste it on Google and post.
                </p>
                <button
                  type="button"
                  onClick={postToGoogle}
                  className="w-full py-3 rounded-xl font-bold text-white shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied — opening Google…' : 'Copy & post on Google'}</span>
                </button>
              </>
            ) : (
              <p className="text-sm font-semibold text-foreground text-center">
                Thank you so much! 🎉 We're thrilled you enjoyed your visit.
              </p>
            )}

            {(instagramReady || tiktokReady) && (
              <div className="pt-1 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Stay in touch
                </div>
                {instagramReady && (
                  <button
                    type="button"
                    onClick={() => followSocial('instagram', getInstagramUrl(social.instagramHandleOrUrl))}
                    className="w-full p-2.5 rounded-xl border border-border hover:border-pink-500 bg-white dark:bg-[#2D2D2D] flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
                  >
                    <span className="flex items-center gap-2"><span>📸</span>Follow us on Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                {tiktokReady && (
                  <button
                    type="button"
                    onClick={() => followSocial('tiktok', getTikTokUrl(social.tiktokHandleOrUrl))}
                    className="w-full p-2.5 rounded-xl border border-border hover:border-black dark:hover:border-white bg-white dark:bg-[#2D2D2D] flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
                  >
                    <span className="flex items-center gap-2"><span>🎵</span>Follow us on TikTok</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-150 text-center">
            <p className="text-sm font-semibold text-foreground">
              Thank you for the honest feedback.
            </p>
            <p className="text-xs text-muted-foreground">
              We're sorry it wasn't perfect — {business.name} will use this to do better next time.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold cursor-pointer border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            >
              Done
            </button>
          </div>
        )}

        {rating > 0 && isHappy && (
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs text-subtle-foreground underline cursor-pointer"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
};
