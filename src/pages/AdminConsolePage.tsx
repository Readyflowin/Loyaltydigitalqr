import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  LogOut,
  Building2,
  LayoutTemplate,
  Ban,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Users,
  Search,
  Eye,
  X,
  Star,
  Camera,
  Music2,
  Globe,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { ThemeMode } from '../types';
import { adminApi, type AdminBusiness, type AdminHeroConfig } from '../services/adminApi';
import { DEFAULT_HERO } from '../services/siteConfigService';
import { getInstagramUrl, getTikTokUrl } from '../utils/socialUrls';
import { getProductionDomain } from '../utils/qrUrlBuilder';

interface AdminConsolePageProps {
  theme: ThemeMode;
}

const card = 'rounded-2xl border border-border bg-card shadow-sm';
const input =
  'w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-sm font-bold shadow-md hover:bg-[#2319D8] dark:hover:bg-[#EBD294] cursor-pointer disabled:opacity-60';

function formatMoney(minor: number, symbol: string): string {
  return `${symbol}${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------

export const AdminConsolePage: React.FC<AdminConsolePageProps> = () => {
  const [signedIn, setSignedIn] = useState(() => adminApi.isSignedIn());

  if (!signedIn) {
    return <LoginScreen onSignedIn={() => setSignedIn(true)} />;
  }
  return <Console onSignOut={() => setSignedIn(false)} />;
};

// ---------------------------------------------------------------------------

const LoginScreen: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(username, password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#1C1C1C]">
      <div className={`${card} w-full max-w-sm p-7`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-black text-xl text-foreground">Master Console</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted. Authorized operators only.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Username</label>
            <input
              className={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Password</label>
            <input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{busy ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

type Tab = 'businesses' | 'homepage';

const Console: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
  const [tab, setTab] = useState<Tab>('businesses');

  const signOut = () => {
    adminApi.signOut();
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-heading font-black text-base leading-tight truncate">Master Console</div>
              <div className="text-xs text-muted-foreground truncate">Loyaltydigitalqr operations</div>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1">
          <TabButton active={tab === 'businesses'} onClick={() => setTab('businesses')} icon={<Building2 className="w-4 h-4" />}>
            Businesses
          </TabButton>
          <TabButton active={tab === 'homepage'} onClick={() => setTab('homepage')} icon={<LayoutTemplate className="w-4 h-4" />}>
            Homepage content
          </TabButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'businesses' ? <BusinessesTab /> : <HomepageTab />}
      </main>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({
  active,
  onClick,
  icon,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold border-b-2 cursor-pointer -mb-px ${
      active
        ? 'border-[#3027F5] dark:border-[#E4C174] text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

// ---------------------------------------------------------------------------

const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className={`${card} p-4`}>
    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wide">{label}</div>
    <div className="font-heading font-black text-2xl mt-1">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

const StatusPill: React.FC<{ status: AdminBusiness['subscriptionStatus'] }> = ({ status }) => {
  const map: Record<AdminBusiness['subscriptionStatus'], string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    trial: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    revoked: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  };
  return <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full capitalize ${map[status]}`}>{status}</span>;
};

