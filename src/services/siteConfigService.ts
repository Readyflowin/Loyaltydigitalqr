/**
 * Editable marketing content for the public homepage (hero text), stored in the
 * single public document `siteConfig/home`. The master-admin console writes it
 * server-side via the Admin SDK; everyone reads it here. Missing or blank fields
 * fall back to the built-in defaults, so the homepage always renders.
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface HeroConfig {
  /** Small uppercase label above the headline. */
  eyebrow: string;
  /** Main headline; newlines render as line breaks. */
  headline: string;
  /** The coloured, underlined phrase shown on its own line under the headline. */
  highlight: string;
  /** Supporting paragraph under the headline. */
  paragraph: string;
}

export const DEFAULT_HERO: HeroConfig = {
  eyebrow: 'LOYALTY, WITHOUT THE FRICTION',
  headline: 'Give them\na reason to',
  highlight: 'come back.',
  paragraph:
    'A digital loyalty card your customers can join in seconds. No app. No POS integration. Just a simple reason to return.',
};

let cache: HeroConfig | null = null;

function mergeHero(raw: Partial<HeroConfig> | undefined): HeroConfig {
  const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
  return {
    eyebrow: pick(raw?.eyebrow, DEFAULT_HERO.eyebrow),
    headline: pick(raw?.headline, DEFAULT_HERO.headline),
    highlight: pick(raw?.highlight, DEFAULT_HERO.highlight),
    paragraph: pick(raw?.paragraph, DEFAULT_HERO.paragraph),
  };
}

/** Hero content for the homepage. Returns defaults instantly, then the saved copy. */
export function useHeroConfig(): HeroConfig {
  const [hero, setHero] = useState<HeroConfig>(cache ?? DEFAULT_HERO);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    getDoc(doc(db, 'siteConfig', 'home'))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? (snap.data() as { hero?: Partial<HeroConfig> }) : {};
        const merged = mergeHero(data.hero);
        cache = merged;
        setHero(merged);
      })
      .catch(() => {
        // Offline / rules / not configured: keep the defaults already shown.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return hero;
}
