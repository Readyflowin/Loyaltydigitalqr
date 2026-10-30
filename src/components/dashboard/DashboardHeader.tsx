import React, { useState } from 'react';
import { Menu, Bell, QrCode } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import type { ThemeMode } from '../../types';
import type { Business, BusinessNotification } from '../../types/business';

interface DashboardHeaderProps {
  title: string;
  breadcrumb?: string;
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
  onOpenMobileMenu: () => void;
  activeBusiness: Business;
  onQuickAction?: () => void;
  notifications: BusinessNotification[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  breadcrumb = 'Workspace',
  theme,
  onThemeToggle,
  onOpenMobileMenu,
  activeBusiness,
  onQuickAction,
  notifications,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 xl:h-20 bg-[#F8F7F2]/80 dark:bg-[#0E0E0D]/80 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#868A94] dark:text-[#AAA499] uppercase tracking-wider">
            <span>{breadcrumb}</span>
            <span>/</span>
            <span className="text-[#3027F5] dark:text-[#E4C174] font-bold">{activeBusiness.name}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] tracking-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Right Controls: Actions, Notifications, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Quick Action button */}
        {onQuickAction && (
          <button
            type="button"
            onClick={onQuickAction}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] bg-white dark:bg-[#1A1916] text-xs font-semibold text-[#111318] dark:text-[#F7F3EB] hover:border-[#3027F5] dark:hover:border-[#E4C174] shadow-xs transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Counter Display Kit</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            data-testid="notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-[#60646C] dark:text-[#AAA499] hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative cursor-pointer"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3027F5] dark:bg-[#E4C174]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-white dark:bg-[#1A1916] rounded-2xl shadow-2xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-mono font-bold uppercase text-[#111318] dark:text-[#F7F3EB]">
                  Activity Notifications
                </span>
                <span className="text-[10px] font-mono text-[#868A94]">
                  Demo Feed
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-[#121211] text-xs space-y-0.5"
                  >
                    <div className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB]">
                      {n.title}
                    </div>
                    <p className="text-[#60646C] dark:text-[#D0CBC1] text-[11px] leading-snug">
                      {n.message}
                    </p>
                    <div className="text-[10px] font-mono text-[#868A94] pt-0.5">
                      {n.timeAgo}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-semibold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  Close notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />

      </div>

    </header>
  );
};
