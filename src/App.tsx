import { useState, useEffect } from 'react';
import type { ThemeMode, StoreItem } from './types';
import { RouterProvider, useRouter } from './router';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CardBuilderModal } from './components/modals/CardBuilderModal';
import { VideoDemoModal } from './components/modals/VideoDemoModal';
import { RewardDetailModal } from './components/modals/RewardDetailModal';
import { INITIAL_STORES } from './data/storesData';
import { INDUSTRIES_DATA } from './data/industriesData';

// Pages
import { HomePage } from './pages/HomePage';
import { PricingSelectorPage } from './pages/PricingSelectorPage';
import { UsaPricingPage } from './pages/UsaPricingPage';
import { IndiaPricingPage } from './pages/IndiaPricingPage';
import { IndustryLandingPage } from './pages/IndustryLandingPage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicMenuPage } from './pages/PublicMenuPage';
import { PublicOrderTrackingPage } from './pages/PublicOrderTrackingPage';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage';
import { PublicBookingPage } from './pages/PublicBookingPage';
import { PublicAppointmentTrackingPage } from './pages/PublicAppointmentTrackingPage';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PublicLoyaltyCardPage } from './pages/PublicLoyaltyCardPage';
import { PublicBusinessGate } from './components/public/PublicBusinessGate';
import { parseOrderTrackingToken } from './services/orderService';
import { parseAppointmentToken } from './services/salonService';

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

    if (currentPath.startsWith('/catalog/')) {
      document.title = 'Digital Lookbook & Product Catalogue — Loyaltydigitalqr';
    if (currentPath.startsWith('/card/')) {
      document.title = 'Loyalty Card — Loyaltydigitalqr';
      return;
    }

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
        document.title = 'India Pricing (₹299/month) — Loyaltydigitalqr';
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

      {/* Interactive Modals */}
      <CardBuilderModal
        isOpen={cardBuilderOpen}
        onClose={() => setCardBuilderOpen(false)}
        theme={theme}
        initialIndustry={initialBuilderIndustry}
      />

      <VideoDemoModal
        isOpen={videoDemoOpen}
        onClose={() => setVideoDemoOpen(false)}
        theme={theme}
      />

      <RewardDetailModal
        isOpen={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        theme={theme}
        store={selectedRewardStore}
      />


    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;
