import React, { useState, useEffect } from 'react';
import {
  DashboardSidebar,
} from '../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { OverviewView } from '../components/dashboard/OverviewView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { ModulePlaceholderView } from '../components/dashboard/ModulePlaceholderView';
import { BusinessSwitcherModal } from '../components/dashboard/BusinessSwitcherModal';
import { LoyaltyProgramView } from '../components/dashboard/loyalty/LoyaltyProgramView';
import { QrStudioView } from '../components/dashboard/qr/QrStudioView';
import { CustomerCrmView } from '../components/dashboard/customers/CustomerCrmView';
import { CafeMenuView } from '../components/dashboard/cafe/CafeMenuView';
import { CafeTablesView } from '../components/dashboard/cafe/CafeTablesView';
import { CafeOrdersView } from '../components/dashboard/cafe/CafeOrdersView';
import { SalonServicesView } from '../components/dashboard/salon/SalonServicesView';
import { SalonStaffView } from '../components/dashboard/salon/SalonStaffView';
import { SalonAppointmentsView } from '../components/dashboard/salon/SalonAppointmentsView';
import { SalonCalendarView } from '../components/dashboard/salon/SalonCalendarView';
import { RetailCatalogueView } from '../components/dashboard/retail/RetailCatalogueView';
import { GymMembersView } from '../components/dashboard/gym/GymMembersView';
import { GymCheckInView } from '../components/dashboard/gym/GymCheckInView';
import { GymClassesView } from '../components/dashboard/gym/GymClassesView';
import { CarWashServicesView } from '../components/dashboard/carwash/CarWashServicesView';
import { CarWashBundlesView } from '../components/dashboard/carwash/CarWashBundlesView';
import { CarWashVisitsView } from '../components/dashboard/carwash/CarWashVisitsView';
import { GenericServicesView } from '../components/dashboard/service/GenericServicesView';
import { GenericVisitView } from '../components/dashboard/service/GenericVisitView';
import { CampaignsAndOffersView } from '../components/dashboard/growth/CampaignsAndOffersView';
import { AnalyticsView } from '../components/dashboard/growth/AnalyticsView';
import { LoyaltyCardPreview } from '../components/onboarding/LoyaltyCardPreview';
import { authService } from '../services/authService';
import { businessService } from '../services/businessService';
import { useRouter } from '../router';
import type { ThemeMode } from '../types';
import type { Business, BusinessMetrics, BusinessActivity, ChecklistItem, BusinessNotification, BusinessInvite } from '../types/business';
import { bizStore } from '../lib/bizStore';
import { VerifyEmailScreen } from '../components/auth/VerifyEmailScreen';
import type { AppUser } from '../types/auth';
import { X, Flame, Loader2 } from 'lucide-react';

interface DashboardPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