const BusinessesTab: React.FC = () => {
  const [businesses, setBusinesses] = useState<AdminBusiness[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [detail, setDetail] = useState<AdminBusiness | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBusinesses(await adminApi.listBusinesses());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSubscription = async (b: AdminBusiness) => {
    const next = b.subscriptionStatus === 'revoked' ? 'active' : 'revoked';
    if (next === 'revoked' && !window.confirm(`Revoke ${b.name}'s subscription? The owner will lose access to their workspace.`)) {
      return;
    }
    setBusyId(b.id);
    try {
      await adminApi.setSubscription(b.id, next);
      setBusinesses((prev) => prev?.map((x) => (x.id === b.id ? { ...x, subscriptionStatus: next } : x)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!businesses) return [];
    const q = queryText.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) => b.name.toLowerCase().includes(q) || b.ownerEmail.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
    );
  }, [businesses, queryText]);

  const totals = useMemo(() => {
    const list = businesses ?? [];
    const active = list.filter((b) => b.subscriptionStatus !== 'revoked').length;
    const revoked = list.filter((b) => b.subscriptionStatus === 'revoked').length;
    const customers = list.reduce((a, b) => a + b.customerCount, 0);
    return { total: list.length, active, revoked, customers };
  }, [businesses]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3027F5] dark:text-[#E4C174]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Businesses" value={String(totals.total)} />
        <StatCard label="Active" value={String(totals.active)} sub={`${totals.revoked} revoked`} />
        <StatCard label="Total customers" value={totals.customers.toLocaleString()} />
        <StatCard label="Showing" value={String(filtered.length)} sub="after filter" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${input} pl-9`}
            placeholder="Search name, owner email, slug…"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Desktop table */}
      <div className={`${card} overflow-hidden hidden md:block`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                <th className="font-bold px-4 py-3">Business</th>
                <th className="font-bold px-4 py-3">Owner</th>
                <th className="font-bold px-4 py-3">Plan</th>
                <th className="font-bold px-4 py-3 text-right">Transaction volume</th>
                <th className="font-bold px-4 py-3 text-right">Customers</th>
                <th className="font-bold px-4 py-3">Joined</th>
                <th className="font-bold px-4 py-3">Status</th>
                <th className="font-bold px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{b.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {b.businessType || '—'} · {b.region || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.ownerEmail || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.planName || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(b.revenueMinor, b.currencySymbol)}</td>
                  <td className="px-4 py-3 text-right">{b.customerCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3"><StatusPill status={b.subscriptionStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetail(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <SubscriptionButton business={b} busy={busyId === b.id} onToggle={() => toggleSubscription(b)} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No businesses match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((b) => (
          <div key={b.id} className={`${card} p-4 space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-foreground truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground truncate">{b.ownerEmail || '—'}</div>
              </div>
              <StatusPill status={b.subscriptionStatus} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Transaction volume</div>
                <div className="font-mono font-semibold">{formatMoney(b.revenueMinor, b.currencySymbol)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Customers</div>
                <div className="font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" />{b.customerCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Plan</div>
                <div>{b.planName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Joined</div>
                <div>{formatDate(b.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDetail(b)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
              <SubscriptionButton business={b} busy={busyId === b.id} onToggle={() => toggleSubscription(b)} full />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">No businesses match your search.</div>}
      </div>

      {detail && <BusinessDetailModal business={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

const SubscriptionButton: React.FC<{ business: AdminBusiness; busy: boolean; onToggle: () => void; full?: boolean }> = ({
  business,
  busy,
  onToggle,
  full,
}) => {
  const revoked = business.subscriptionStatus === 'revoked';
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 ${full ? 'w-full' : ''} ${
        revoked
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40'
      }`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : revoked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
      <span>{revoked ? 'Reactivate' : 'Revoke'}</span>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Business details — "who is this?" links
// ---------------------------------------------------------------------------

/** Each business type's primary public storefront page (loyalty card is separate). */
function publicPage(type: string, slug: string): { label: string; path: string } {
  if (type === 'cafe' || type === 'restaurant') return { label: 'Digital menu', path: `/menu/${slug}` };
  if (type === 'salon') return { label: 'Booking page', path: `/book/${slug}` };
  if (type === 'retail') return { label: 'Product catalogue', path: `/catalog/${slug}` };
  return { label: 'Services page', path: `/services/${slug}` };
}

const LinkRow: React.FC<{ icon: React.ReactNode; label: string; href: string; display: string; external?: boolean }> = ({
  icon,
  label,
  href,
  display,
  external,
}) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted group"
  >
    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-foreground">
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="block text-sm font-semibold text-foreground truncate">{display}</span>
    </span>
    {external && <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
  </a>
);

const BusinessDetailModal: React.FC<{ business: AdminBusiness; onClose: () => void }> = ({ business: b, onClose }) => {
  const origin = getProductionDomain();
  const page = publicPage(b.businessType, b.slug);
  const s = b.socialLinks;
  const mapsUrl = (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

  const hasGoogle = s.googleReviewEnabled && !!s.googleReviewUrl.trim();
  const hasInstagram = s.instagramEnabled && !!s.instagramHandleOrUrl.trim();
  const hasTiktok = s.tiktokEnabled && !!s.tiktokHandleOrUrl.trim();
  const noSocial = !hasGoogle && !hasInstagram && !hasTiktok;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-black text-lg truncate">{b.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {b.businessType || '—'} · {b.country || b.region || '—'} · <span className="capitalize">{b.subscriptionStatus}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* External profiles — the quickest "who is this?" */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Review & social links</h4>
            {noSocial && <p className="text-sm text-muted-foreground">No Google / social links configured by this business.</p>}
            {hasGoogle && (
              <LinkRow icon={<Star className="w-4 h-4" />} label="Google reviews / profile" href={s.googleReviewUrl} display={s.googleReviewUrl} external />
            )}
            {hasInstagram && (
              <LinkRow icon={<Camera className="w-4 h-4" />} label="Instagram" href={getInstagramUrl(s.instagramHandleOrUrl)} display={s.instagramHandleOrUrl} external />
            )}
            {hasTiktok && (
              <LinkRow icon={<Music2 className="w-4 h-4" />} label="TikTok" href={getTikTokUrl(s.tiktokHandleOrUrl)} display={s.tiktokHandleOrUrl} external />
            )}
          </section>

          {/* Their live public pages */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Public pages</h4>
            {b.slug ? (
              <>
                <LinkRow icon={<CreditCard className="w-4 h-4" />} label="Loyalty card page" href={`${origin}/card/${b.slug}`} display={`${origin}/card/${b.slug}`} external />
                <LinkRow icon={<Globe className="w-4 h-4" />} label={page.label} href={`${origin}${page.path}`} display={`${origin}${page.path}`} external />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No public slug set yet.</p>
            )}
          </section>

          {/* Contact */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Contact</h4>
            {b.ownerEmail ? (
              <LinkRow icon={<Mail className="w-4 h-4" />} label="Owner email" href={`mailto:${b.ownerEmail}`} display={b.ownerEmail} />
            ) : (
              <p className="text-sm text-muted-foreground">No owner email on file.</p>
            )}
            {b.phoneNumber && (
              <LinkRow icon={<Phone className="w-4 h-4" />} label="Phone" href={`tel:${b.phoneNumber}`} display={b.phoneNumber} />
            )}
          </section>

          {/* Locations */}
          {b.locations.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Locations</h4>
              {b.locations.map((loc, i) =>
                loc.address ? (
                  <LinkRow
                    key={i}
                    icon={<MapPin className="w-4 h-4" />}
                    label={loc.name || `Location ${i + 1}`}
                    href={mapsUrl(loc.address)}
                    display={loc.address}
                    external
                  />
                ) : (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold">{loc.name || `Location ${i + 1}`}</span>
                  </div>
                )
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const HomepageTab: React.FC = () => {
  const [hero, setHero] = useState<AdminHeroConfig>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getHero()
      .then((h) => {
        if (!cancelled && h) setHero({ ...DEFAULT_HERO, ...h });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load content');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await adminApi.setHero(hero);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof AdminHeroConfig, value: string) => setHero((h) => ({ ...h, [key]: value }));

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3027F5] dark:text-[#E4C174]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className={`${card} p-6`}>
        <h2 className="font-heading font-black text-lg">Homepage hero</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          Edit the headline and intro shown at the top of the public homepage. Leave a field blank to use the built-in default.
        </p>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Eyebrow label</label>
            <input className={input} value={hero.eyebrow} onChange={(e) => field('eyebrow', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Headline</label>
            <textarea
              className={`${input} min-h-[80px] resize-y`}
              value={hero.headline}
              onChange={(e) => field('headline', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Use line breaks to split the headline across lines.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Highlighted phrase</label>
            <input className={input} value={hero.highlight} onChange={(e) => field('highlight', e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Shown underlined, in the accent colour, on its own line.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-muted-foreground">Supporting paragraph</label>
            <textarea
              className={`${input} min-h-[90px] resize-y`}
              value={hero.paragraph}
              onChange={(e) => field('paragraph', e.target.value)}
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Saving…' : 'Save changes'}</span>
            </button>
            {saved && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Saved ✓</span>}
          </div>
        </form>
      </div>

      {/* Live preview of the headline block */}
      <div className={`${card} p-6 mt-4`}>
        <div className="text-xs font-bold uppercase text-muted-foreground mb-3">Preview</div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
          <span className="text-xs font-bold tracking-wider uppercase text-[#3027F5] dark:text-[#E4C174]">{hero.eyebrow || DEFAULT_HERO.eyebrow}</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-4xl leading-[1.02] tracking-tight">
          {(hero.headline || DEFAULT_HERO.headline).split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
          <span className="text-[#3027F5] dark:text-[#E4C174] underline decoration-[#D6FF38] dark:decoration-[#E4C174]/70 decoration-4 underline-offset-4">
            {hero.highlight || DEFAULT_HERO.highlight}
          </span>
        </h3>
        <p className="mt-3 text-sm text-muted-foreground max-w-md">{hero.paragraph || DEFAULT_HERO.paragraph}</p>
      </div>
    </div>
  );
};
