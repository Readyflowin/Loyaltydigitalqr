import React, { useEffect, useState } from 'react';
import { Sun, Moon, Clock, Gift, ArrowRight, CalendarDays, Package, Sparkles } from 'lucide-react';
import { useRouter, Link } from '../router';
import { businessService } from '../services/businessService';
import { carWashService } from '../services/carWashService';
import { gymService } from '../services/gymService';
import { genericService } from '../services/genericService';
import { formatMinorUnits } from '../types/cafe';
import type { ThemeMode } from '../types';

interface PublicServicesPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Public storefront / services page for business types that have no menu,
 * booking or catalogue page of their own: car washes, gyms and generic
 * service businesses. Opened from the "Storefront" QR code (/services/:slug).
 */
export const PublicServicesPage: React.FC<PublicServicesPageProps> = ({ theme, onThemeToggle }) => {
  const { currentPath } = useRouter();
  const slug = decodeURIComponent(currentPath.replace(/^\/services\/?/, '').split('/')[0] || '');

  // Re-render when the relevant service's data arrives.
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsubs = [
      carWashService.subscribe(() => setVersion((v) => v + 1)),
      gymService.subscribe(() => setVersion((v) => v + 1)),
      genericService.subscribe(() => setVersion((v) => v + 1)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const business = businessService.findBusinessBySlug(slug);

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-heading font-black">Storefront not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be mistyped or the business is no longer active.
          </p>
        </div>
      </div>
    );
  }

  const accent = business.accentColor || '#3027F5';
  const currency = business.currency || 'USD';
  const location = business.locations[0];

  // Gather the sections relevant to this business type.
  const sections: { title: string; icon: React.ReactNode; items: React.ReactNode }[] = [];

  if (business.businessType === 'carwash') {
    const services = carWashService.getServices(business.id).filter((s) => s.isActive);
    const bundles = carWashService.getBundles(business.id).filter((b) => b.isActive);
    if (services.length) {
      sections.push({
        title: 'Wash Services',
        icon: <Sparkles className="w-4 h-4" />,
        items: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                name={s.name}
                description={s.description}
                price={formatMinorUnits(s.price, currency)}
                meta={`${s.durationMinutes} min · ${s.tier}`}
                accent={accent}
              />
            ))}
          </div>
        ),
      });
    }
    if (bundles.length) {
      sections.push({
        title: 'Prepaid Bundles',
        icon: <Package className="w-4 h-4" />,
        items: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bundles.map((b) => (
              <ServiceCard
                key={b.id}
                name={b.name}
                description={b.description}
                price={formatMinorUnits(b.price, currency)}
                meta={`${b.totalVisits ? `${b.totalVisits} washes` : 'Unlimited'} · valid ${b.validityDays} days`}
                accent={accent}
              />
            ))}
          </div>
        ),
      });
    }
  } else if (business.businessType === 'gym') {
    const plans = gymService.getPlans(business.id);
    const classes = gymService.getClasses(business.id).filter((c) => c.status === 'published');
    if (plans.length) {
      sections.push({
        title: 'Membership Plans',
        icon: <Package className="w-4 h-4" />,
        items: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((p) => (
              <ServiceCard
                key={p.id}
                name={p.name}
                description={p.description}
                price={formatMinorUnits(p.price, currency)}
                meta={p.durationDays ? `${p.durationDays} days` : 'Flexible'}
                accent={accent}
              />
            ))}
          </div>
        ),
      });
    }
    if (classes.length) {
      sections.push({
        title: 'Class Schedule',
        icon: <CalendarDays className="w-4 h-4" />,
        items: (
          <div className="space-y-2.5">
            {classes.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-heading font-bold text-sm text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.instructorName ? `${c.instructorName} · ` : ''}{c.room}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-foreground">{DAYS[c.dayOfWeek] || ''}</div>
                  <div className="text-xs text-muted-foreground">{c.startTime}–{c.endTime}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      });
    }
  } else {
    // Generic service business (and any other type without its own page).
    const services = genericService.getServices(business.id).filter((s) => s.isActive);
    // Group by category for a tidy storefront.
    const categories = Array.from(new Set(services.map((s) => s.category || 'Services')));
    if (services.length) {
      categories.forEach((cat) => {
        const inCat = services.filter((s) => (s.category || 'Services') === cat);
        sections.push({
          title: cat,
          icon: <Sparkles className="w-4 h-4" />,
          items: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inCat.map((s) => (
                <ServiceCard
                  key={s.id}
                  name={s.name}
                  description={s.description}
                  price={formatMinorUnits(s.price, currency)}
                  meta={s.estimatedMinutes ? `${s.estimatedMinutes} min` : undefined}
                  accent={accent}
                />
              ))}
            </div>
          ),
        });
      });
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-heading font-black text-lg flex-shrink-0"
              style={{ backgroundColor: accent }}
            >
              {business.logoInitial || business.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-heading font-black text-lg truncate">{business.name}</div>
              <div className="text-xs text-muted-foreground truncate">{location?.name || 'Our services'}</div>
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

        {/* Hero */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs mb-6">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: accent }}>
            Our Services
          </span>
          <h1 className="mt-1 text-2xl font-heading font-black text-foreground">What we offer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse everything available at {business.name}. Ask at the counter to get started.
          </p>
        </div>

        {/* Sections */}
        {sections.length === 0 ? (
          <div className="p-10 rounded-3xl bg-card border border-border text-center">
            <Clock className="w-10 h-10 mx-auto text-subtle-foreground mb-3" />
            <h2 className="font-heading font-black text-base text-foreground">Services coming soon</h2>
            <p className="text-xs text-muted-foreground mt-1">
              This business hasn't published its services yet. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section, i) => (
              <section key={i}>
                <div className="flex items-center gap-2 mb-3" style={{ color: accent }}>
                  {section.icon}
                  <h2 className="font-heading font-black text-sm uppercase tracking-wider text-foreground">
                    {section.title}
                  </h2>
                </div>
                {section.items}
              </section>
            ))}
          </div>
        )}

        {/* Loyalty CTA */}
        <Link
          href={`/card/${business.slug}`}
          className="mt-8 flex items-center justify-between gap-3 p-5 rounded-3xl text-white shadow-lg"
          style={{ backgroundColor: accent }}
        >
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6" />
            <div>
              <div className="font-heading font-black text-sm">Join our loyalty program</div>
              <div className="text-xs opacity-90">Collect stamps on every visit and earn rewards.</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </Link>

        <div className="mt-6 text-center text-xs text-subtle-foreground">Powered by Loyaltydigitalqr</div>
      </div>
    </div>
  );
};

const ServiceCard: React.FC<{
  name: string;
  description?: string;
  price: string;
  meta?: string;
  accent: string;
}> = ({ name, description, price, meta, accent }) => (
  <div className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
    <div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading font-black text-base text-foreground leading-tight">{name}</h3>
        <span className="font-heading font-black text-base text-foreground whitespace-nowrap">{price}</span>
      </div>
      {description && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">{description}</p>}
    </div>
    {meta && (
      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-xs font-semibold" style={{ color: accent }}>
        {meta}
      </div>
    )}
  </div>
);