const DashboardWorkspace: React.FC<DashboardPageProps & { currentUser: AppUser }> = ({ theme, onThemeToggle, currentUser }) => {
  const { searchParams, navigate } = useRouter();

  // Active business state and reactive subscription (the gate guarantees it exists and is loaded)
  const [activeBusiness, setActiveBusiness] = useState<Business>(() => {
    return businessService.getActiveBusiness()!;
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    return businessService.getAllBusinesses();
  });

  const [metrics, setMetrics] = useState<BusinessMetrics>(() => {
    return businessService.getMetrics(businessService.getActiveBusiness()!.id);
  });

  const [activities, setActivities] = useState<BusinessActivity[]>(() => {
    return businessService.getActivities(businessService.getActiveBusiness()!.id);
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    return businessService.getChecklist(businessService.getActiveBusiness()!.id);
  });

  const [notifications, setNotifications] = useState<BusinessNotification[]>(() => {
    return businessService.getNotifications(businessService.getActiveBusiness()!.id);
  });

  // Subscribe to business switcher updates
  useEffect(() => {
    const unsubscribe = businessService.subscribe(() => {
      const active = businessService.getActiveBusiness();
      if (!active) return;
      setActiveBusiness(active);
      setBusinesses(businessService.getAllBusinesses());
      setMetrics(businessService.getMetrics(active.id));
      setActivities(businessService.getActivities(active.id));
      setNotifications(businessService.getNotifications(active.id));
      setChecklist(businessService.getChecklist(active.id));
    });
    return unsubscribe;
  }, []);

  // Supported dashboard view IDs
  const VALID_VIEWS = new Set([
    'overview',
    'settings',
    'loyalty',
    'qr-studio',
    'customers',
    'menu',
    'tables',
    'orders',
    'appointments',
    'calendar',
    'services',
    'staff',
    'catalogue',
    'members',
    'visit-tracking',
    'classes',
    'wash-services',
    'wash-bundles',
    'wash-visits',
    'service-catalogue',
    'service-visits',
    'kitchen',
    'offers',
    'analytics',
  ]);

  // UI state initialized from URL query param (?view=...) to survive page refresh
  const queryView = searchParams.get('view');
  const initialView = queryView && VALID_VIEWS.has(queryView) ? queryView : 'overview';
  const [activeView, setActiveView] = useState<string>(initialView);

  // Sync state if URL query changes (e.g. browser back/forward buttons or direct link)
  useEffect(() => {
    const v = searchParams.get('view');
    if (v && VALID_VIEWS.has(v) && v !== activeView) {
      setActiveView(v);
    } else if (!v && activeView !== 'overview') {
      setActiveView('overview');
    }
  }, [searchParams]);

  const handleSelectView = (viewId: string) => {
    setActiveView(viewId);
    const newUrl = viewId === 'overview' ? '/dashboard' : `/dashboard?view=${encodeURIComponent(viewId)}`;
    navigate(newUrl, { replace: true });
  };

  const [businessSwitcherOpen, setBusinessSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passPreviewModalOpen, setPassPreviewModalOpen] = useState(false);

  // Sign out handler
  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/login');
  };

  // Determine current page title
  const getPageTitle = () => {
    switch (activeView) {
      case 'overview':
        return 'Business Overview';
      case 'loyalty':
        return 'Digital Loyalty Program';
      case 'qr-studio':
        return 'Counter QR Standee Studio';
      case 'customers':
        return 'Customer Members';
      case 'offers':
        return 'Promotions & Offers';
      case 'analytics':
        return 'Visit Analytics';
      case 'settings':
        return 'Workspace Settings';
      case 'help':
        return 'Help & Documentation';
      case 'orders':
        return 'Café Orders Queue';
      case 'menu':
        return 'Café Digital Menu & Items';
      case 'tables':
        return 'Table QR Standees & Ordering';
      case 'kitchen':
        return 'Kitchen Display System (KDS)';
      case 'appointments':
        return 'Salon Appointments';
      case 'calendar':
        return 'Staff & Chairs Calendar';
      case 'services':
        return 'Salon Services Menu';
      case 'staff':
        return 'Stylists & Staff Profiles';
      case 'catalogue':
        return 'Product Catalogue & In-Store Sales';
      case 'members':
        return 'Gym Members & Plans';
      case 'visit-tracking':
        return 'Member Visit Terminal';
      case 'classes':
        return 'Fitness & Studio Classes';
      case 'wash-services':
        return 'Car Wash Packages & Services';
      case 'wash-bundles':
        return 'Prepaid Wash Bundles & Passes';
      case 'wash-visits':
        return 'Tunnel Check-In & Wash Redemption';
      case 'service-catalogue':
        return 'Service Offerings & Rates';
      case 'service-visits':
        return 'Service Activity & Job Terminal';
      default:
        return 'Workspace';
    }
  };

  // Render appropriate view content
  const renderViewContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewView
            business={activeBusiness}
            metrics={metrics}
            activities={activities}
            checklist={checklist}
            onNavigate={(id) => handleSelectView(id)}
            onOpenCardPreview={() => setPassPreviewModalOpen(true)}
            theme={theme}
          />
        );

      case 'settings':
        return (
          <SettingsView
            business={activeBusiness}
            theme={theme}
            onUpdateBusiness={(updated) => {
              Object.assign(activeBusiness, updated);
              setActiveBusiness({ ...activeBusiness, ...updated });
            }}
          />
        );

      case 'loyalty':
        return (
          <LoyaltyProgramView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
            onNavigateToCRM={() => handleSelectView('customers')}
            onNavigateToQR={() => handleSelectView('qr-studio')}
          />
        );

      case 'qr-studio':
        return (
          <QrStudioView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'customers':
        return (
          <CustomerCrmView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
            onNavigateToLoyalty={() => handleSelectView('loyalty')}
            onNavigateToQR={() => handleSelectView('qr-studio')}
          />
        );

      case 'menu':
        return (
          <CafeMenuView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'tables':
        return (
          <CafeTablesView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'orders':
        return (
          <CafeOrdersView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'appointments':
        return (
          <SalonAppointmentsView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'calendar':
        return (
          <SalonCalendarView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'services':
        return (
          <SalonServicesView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'staff':
        return (
          <SalonStaffView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'catalogue':
        return (
          <RetailCatalogueView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'members':
        return (
          <GymMembersView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'visit-tracking':
        return (
          <GymCheckInView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'classes':
        return (
          <GymClassesView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'wash-services':
        return (
          <CarWashServicesView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'wash-bundles':
        return (
          <CarWashBundlesView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'wash-visits':
        return (
          <CarWashVisitsView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'service-catalogue':
        return (
          <GenericServicesView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'service-visits':
        return (
          <GenericVisitView
            key={activeBusiness.id}
            businessId={activeBusiness.id}
          />
        );

      case 'kitchen':
        return (
          <div className="p-8 text-center bg-white dark:bg-[#141412] rounded-3xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-bold">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-xl text-[#111318] dark:text-[#F7F3EB]">
              Kitchen Display System (KDS)
            </h3>
            <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
              Launch the dedicated distraction-minimized display for tablet mounts or line cook stations.
            </p>
            <div>
              <button
                type="button"
                data-testid="open-kds-fullscreen"
                onClick={() => navigate('/dashboard/kitchen')}
                className="px-6 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] font-bold text-sm shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Launch Fullscreen KDS</span>
              </button>
            </div>
          </div>
        );

      case 'offers':
        return (
          <CampaignsAndOffersView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'analytics':
        return (
          <AnalyticsView
            key={activeBusiness.id}
            business={activeBusiness}
            theme={theme}
          />
        );

      case 'help':
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                SUPPORT & GUIDES
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                Merchant Help Center
              </h1>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-xs text-[#60646C] dark:text-[#D0CBC1] space-y-3">
              <p>Need assistance setting up your counter stand or onboarding additional staff?</p>
              <p>Contact merchant support: <strong>support@loyaltydigitalqr.com</strong></p>
            </div>
          </div>
        );

      // Handle any planned module
      default:
        return (
          <ModulePlaceholderView
            moduleId={activeView}
            onNavigate={(id) => handleSelectView(id)}
            theme={theme}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] transition-colors duration-200">
      
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <DashboardSidebar
          activeView={activeView}
          onSelectView={(v) => {
            if (v === 'kitchen') {
              navigate('/dashboard/kitchen');
            } else {
              handleSelectView(v);
            }
          }}
          activeBusiness={activeBusiness}
          onOpenBusinessSwitcher={() => setBusinessSwitcherOpen(true)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            <DashboardSidebar
              activeView={activeView}
              onSelectView={(v) => {
                setMobileMenuOpen(false);
                if (v === 'kitchen') {
                  navigate('/dashboard/kitchen');
                } else {
                  handleSelectView(v);
                }
              }}
              activeBusiness={activeBusiness}
              onOpenBusinessSwitcher={() => {
                setMobileMenuOpen(false);
                setBusinessSwitcherOpen(true);
              }}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <DashboardHeader
          title={getPageTitle()}
          breadcrumb="Workspace"
          theme={theme}
          onThemeToggle={onThemeToggle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeBusiness={activeBusiness}
          onQuickAction={() => handleSelectView('qr-studio')}
          notifications={notifications}
        />

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderViewContent()}
        </main>

      </div>

      {/* Business / Location Switcher Modal */}
      <BusinessSwitcherModal
        isOpen={businessSwitcherOpen}
        onClose={() => setBusinessSwitcherOpen(false)}
        businesses={businesses}
        activeBusiness={activeBusiness}
        onSelectBusiness={(bizId) => {
          businessService.setActiveBusiness(bizId);
        }}
        onSelectLocation={(bizId, locId) => {
          businessService.setActiveLocation(bizId, locId);
        }}
      />

      {/* Card Pass Preview Modal */}
      {passPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setPassPreviewModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] p-6 shadow-2xl z-10 border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#3027F5] dark:text-[#E4C174]">
                LIVE PASS PREVIEW
              </span>
              <button
                type="button"
                onClick={() => setPassPreviewModalOpen(false)}
                className="p-1 text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LoyaltyCardPreview
              businessType={activeBusiness.businessType}
              businessName={activeBusiness.name}
              programName={activeBusiness.programName}
              stampsRequired={activeBusiness.stampsRequired}
              rewardDescription={activeBusiness.rewardDescription}
              accentColor={activeBusiness.accentColor}
              theme={theme}
            />
          </div>
        </div>
      )}

    </div>
  );
};

// -----------------------------------------------------------------------------
// Gate: auth -> businesses loaded -> active business data loaded -> workspace
// -----------------------------------------------------------------------------

const GateScreen: React.FC<{ title: string; message?: string; spinner?: boolean; children?: React.ReactNode }> = ({
  title,
  message,
  spinner = true,
  children,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] p-4">
    <div className="text-center max-w-md w-full">
      {spinner && <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#3027F5] dark:text-[#E4C174]" />}
      <h2 className="text-xl font-heading font-black">{title}</h2>
      {message && <p className="text-sm text-[#60646C] dark:text-[#AAA499] mt-2">{message}</p>}
      {children}
    </div>
  </div>
);

const PendingInvitesPanel: React.FC<{ invites: BusinessInvite[]; user: AppUser }> = ({ invites, user }) => {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <GateScreen title="You have a team invite" spinner={false}>
      <div className="mt-6 space-y-3 text-left">
        {invites.map((inv) => (
          <div
            key={inv.businessId}
            className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)]"
          >
            <div className="font-heading font-bold">{inv.businessName}</div>
            <div className="text-xs text-[#60646C] dark:text-[#AAA499] mt-0.5">
              {inv.invitedByName} invited you to join as <strong>{inv.role}</strong>.
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={!!busy}
                onClick={() => run(`a_${inv.businessId}`, () => businessService.acceptInvite(inv))}
                className="flex-1 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                {busy === `a_${inv.businessId}` ? 'Joining…' : 'Accept invite'}
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => run(`d_${inv.businessId}`, () => businessService.declineInvite(inv))}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/15 font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
        {!user.emailVerified && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            Verify your email ({user.email}) before accepting an invite.
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                className="underline font-bold cursor-pointer"
                onClick={() =>
                  run('resend', async () => {
                    await authService.resendVerificationEmail();
                    setNotice('Verification email sent. Check your inbox.');
                  })
                }
              >
                Resend email
              </button>
              <button
                type="button"
                className="underline font-bold cursor-pointer"
                onClick={() => run('reload', async () => void (await authService.reloadUser()))}
              >
                I've verified
              </button>
            </div>
          </div>
        )}
        {notice && <div className="text-xs text-emerald-700 dark:text-emerald-400">{notice}</div>}
        {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}
        <button
          type="button"
          onClick={() => navigate('/onboarding?own=1')}
          className="w-full text-xs text-[#60646C] dark:text-[#AAA499] underline cursor-pointer pt-2"
        >
          Set up my own business instead
        </button>
      </div>
    </GateScreen>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const { navigate } = useRouter();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const unsubBiz = businessService.subscribe(bump);
    const unsubAuth = authService.subscribe(bump);
    return () => {
      unsubBiz();
      unsubAuth();
    };
  }, []);

  const user = authService.getCurrentUser();
  const loadState = businessService.getLoadState();
  const active = businessService.getActiveBusiness();
  const invites = businessService.getPendingInvites();
  const ready = active ? bizStore.isReady(active.id) : false;

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/dashboard', { replace: true });
    } else if (loadState === 'ready' && !active && invites.length === 0) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loadState, active, invites.length, navigate]);

  if (!user) return <GateScreen title="Redirecting to sign in…" />;
  if (!user.emailVerified) return <VerifyEmailScreen />;
  if (loadState === 'error') {
    return (
      <GateScreen
        title="We couldn't load your workspace"
        message={businessService.getLoadError() || 'Please check your connection and refresh the page.'}
        spinner={false}
      />
    );
  }
  if (loadState !== 'ready') return <GateScreen title="Loading your workspace…" />;
  if (!active) {
    if (invites.length > 0) return <PendingInvitesPanel invites={invites} user={user} />;
    return <GateScreen title="Let's set up your business…" />;
  }
  if (!ready) return <GateScreen title={`Loading ${active.name}…`} />;

  return <DashboardWorkspace key={active.id} {...props} currentUser={user} />;
};
