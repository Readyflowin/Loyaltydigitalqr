import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { ThemeMode, StoreItem } from './types';
import { RouterProvider, useRouter } from './router';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { INITIAL_STORES } from './data/storesData';
import { INDUSTRIES_DATA } from './data/industriesData';
import { PublicBusinessGate } from './components/public/PublicBusinessGate';
import { parseOrderTrackingToken } from './services/orderService';
import { parseAppointmentToken } from './services/salonService';

// Pages are lazy-loaded so each ships as its own chunk. A customer scanning a
// loyalty / menu QR only downloads that one public page, never the merchant
// dashboard or marketing site.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const PricingSelectorPage = lazy(() => import('./pages/PricingSelectorPage').then((m) => ({ default: m.PricingSelectorPage })));
const UsaPricingPage = lazy(() => import('./pages/UsaPricingPage').then((m) => ({ default: m.UsaPricingPage })));
const IndiaPricingPage = lazy(() => import('./pages/IndiaPricingPage').then((m) => ({ default: m.IndiaPricingPage })));
const IndustryLandingPage = lazy(() => import('./pages/IndustryLandingPage').then((m) => ({ default: m.IndustryLandingPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PublicMenuPage = lazy(() => import('./pages/PublicMenuPage').then((m) => ({ default: m.PublicMenuPage })));
const PublicOrderTrackingPage = lazy(() => import('./pages/PublicOrderTrackingPage').then((m) => ({ default: m.PublicOrderTrackingPage })));
const KitchenDisplayPage = lazy(() => import('./pages/KitchenDisplayPage').then((m) => ({ default: m.KitchenDisplayPage })));
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage').then((m) => ({ default: m.PublicBookingPage })));
const PublicAppointmentTrackingPage = lazy(() => import('./pages/PublicAppointmentTrackingPage').then((m) => ({ default: m.PublicAppointmentTrackingPage })));
const PublicCatalogPage = lazy(() => import('./pages/PublicCatalogPage').then((m) => ({ default: m.PublicCatalogPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const PublicLoyaltyCardPage = lazy(() => import('./pages/PublicLoyaltyCardPage').then((m) => ({ default: m.PublicLoyaltyCardPage })));
const PublicServicesPage = lazy(() => import('./pages/PublicServicesPage').then((m) => ({ default: m.PublicServicesPage })));
const AdminConsolePage = lazy(() => import('./pages/AdminConsolePage').then((m) => ({ default: m.AdminConsolePage })));

/**
 * Secret slug that opens the master-admin console, from VITE_ADMIN_SLUG (no
 * leading slash). Baked into the bundle, so it is only obscurity — the real
 * gate is the server credential check in /api/admin. Works on localhost and the
 * live domain alike.
 */
const ADMIN_PATH = '/' + (import.meta.env.VITE_ADMIN_SLUG || 'master-console').replace(/^\/+/, '');

// Marketing-only modals: loaded on demand, never on a public QR page.
const CardBuilderModal = lazy(() => import('./components/modals/CardBuilderModal').then((m) => ({ default: m.CardBuilderModal })));
const VideoDemoModal = lazy(() => import('./components/modals/VideoDemoModal').then((m) => ({ default: m.VideoDemoModal })));
const RewardDetailModal = lazy(() => import('./components/modals/RewardDetailModal').then((m) => ({ default: m.RewardDetailModal })));

/** Full-screen spinner shown while a route chunk loads. */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Loader2 className="w-8 h-8 animate-spin text-[#3027F5] dark:text-[#E4C174]" aria-label="Loading" />
  </div>
);

function orderWatch(token: string) {
  const parsed = parseOrderTrackingToken(token);
  return parsed ? { collection: 'orders' as const, id: parsed.orderId } : undefined;
}

function appointmentWatch(token: string) {
  const parsed = parseAppointmentToken(token);
  return parsed ? { collection: 'appointments' as const, id: parsed.appointmentId } : undefined;
}

function AppContent() {
  const { currentPath, navigate } = useRouter();

  /** First path segment after a prefix, e.g. pathSegment('/menu/') on /menu/abc -> "abc". */
  const pathSegment = (prefix: string) => decodeURIComponent(currentPath.slice(prefix.length).split('/')[0] || '');

  // Theme state: initialized from localStorage or system preference
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loyalty_theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      return 'light';
    }
    return 'light';
  });

  // Modals state
  const [cardBuilderOpen, setCardBuilderOpen] = useState(false);
  const [initialBuilderIndustry, setInitialBuilderIndustry] = useState('coffee');
  const [videoDemoOpen, setVideoDemoOpen] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedRewardStore, setSelectedRewardStore] = useState<StoreItem | null>(null);

  // Sync theme with HTML root element & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('loyalty_theme', theme);
  }, [theme]);

  // Dynamic document title based on route
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (currentPath.startsWith('/menu/')) {
      document.title = 'Digital Menu & Table Ordering — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/order/')) {
      document.title = 'Track Live Order — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/book/')) {
      document.title = 'Book Appointment — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/appointment/')) {
      document.title = 'Track Appointment — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/services/')) {
      document.title = 'Our Services — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/catalog/')) {
      document.title = 'Digital Lookbook & Product Catalogue — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/card/')) {
      document.title = 'Loyalty Card — Loyaltydigitalqr';
      return;
    }

    if (currentPath === '/dashboard/kitchen') {
      document.title = 'Kitchen Display System (KDS) — Loyaltydigitalqr';
      return;
    }

    if (currentPath.startsWith('/industries/')) {
      const slug = currentPath.replace(/^\/industries\//, '').split('/')[0];
      const ind = INDUSTRIES_DATA.find((i) => i.id === slug);
      if (ind) {
        document.title = `${ind.title} Loyalty — Loyaltydigitalqr`;
        return;
      }
    }

    switch (currentPath) {
      case '/pricing':
        document.title = 'Pricing — Loyaltydigitalqr';
        break;
      case '/usa':
        document.title = 'United States Pricing ($10/month) — Loyaltydigitalqr';
        break;
      case '/india':
        document.title = 'India Pricing (₹99/month) — Loyaltydigitalqr';
        break;
      case '/login':
        document.title = 'Log in to Merchant Portal — Loyaltydigitalqr';
        break;
      case '/signup':
        document.title = 'Set up your business — Loyaltydigitalqr';
        break;
      case '/onboarding':
        document.title = 'Business Onboarding Wizard — Loyaltydigitalqr';
        break;
      case '/dashboard':
        document.title = 'Business Workspace — Loyaltydigitalqr';
        break;
      case '/':
        document.title = 'Loyaltydigitalqr — Give them a reason to come back';
        break;
      default:
        document.title = 'Page Not Found (404) — Loyaltydigitalqr';
        break;
    }
  }, [currentPath]);

  const handleThemeToggle = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleOpenCardBuilder = (industryId?: string) => {
    if (industryId) {
      setInitialBuilderIndustry(industryId);
    }
    setCardBuilderOpen(true);
  };

  const handleViewReward = (store?: StoreItem) => {
    setSelectedRewardStore(store || INITIAL_STORES[2]); // default to Coffee Shop
    setRewardModalOpen(true);
  };

  // Render appropriate page view
  const renderRoute = () => {
    // Data-driven industry landing pages
    if (currentPath.startsWith('/industries/')) {
      const slug = currentPath.replace(/^\/industries\//, '').split('/')[0];
      const industry = INDUSTRIES_DATA.find((i) => i.id === slug);
      if (industry) {
        return (
          <IndustryLandingPage
            industryId={industry.id}
            theme={theme}
            onOpenCardBuilder={handleOpenCardBuilder}
            onOpenVideoDemo={() => setVideoDemoOpen(true)}
          />
        );
      }
      return <NotFoundPage theme={theme} />;
    }

    switch (currentPath) {
      case '/pricing':
        return (
          <PricingSelectorPage
            theme={theme}
            onOpenCardBuilder={() => handleOpenCardBuilder()}
          />
        );
      case '/usa':
        return (
          <UsaPricingPage
            theme={theme}
            onOpenCardBuilder={() => handleOpenCardBuilder()}
          />
        );
      case '/india':
        return (
          <IndiaPricingPage
            theme={theme}
            onOpenCardBuilder={() => handleOpenCardBuilder()}
          />
        );
      case '/login':
        return <LoginPage theme={theme} />;
      case '/signup':
        return (
          <SignupPage
            theme={theme}
            onOpenCardBuilder={() => handleOpenCardBuilder()}
          />
        );
      case '/onboarding':
        return <OnboardingPage theme={theme} />;
      case '/dashboard':
        return <DashboardPage theme={theme} onThemeToggle={handleThemeToggle} />;
      case '/':
        return (
          <HomePage
            theme={theme}
            onOpenCardBuilder={handleOpenCardBuilder}
            onOpenVideoDemo={() => setVideoDemoOpen(true)}
            onViewReward={handleViewReward}
          />
        );
      default:
        return <NotFoundPage theme={theme} />;
    }
  };

  // Master-admin console (secret slug). No marketing chrome, no business gate.
  if (currentPath === ADMIN_PATH) {
    return <AdminConsolePage theme={theme} />;
  }

  // Customer loyalty card: join via QR, then view stamps (/card/:slug or /card/:slug/:memberId)
  if (currentPath.startsWith('/card/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate slugOrId={pathSegment('/card/')}>
          <PublicLoyaltyCardPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on customer digital menu, render public mobile-first layout without marketing header/footer
  if (currentPath.startsWith('/menu/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate slugOrId={pathSegment('/menu/')}>
          <PublicMenuPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on customer live order tracking, render public mobile-first tracking page
  if (currentPath.startsWith('/order/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate
          slugOrId={parseOrderTrackingToken(pathSegment('/order/'))?.businessId || '-'}
          watch={orderWatch(pathSegment('/order/'))}
        >
          <PublicOrderTrackingPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on customer public booking wizard, render public mobile-first layout without marketing header/footer
  if (currentPath.startsWith('/book/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate slugOrId={pathSegment('/book/')}>
          <PublicBookingPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on customer live appointment tracking, render public mobile-first tracking page
  if (currentPath.startsWith('/appointment/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate
          slugOrId={parseAppointmentToken(pathSegment('/appointment/'))?.businessId || '-'}
          watch={appointmentWatch(pathSegment('/appointment/'))}
        >
          <PublicAppointmentTrackingPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on customer public digital catalogue, render public mobile-first lookbook
  if (currentPath.startsWith('/catalog/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate slugOrId={pathSegment('/catalog/')}>
          <PublicCatalogPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // Public storefront / services page for car washes, gyms and service businesses
  if (currentPath.startsWith('/services/')) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <PublicBusinessGate slugOrId={pathSegment('/services/')}>
          <PublicServicesPage theme={theme} onThemeToggle={handleThemeToggle} />
        </PublicBusinessGate>
      </div>
    );
  }

  // If on Kitchen Display System (KDS), render dedicated fullscreen view
  if (currentPath === '/dashboard/kitchen') {
    return (
      <div className="min-h-screen bg-[#F0EEE6] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <KitchenDisplayPage theme={theme} onThemeToggle={handleThemeToggle} />
      </div>
    );
  }

  // If on authenticated business dashboard, render workspace layout without marketing header/footer
  if (currentPath === '/dashboard') {
    return (
      <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
        <DashboardPage theme={theme} onThemeToggle={handleThemeToggle} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] dark:bg-[#1C1C1C] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
      
      {/* Shared Navigation Header */}
      <Header
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenCardBuilder={() => handleOpenCardBuilder()}
        onOpenVideoDemo={() => setVideoDemoOpen(true)}
        onOpenLogin={() => navigate('/login')}
      />

      {/* Main Content Route */}
      <main className="flex-1">
        {renderRoute()}
      </main>

      {/* Shared Footer */}
      <Footer
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenCardBuilder={() => handleOpenCardBuilder()}
        onOpenVideoDemo={() => setVideoDemoOpen(true)}
        onOpenLogin={() => navigate('/login')}
      />

      {/* Interactive Modals — lazy chunks, mounted only while open so they
          never load (or flash the page loader) until the user opens them. */}
      <Suspense fallback={null}>
        {cardBuilderOpen && (
          <CardBuilderModal
            isOpen={cardBuilderOpen}
            onClose={() => setCardBuilderOpen(false)}
            theme={theme}
            initialIndustry={initialBuilderIndustry}
          />
        )}

        {videoDemoOpen && (
          <VideoDemoModal
            isOpen={videoDemoOpen}
            onClose={() => setVideoDemoOpen(false)}
            theme={theme}
          />
        )}

        {rewardModalOpen && (
          <RewardDetailModal
            isOpen={rewardModalOpen}
            onClose={() => setRewardModalOpen(false)}
            theme={theme}
            store={selectedRewardStore}
          />
        )}
      </Suspense>


    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <Suspense fallback={<PageLoader />}>
        <AppContent />
      </Suspense>
    </RouterProvider>
  );
}

export default App;
