import React from 'react';
import { X, Check, MapPin, Building2, Coffee, Scissors, ShoppingBag, Dumbbell, Car, Briefcase } from 'lucide-react';
import type { Business } from '../../types/business';
import type { BusinessType } from '../../types/onboarding';

interface BusinessSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  activeBusiness: Business;
  onSelectBusiness: (businessId: string) => void;
  onSelectLocation: (businessId: string, locationId: string) => void;
}

const getBizIcon = (type: BusinessType) => {
  switch (type) {
    case 'cafe':
    case 'restaurant':
      return Coffee;
    case 'salon':
      return Scissors;
    case 'retail':
      return ShoppingBag;
    case 'gym':
      return Dumbbell;
    case 'carwash':
      return Car;
    case 'service':
    default:
      return Briefcase;
  }
};

export const BusinessSwitcherModal: React.FC<BusinessSwitcherModalProps> = ({
  isOpen,
  onClose,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onSelectLocation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              WORKSPACE SWITCHER
            </span>
            <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              Select Business or Counter
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business List */}
        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {businesses.map((biz) => {
            const isCurrent = biz.id === activeBusiness.id;
            const Icon = getBizIcon(biz.businessType);

            return (
              <div
                key={biz.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCurrent
                    ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white dark:bg-[#1A1916]'
                }`}
              >
                {/* Business Header Row */}
                <button
                  type="button"
                  data-testid={`biz-select-${biz.id}`}
                  className="w-full text-left flex items-start justify-between cursor-pointer"
                  onClick={() => {
                    onSelectBusiness(biz.id);
                    if (!isCurrent) onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-black shadow-xs flex-shrink-0"
                      style={{ backgroundColor: biz.accentColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                          {biz.name}
                        </h4>
                      </div>
                      <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                        {biz.businessType.toUpperCase()} · {biz.planPrice} · {biz.locations.length} {biz.locations.length === 1 ? 'Location' : 'Locations'}
                      </p>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="w-6 h-6 rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Sub-locations list if multiple */}
                {biz.locations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#868A94] dark:text-[#AAA499] block font-semibold">
                      Counters / Locations:
                    </span>
                    {biz.locations.map((loc) => {
                      const isLocActive = isCurrent && biz.activeLocationId === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            onSelectBusiness(biz.id);
                            onSelectLocation(biz.id, loc.id);
                            onClose();
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isLocActive
                              ? 'bg-black/10 dark:bg-white/10 font-bold text-[#111318] dark:text-[#F7F3EB]'
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#60646C] dark:text-[#D0CBC1]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#868A94]" />
                            <span className="truncate">{loc.name}</span>
                          </div>
                          {isLocActive && <span className="text-[10px] font-mono text-[#3027F5] dark:text-[#E4C174]">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-[#60646C] dark:text-[#AAA499]">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
            <span>Businesses you belong to</span>
            <a href="/onboarding" className="ml-3 font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline">+ Add a business</a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
