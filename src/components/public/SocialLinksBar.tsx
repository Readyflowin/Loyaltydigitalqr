import React, { useState, useEffect } from 'react';
import { businessService } from '../../services/businessService';
import { getInstagramUrl, getTikTokUrl } from '../../utils/socialUrls';
import type { Business } from '../../types/business';

type Platform = 'google' | 'instagram' | 'tiktok';

/** Official multi-colour Google "G". */
const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

/** Official Instagram gradient glyph. */
const InstagramGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#FFDD55" />
        <stop offset="10%" stopColor="#FFDD55" />
        <stop offset="50%" stopColor="#FF543E" />
        <stop offset="100%" stopColor="#C837AB" />
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
    <rect x="6.4" y="6.4" width="11.2" height="11.2" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="16.6" cy="7.4" r="1.1" fill="#fff" />
  </svg>
);

/** Official two-tone TikTok note. */
const TikTokGlyph = () => {
  const note =
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
  return (
    <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" aria-hidden="true">
      <path d={note} fill="#25F4EE" transform="translate(-0.9,0.6)" />
      <path d={note} fill="#FE2C55" transform="translate(0.9,-0.6)" />
      <path d={note} fill="#111318" />
    </svg>
  );
};

const GLYPHS: Record<Platform, React.ReactNode> = {
  google: <GoogleGlyph />,
  instagram: <InstagramGlyph />,
  tiktok: <TikTokGlyph />,
};

/**
 * Compact review / follow bar for public customer pages (loyalty card, order
 * tracker): a single row of official-logo icon buttons, sized to keep the whole
 * card page on one mobile screen. Each tap is counted via recordSocialTap.
 * Renders nothing until the owner enables and fills at least one channel.
 */
export const SocialLinksBar: React.FC<{ business: Business; title?: string }> = ({
  business,
  title = 'Follow & review us',
}) => {
  const [social, setSocial] = useState(() => businessService.getSocialLinks(business.id));

  useEffect(() => {
    const unsub = businessService.subscribe(() => {
      setSocial(businessService.getSocialLinks(business.id));
    });
    return unsub;
  }, [business.id]);

  const links: Array<{ platform: Platform; label: string; url: string }> = [];
  if (social.googleReviewEnabled && social.googleReviewUrl?.trim()) {
    links.push({ platform: 'google', label: 'Leave a Google review', url: social.googleReviewUrl.trim() });
  }
  if (social.instagramEnabled && social.instagramHandleOrUrl?.trim()) {
    links.push({ platform: 'instagram', label: 'Follow on Instagram', url: getInstagramUrl(social.instagramHandleOrUrl.trim()) });
  }
  if (social.tiktokEnabled && social.tiktokHandleOrUrl?.trim()) {
    links.push({ platform: 'tiktok', label: 'Follow on TikTok', url: getTikTokUrl(social.tiktokHandleOrUrl.trim()) });
  }

  if (links.length === 0) return null;

  const handleTap = (platform: Platform, url: string) => {
    void businessService.recordSocialTap(business.id, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl bg-card border border-border px-4 py-2.5 flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-muted-foreground leading-tight">{title}</span>
      <div className="flex items-center gap-2.5">
        {links.map((l) => (
          <button
            key={l.platform}
            type="button"
            onClick={() => handleTap(l.platform, l.url)}
            aria-label={l.label}
            title={l.label}
            className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {GLYPHS[l.platform]}
          </button>
        ))}
      </div>
    </div>
  );
};
