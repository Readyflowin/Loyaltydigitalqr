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
import { mockAuthService } from '../services/mockAuthService';
import { mockBusinessService } from '../services/mockBusinessService';
import { useRouter } from '../router';
import type { ThemeMode } from '../types';
import type { MockBusiness, MockMetrics, MockActivity, MockChecklistItem, MockNotification } from '../types/business';
import type { MockUser } from '../types/auth';
import { X, QrCode, Flame } from 'lucide-react';

interface DashboardPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ theme, onThemeToggle }) => {
  const { searchParams, navigate } = useRouter();

  // 1. Auth Guard: Check if mock session exists
  const [currentUser] = useState<MockUser | null>(() => {
    return mockAuthService.getCurrentUser();
  });

  useEffect(() => {
    const user = mockAuthService.getCurrentUser();
    if (!user) {
      navigate('/login?redirect=/dashboard');
    }
  }, [navigate]);

  // 2. Active business state and reactive subscription
  const [activeBusiness, setActiveBusiness] = useState<MockBusiness>(() => {
    return mockBusinessService.getActiveBusiness();
  });

  const [businesses, setBusinesses] = useState<MockBusiness[]>(() => {
    return mockBusinessService.getAllBusinesses();
  });

  const [metrics, setMetrics] = useState<MockMetrics>(() => {
    return mockBusinessService.getMetrics(mockBusinessService.getActiveBusiness().id);
  });

  const [activities, setActivities] = useState<MockActivity[]>(() => {
    return mockBusinessService.getActivities(mockBusinessService.getActiveBusiness().id);
  });

  const [checklist, setChecklist] = useState<MockChecklistItem[]>(() => {
    return mockBusinessService.getChecklist(mockBusinessService.getActiveBusiness().id);
  });

  const [notifications] = useState<MockNotification[]>(() => {
    return mockBusinessService.getNotifications();
  });

  // Subscribe to business switcher updates
  useEffect(() => {
    const unsubscribe = mockBusinessService.subscribe(() => {
      const active = mockBusinessService.getActiveBusiness();
      setActiveBusiness(active);
      setBusinesses(mockBusinessService.getAllBusinesses());
      setMetrics(mockBusinessService.getMetrics(active.id));
      setActivities(mockBusinessService.getActivities(active.id));
      setChecklist(mockBusinessService.getChecklist(active.id));
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
  const [qrKitModalOpen, setQrKitModalOpen] = useState(false);

  // Sign out handler
  const handleSignOut = () => {
    mockAuthService.signOut();
    navigate('/login');
  };

  // If unauthenticated, render redirect notice while hook executes
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] p-4">
        <div className="text-center max-w-sm">
          <div className="text-sm font-mono font-bold text-[#3027F5] dark:text-[#E4C174] uppercase mb-2">
            AUTHENTICATION REQUIRED
          </div>
          <h2 className="text-xl font-heading font-black">
            Redirecting to Merchant Login...
          </h2>
          <p className="text-xs text-[#60646C] dark:text-[#AAA499] mt-2">
            A valid mock merchant session is required to access this workspace.
          </p>
        </div>
      </div>
    );
  }

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
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
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
          onQuickAction={() => setQrKitModalOpen(true)}
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
          mockBusinessService.setActiveBusiness(bizId);
        }}
        onSelectLocation={(bizId, locId) => {
          mockBusinessService.setActiveLocation(bizId, locId);
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
              <span className="text-[10px] font-mono uppercase font-bold text-[#3027F5] dark:text-[#E4C174]">
                LIVE PASS PREVIEW
              </span>
              <button
                type="button"
                onClick={() => setPassPreviewModalOpen(false)}
                className="p-1 text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LoyaltyCardPreview
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

      {/* QR Kit Preview Modal */}
      {qrKitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setQrKitModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#141412] p-6 sm:p-8 shadow-2xl z-10 border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10 text-left">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#3027F5] dark:text-[#E4C174] block">
                  COUNTER KIT
                </span>
                <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                  {activeBusiness.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setQrKitModalOpen(false)}
                className="p-1 text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-36 h-36 mx-auto rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] flex items-center justify-center border border-black/10 dark:border-white/10 mb-4">
              <QrCode className="w-24 h-24 text-[#111318] dark:text-[#F7F3EB]" />
            </div>

            <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mb-6">
              Place this QR standee at your counter or checkout terminal. When customers point their smartphone camera at the code, their loyalty card opens instantly.
            </p>

            <button
              type="button"
              onClick={() => setQrKitModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm cursor-pointer shadow-md"
            >
              Close Kit Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
