import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface ModulePlaceholderViewProps {
  moduleId: string;
  onNavigate: (viewId: string) => void;
  theme: ThemeMode;
}

const MODULE_DETAILS: {
  [key: string]: {
    title: string;
    description: string;
    targetTask: string;
    plannedFeatures: string[];
  };
} = {
  orders: {
    title: 'Customer Ordering & Management',
    description: 'Line-busting counter and mobile ordering for grab-and-go guests.',
    targetTask: 'Task 7 & Task 8 (Café Ordering & Kitchen Workflows)',
    plannedFeatures: [
      'Customer order placement via counter QR',
      'Live order queue with barista ticket printing',
      'Order fulfillment status SMS / browser notifications',
    ],
  },
  menu: {
    title: 'Digital Menu & Item Pricing',
    description: 'Real-time category management, seasonal specials, and item modifiers.',
    targetTask: 'Task 7 (Menu Architecture & Customization)',
    plannedFeatures: [
      'Beverage and food categories with dietary flags',
      'Milk, roast, and size modifier bundles',
      'Real-time 86 / out-of-stock item toggling',
    ],
  },
  tables: {
    title: 'Table Tents & Dine-in QR Stands',
    description: 'Numbered table markers with table-side ordering and bill splitting.',
    targetTask: 'Task 7 (Table-Side QR Integration)',
    plannedFeatures: [
      'Print-ready table number standee generator',
      'Automatic table location metadata capture on scan',
      'Dedicated dine-in service alerts for staff',
    ],
  },
  kitchen: {
    title: 'Kitchen Display System (KDS)',
    description: 'Real-time order tickets for kitchen and barista prep stations.',
    targetTask: 'Task 8 (Kitchen Prep Routing & Workflow)',
    plannedFeatures: [
      'Touchscreen ticket bumping and timer tracking',
      'Prep station routing (barista vs sandwich line)',
      'Fulfillment speed analytics',
    ],
  },
  appointments: {
    title: 'Appointments & Booking Management',
    description: 'Online booking for salon, haircut, and personal care appointments.',
    targetTask: 'Task 9 (Salon Bookings & Client Scheduling)',
    plannedFeatures: [
      'Client self-scheduling via counter QR or link',
      'Automated SMS & calendar appointment reminders',
      'Cancellation and no-show protection',
    ],
  },
  calendar: {
    title: 'Staff Chair Calendar',
    description: 'Daily and weekly schedule view across stylists, barbers, and service chairs.',
    targetTask: 'Task 9 (Staff Availability & Rosters)',
    plannedFeatures: [
      'Multi-stylist schedule grid with shift toggles',
      'Double-booking prevention and buffer intervals',
      'Individual stylist performance stats',
    ],
  },
  services: {
    title: 'Salon Service Catalogue',
    description: 'Treatment durations, pricing tiers, and bundled styling packages.',
    targetTask: 'Task 9 (Service Menu & Duration Engine)',
    plannedFeatures: [
      'Custom cut, coloring, and treatment durations',
      'Stylist-level price adjustments',
      'Service package and loyalty stamp bundling',
    ],
  },
  staff: {
    title: 'Stylists & Chair Stations',
    description: 'Staff member profiles, individual PIN stamps, and commission tracking.',
    targetTask: 'Task 9 (Staff Management)',
    plannedFeatures: [
      'Individual staff PIN verification for stamps and tips',
      'Chair station assignment and schedule limits',
      'Staff activity and client retention metrics',
    ],
  },
  catalogue: {
    title: 'Product Catalogue & Inventory',
    description: 'In-store QR scanning to view sizes, colors, and availability.',
    targetTask: 'Retail Extension Module',
    plannedFeatures: [
      'Item SKU and photo gallery upload',
      'In-store QR scanning for extended inventory',
      'Stock alerts and seasonal collections',
    ],
  },
  classes: {
    title: 'Studio Class Management',
    description: 'Roster scheduling, class capacity limits, and check-in rosters.',
    targetTask: 'Fitness Extension Module',
    plannedFeatures: [
      'Class schedule and instructor roster',
      'Capacity limits and waitlists',
      'Workout streak rewards integration',
    ],
  },
  'wash-bundles': {
    title: 'Wash Bundles & Service Packages',
    description: 'Prepaid vehicle wash passes and express lane access.',
    targetTask: 'Car Wash Extension Module',
    plannedFeatures: [
      'Prepaid 5-wash or 10-wash package tracking',
      'Express barcode lane integration',
      'Monthly unlimited wash subscription engine',
    ],
  },
  'qr-landing': {
    title: 'Custom Business Landing Page',
    description: 'Mobile link hub displaying your hours, reviews, and reward program.',
    targetTask: 'Public Web Presence Module',
    plannedFeatures: [
      'Branded mobile landing page linking Google reviews and social links',
      'Instant join button for digital loyalty card',
      'Operating hours and counter contact details',
    ],
  },
};

export const ModulePlaceholderView: React.FC<ModulePlaceholderViewProps> = ({
  moduleId,
  onNavigate,
  theme: _theme,
}) => {
  const info = MODULE_DETAILS[moduleId] || {
    title: 'Staged Module',
    description: 'This business module is scheduled for an upcoming product release.',
    targetTask: 'Future Implementation Milestone',
    plannedFeatures: [
      'Tailored industry workflows',
      'Dedicated counter and tablet interfaces',
      'Real-time syncing across devices',
    ],
  };

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Back button */}
      <button
        type="button"
        onClick={() => onNavigate('overview')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60646C] dark:text-[#AAA499] hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Overview</span>
      </button>

      {/* Main Placeholder Card */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-8 sm:p-10 shadow-lg text-center">
        
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold uppercase mb-3">
          <span>PLANNED MODULE · STAGED PRODUCT ROADMAP</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
          {info.title}
        </h1>

        <p className="mt-2 text-sm sm:text-base text-[#60646C] dark:text-[#D0CBC1] max-w-xl mx-auto">
          {info.description}
        </p>

        {/* Milestone Indicator */}
        <div className="mt-6 p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] max-w-md mx-auto text-xs">
          <span className="text-[10px] font-mono uppercase text-subtle-foreground dark:text-[#AAA499] block font-semibold">
            IMPLEMENTATION MILESTONE:
          </span>
          <strong className="text-[#3027F5] dark:text-[#E4C174] font-heading font-bold text-sm mt-0.5 block">
            {info.targetTask}
          </strong>
        </div>

        {/* Planned Capabilities List */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-left max-w-lg mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-subtle-foreground dark:text-[#AAA499] font-bold block mb-3">
            PLANNED CAPABILITIES:
          </span>
          <div className="space-y-2.5">
            {info.plannedFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111318] dark:text-[#F7F3EB]">
                <div className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono text-subtle-foreground">{idx + 1}</span>
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] transition-all cursor-pointer shadow-md"
          >
            Return to Business Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('loyalty')}
            className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Manage Digital Loyalty Card
          </button>
        </div>

      </div>

    </div>
  );
};
