import React from 'react';
import {
  LayoutDashboard,
  Award,
  QrCode,
  Users,
  Tag,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Utensils,
  Grid,
  Flame,
  CalendarCheck,
  Calendar,
  Scissors,
  UserCheck,
  Package,
  Activity,
  Dumbbell,
  Car,
  Droplets,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import type { Business } from '../../types/business';
import type { AppUser } from '../../types/auth';

interface DashboardSidebarProps {
  activeView: string;
  onSelectView: (viewId: string) => void;
  activeBusiness: Business;
  onOpenBusinessSwitcher: () => void;
  currentUser: AppUser | null;
  onSignOut: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isPlanned?: boolean;
  badge?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeView,
  onSelectView,
  activeBusiness,
  onOpenBusinessSwitcher,
  currentUser,
  onSignOut,
  onCloseMobile,
}) => {
  // Core navigation items common across all business workspaces
  const coreNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'loyalty', label: 'Loyalty Program', icon: Award },
    { id: 'qr-studio', label: 'QR Studio', icon: QrCode },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'offers', label: 'Offers & Promos', icon: Tag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Industry-specific module items based on active business type
  const getIndustryNavItems = (): NavItem[] => {
    switch (activeBusiness.businessType) {
      case 'cafe':
      case 'restaurant':
        return [
          { id: 'orders', label: 'Orders', icon: ShoppingBag },
          { id: 'menu', label: 'Menu & Items', icon: Utensils },
          { id: 'tables', label: 'Tables & QR', icon: Grid },
          { id: 'kitchen', label: 'Kitchen Display', icon: Flame },
        ];
      case 'salon':
        return [
          { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
          { id: 'calendar', label: 'Staff Calendar', icon: Calendar },
          { id: 'services', label: 'Service Menu', icon: Scissors },
          { id: 'staff', label: 'Stylists & Chairs', icon: UserCheck },
        ];
      case 'retail':
        return [
          { id: 'catalogue', label: 'Product Catalogue', icon: Package },
        ];
      case 'gym':
        return [
          { id: 'members', label: 'Members & Plans', icon: UserCheck },
          { id: 'visit-tracking', label: 'Visit Check-In', icon: Activity },
          { id: 'classes', label: 'Studio Classes', icon: Dumbbell },
        ];
      case 'carwash':
        return [
          { id: 'wash-services', label: 'Wash Services', icon: Droplets },
          { id: 'wash-bundles', label: 'Prepaid Bundles', icon: Package },
          { id: 'wash-visits', label: 'Pass Redemption', icon: Car },
        ];
      case 'service':
      default:
        return [
          { id: 'service-catalogue', label: 'Services Catalogue', icon: Briefcase },
          { id: 'service-visits', label: 'Record Service Event', icon: CheckSquare },
        ];
    }
  };

  const industryNavItems = getIndustryNavItems();

  const handleNavClick = (id: string) => {
    onSelectView(id);
    if (onCloseMobile) onCloseMobile();
  };

  const activeLocation =
    activeBusiness.locations.find((l) => l.id === activeBusiness.activeLocationId) ||
    activeBusiness.locations[0];

  return (
    <aside className="w-64 xl:w-72 h-full flex flex-col bg-[#F8F7F2] dark:bg-[#0E0E0D] border-r border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] select-none">
      
      {/* Brand Header */}
      <div className="h-16 xl:h-20 px-5 flex items-center justify-between border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex-shrink-0">
        <Logo size="sm" />
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]">
          DASHBOARD
        </span>
      </div>

      {/* Business & Location Switcher Card */}
      <div className="p-3.5 border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex-shrink-0">
        <button
          type="button"
          onClick={onOpenBusinessSwitcher}
          aria-haspopup="dialog"
          aria-label="Switch business or location"
          data-testid="business-switcher-btn"
          className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#151513] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] hover:border-[#3027F5]/50 dark:hover:border-[#E4C174]/60 transition-all text-left flex items-center justify-between shadow-xs cursor-pointer group"
          title="Switch business workspace or location"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-black text-xs text-white flex-shrink-0 shadow-xs"
              style={{ backgroundColor: activeBusiness.accentColor }}
            >
              {activeBusiness.logoInitial}
            </div>
            <div className="truncate">
              <div className="font-heading font-bold text-xs sm:text-sm text-[#111318] dark:text-[#F7F3EB] truncate">
                {activeBusiness.name}
              </div>
              <div className="text-[10px] font-mono text-[#60646C] dark:text-[#AAA499] truncate">
                {activeLocation?.name || 'Main Counter'}
              </div>
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-subtle-foreground group-hover:text-[#111318] dark:group-hover:text-[#F7F3EB] transition-transform group-hover:translate-y-0.5 flex-shrink-0" />
        </button>
      </div>

      {/* Navigation Groups (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        
        {/* Group 1: Core Workspace */}
        <div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-subtle-foreground dark:text-[#AAA499] font-bold block mb-1.5">
            CORE WORKSPACE
          </span>
          <nav className="space-y-1">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'text-[#4A4D55] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Group 2: Industry-Specific Modules */}
        <div>
          <div className="px-3 flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-subtle-foreground dark:text-[#AAA499] font-bold block">
              {activeBusiness.businessType.toUpperCase()} MODULES
            </span>
          </div>

          <nav className="space-y-1">
            {industryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'text-[#4A4D55] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold flex-shrink-0 ${
                        item.isPlanned
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Group 3: Administration */}
        <div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-subtle-foreground dark:text-[#AAA499] font-bold block mb-1.5">
            ADMINISTRATION
          </span>
          <nav className="space-y-1">
            <button
              type="button"
              data-testid="nav-settings"
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'text-[#4A4D55] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('help')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeView === 'help'
                  ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                  : 'text-[#4A4D55] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111318] dark:hover:text-[#F7F3EB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Guides</span>
              </div>
            </button>
          </nav>
        </div>

      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3.5 border-t border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white/40 dark:bg-[#121211]/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 flex items-center justify-center font-heading font-black text-xs text-[#3027F5] dark:text-[#E4C174] flex-shrink-0">
              {currentUser?.displayName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="truncate">
              <div className="font-heading font-bold text-xs text-[#111318] dark:text-[#F7F3EB] truncate">
                {currentUser?.displayName || 'Merchant Owner'}
              </div>
              <div className="text-[10px] text-[#60646C] dark:text-[#AAA499] truncate">
                {currentUser?.email || ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="p-2 rounded-xl text-[#60646C] dark:text-[#AAA499] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer flex-shrink-0 inline-flex items-center gap-1.5"
            title="Sign out"
            aria-label="Sign Out"
            data-testid="sign-out-btn"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-semibold">Sign Out</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
