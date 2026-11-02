/**
 * Thin client for the server-side master-admin API (POST /api/admin). The real
 * access control lives on the server; this just carries the session token the
 * login action returns. The token is kept in sessionStorage so a page refresh
 * inside the console stays signed in, but it never persists across a closed tab.
 */

export interface AdminSocialLinks {
  googleReviewEnabled: boolean;
  googleReviewUrl: string;
  instagramEnabled: boolean;
  instagramHandleOrUrl: string;
  tiktokEnabled: boolean;
  tiktokHandleOrUrl: string;
}

export interface AdminLocation {
  name: string;
  address: string;
  isPrimary: boolean;
}

export interface AdminBusiness {
  id: string;
  name: string;
  ownerEmail: string;
  region: string;
  country: string;
  businessType: string;
  planName: string;
  planPrice: string;
  subscriptionStatus: 'trial' | 'active' | 'revoked';
  currency: string;
  currencySymbol: string;
  slug: string;
  phoneNumber: string;
  createdAt: string;
  trialEndsAt: string;
  memberCount: number;
  customerCount: number;
  revenueMinor: number;
  socialLinks: AdminSocialLinks;
  locations: AdminLocation[];
}

export interface AdminHeroConfig {
  eyebrow: string;
  headline: string;
  highlight: string;
  paragraph: string;
}

const TOKEN_KEY = 'admin_session_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable: session lives only in memory for this page
  }
}

async function call<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...params }),
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    if (res.status === 401 && action !== 'login') {
      // Session expired or invalid: drop it so the console shows the login form.
      setAdminToken(null);
    }
    throw new Error((data.error as string) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const adminApi = {
  isSignedIn(): boolean {
    return !!getAdminToken();
  },

  async login(username: string, password: string): Promise<void> {
    const { token } = await call<{ token: string }>('login', { username, password });
    setAdminToken(token);
  },

  signOut(): void {
    setAdminToken(null);
  },

  async listBusinesses(): Promise<AdminBusiness[]> {
    const { businesses } = await call<{ businesses: AdminBusiness[] }>('businesses');
    return businesses;
  },

  async setSubscription(businessId: string, status: 'active' | 'revoked'): Promise<void> {
    await call('setSubscription', { businessId, status });
  },

  async getHero(): Promise<AdminHeroConfig | null> {
    const { config } = await call<{ config: { hero?: AdminHeroConfig } }>('getSiteConfig');
    return config?.hero ?? null;
  },

  async setHero(hero: AdminHeroConfig): Promise<void> {
    await call('setSiteConfig', { hero });
  },
};
