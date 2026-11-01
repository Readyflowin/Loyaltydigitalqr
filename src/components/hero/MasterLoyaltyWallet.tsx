import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Scissors,
  Coffee,
  Wine,
  UtensilsCrossed,
  CarFront,
  Fuel,
  Dumbbell,
  Gift,
  CircleCheck,
  RotateCcw,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import type { StoreItem } from '../../types';
import { INITIAL_STORES } from '../../data/storesData';

interface MasterLoyaltyWalletProps {
  onViewReward: (store: StoreItem) => void;
  className?: string;
  isStandaloneSection?: boolean;
}

export const MasterLoyaltyWallet: React.FC<MasterLoyaltyWalletProps> = ({
  onViewReward,
  className = '',
  isStandaloneSection = false,
}) => {
  // Store balances state: independent balance per store
  const [stores, setStores] = useState<StoreItem[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('wine');

  const selectedStore =
    stores.find((s) => s.id === selectedStoreId) || stores[0];

  // Helper to trigger confetti celebration
  const triggerCelebration = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#E4C174', '#F7F3EB', '#B58B42', '#3027F5'],
    });
  };

  // Add 1 stamp to the currently selected store
  const handleAddStamp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStores((prev) =>
      prev.map((store) => {
        if (store.id === selectedStoreId) {
          const next = Math.min(store.maxStamps, store.currentStamps + 1);
          if (next === store.maxStamps) {
            triggerCelebration();
          }
          return { ...store, currentStamps: next };
        }
        return store;
      })
    );
  };

  // Complete reward state for the active store
  const handleUnlockReward = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStores((prev) =>
      prev.map((store) => {
        if (store.id === selectedStoreId) {
          return { ...store, currentStamps: store.maxStamps };
        }
        return store;
      })
    );
    triggerCelebration();
  };

  // Reset store demo to initial balance
  const handleResetStore = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const initial = INITIAL_STORES.find((s) => s.id === selectedStoreId);
    if (!initial) return;
    setStores((prev) =>
      prev.map((store) => {
        if (store.id === selectedStoreId) {
          return { ...store, currentStamps: initial.currentStamps };
        }
        return store;
      })
    );
  };

  // Render store category icon
  const renderStoreIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Scissors':
        return <Scissors className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Wine':
        return <Wine className={className} />;
      case 'Utensils':
        return <UtensilsCrossed className={className} />;
      case 'Car':
        return <CarFront className={className} />;
      case 'Fuel':
        return <Fuel className={className} />;
      case 'Dumbbell':
        return <Dumbbell className={className} />;
      default:
        return <Coffee className={className} />;
    }
  };

  const isRewardUnlocked = selectedStore.currentStamps >= selectedStore.maxStamps;
  const progressPercent = Math.round(
    (selectedStore.currentStamps / selectedStore.maxStamps) * 100
  );

  return (
    <div className={`relative w-full max-w-[560px] mx-auto select-none ${className}`}> {/* Editorial Step Annotations around the widget */} {!isStandaloneSection && ( <> <div className="hidden xl:flex items-center gap-2 absolute -top-8 left-4 text-xs font-bold tracking-widest text-[#E4C174] pointer-events-none"> <span className="w-1.5 h-1.5 rounded-full bg-[#E4C174]" /> <span>01 — SELECT A STORE</span> </div> <div className="hidden xl:flex items-center gap-2 absolute top-[44%] -right-16 text-xs font-bold tracking-widest text-[#E4C174] pointer-events-none"> <span className="w-1.5 h-1.5 rounded-full bg-[#E4C174]" /> <span>02 — CHECK YOUR STAMPS</span> </div> <div className="hidden xl:flex items-center gap-2 absolute -bottom-8 left-4 text-xs font-bold tracking-widest text-[#E4C174] pointer-events-none"> <span className="w-1.5 h-1.5 rounded-full bg-[#E4C174]" /> <span>03 — REDEEM YOUR REWARD</span> </div> </> )} {/* Luxury Device / Interface Shell */} <div className="relative rounded-[32px] bg-gradient-to-b from-[#141412] to-[#0D0D0C] p-4 sm:p-6 border border-[rgba(228,193,116,0.30)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(228,193,116,0.06)] transition-all duration-300"> {/* Top Header Bar: "MY LOYALTY WALLET" */} <div className="flex items-center justify-between pb-4 border-b border-[rgba(228,193,116,0.18)]"> <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1916] border border-[rgba(228,193,116,0.30)]"> <div className="w-2 h-2 rounded-full bg-[#E4C174] animate-pulse" /> <span className="text-xs font-bold tracking-widest text-[#E4C174] uppercase"> MY LOYALTY WALLET </span> </div> <div className="flex items-center gap-1.5 text-xs text-[#D0CBC1] font-mono"> <CreditCard className="w-3.5 h-3.5 text-[#E4C174]" /> <span>1 PASS · 7 STORES</span> </div> </div> {/* 1. MASTER LOYALTY CARD (Large Black Luxury Card with Champagne Gold Detailing) */} <div className="relative mt-4 rounded-2xl bg-gradient-to-br from-[#1A1916] via-[#121211] to-[#0A0A09] p-5 sm:p-6 border border-[rgba(228,193,116,0.40)] shadow-lg overflow-hidden group"> {/* Subtle gold line pattern texture */} <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#E4C174 0.75px, transparent 0.75px)', backgroundSize: '12px 12px', }} /> {/* Gold atmospheric accent glow */} <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#E4C174]/10 blur-2xl pointer-events-none" /> {/* Top Row: Gold "L" Brand Mark & loyaltydigitalqr.com */} <div className="relative z-10 flex items-center justify-between"> <div className="flex items-center gap-2"> <div className="w-8 h-8 rounded-xl bg-[#E4C174] text-[#11100D] font-heading font-black text-base flex items-center justify-center shadow-sm"> L </div> <span className="text-xs font-semibold tracking-wider text-[#E4C174]"> loyaltydigitalqr.com </span> </div> {/* Fictional Member Identifier */} <div className="text-xs tracking-widest text-[#D0CBC1] bg-[#0E0E0D] px-2.5 py-1 rounded-md border border-[rgba(228,193,116,0.25)]"> MEMBER · 001 </div> </div> {/* Card Middle: Contactless smart chip & Card Headings */} <div className="relative z-10 mt-6 flex items-end justify-between"> <div> <div className="text-xs tracking-widest text-[#E4C174] uppercase font-bold"> ONE CARD · ALL YOUR STORES </div> <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F7F3EB] tracking-tight mt-0.5"> MASTER LOYALTY CARD </h3> </div> {/* Smart EMV Chip Graphic */} <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-[#C4A35A] to-[#F3DFA6] border border-[#E4C174] p-1 flex flex-col justify-between opacity-90 shadow-sm"> <div className="h-0.5 bg-[#8C6D2B] w-full" /> <div className="h-0.5 bg-[#8C6D2B] w-3/4" /> <div className="h-0.5 bg-[#8C6D2B] w-full" /> </div> </div> </div> {/* 2. "SELECT A STORE" SECTION */} <div className="mt-5"> <div className="flex items-center justify-between mb-2.5"> <span className="text-xs font-bold tracking-widest text-[#D0CBC1] uppercase"> SELECT A STORE ({stores.length}) </span> <span className="text-xs font-semibold text-[#E4C174]"> Active: {selectedStore.category} </span> </div> {/* The Seven Store Selectors arranged in a tidy responsive grid */} <div className="grid grid-cols-7 gap-1.5 sm:gap-2"> {stores.map((store) => { const isSelected = store.id === selectedStoreId; const hasRewardReady = store.currentStamps >= store.maxStamps; return ( <button key={store.id} type="button" onClick={() => setSelectedStoreId(store.id)} aria-label={`${store.name}, ${store.currentStamps} of ${store.maxStamps} stamps collected`}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E4C174] min-h-[64px] sm:min-h-[72px] cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#2A261C] to-[#1C1A14] border-2 border-[#E4C174] shadow-[0_0_15px_rgba(228,193,116,0.3)] transform -translate-y-0.5'
                      : 'bg-[#151513] hover:bg-[#1E1D19] border border-[rgba(228,193,116,0.22)]'
                  }`}
                >
                  {/* Reward ready badge dot */}
                  {hasRewardReady && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E4C174] border-2 border-[#090909] animate-ping" />
                  )}

                  {/* Store Category Icon Circle */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform duration-150 ${
                      isSelected
                        ? 'bg-[#E4C174] text-[#11100D]'
                        : 'bg-[#22211C] border border-[rgba(228,193,116,0.25)] text-[#E4C174]/90'
                    }`}
                  >
                    {renderStoreIcon(store.iconName, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                  </div>

                  {/* Store Label */}
                  <span className={`text-xs sm:text-xs font-semibold mt-1 tracking-tight truncate max-w-full ${
                    isSelected ? 'text-[#E4C174]' : 'text-[#D0CBC1]'
                  }`}>
                    {store.category}
                  </span>

                  {/* Stamp Count Pill */}
                  <span className={`text-xs font-mono mt-0.5 ${
                    isSelected ? 'text-[#E4C174]/90' : 'text-[#AAA499]'
                  }`}> {store.currentStamps}/{store.maxStamps} </span> </button> ); })} </div> </div> {/* 3. INDEPENDENT STAMP PROGRESS PANEL */} <div className="mt-4 rounded-2xl bg-[#171614] border border-[rgba(228,193,116,0.30)] p-4 sm:p-5 transition-all duration-300"> {/* Header of selected store */} <div className="flex items-start justify-between gap-3"> <div className="flex items-center gap-2.5"> <div className="w-10 h-10 rounded-xl bg-[#22211C] border border-[rgba(228,193,116,0.35)] flex items-center justify-center text-[#E4C174] shadow-sm"> {renderStoreIcon(selectedStore.iconName, 'w-5 h-5')} </div> <div> <h4 className="font-heading font-extrabold text-base sm:text-lg text-[#F7F3EB] leading-tight"> {selectedStore.name} </h4> <div className="text-xs text-[#E4C174] mt-0.5 font-semibold"> {selectedStore.rewardRule} </div> </div> </div> {/* Stamp count indicator */} <div className="text-right"> <div className="font-heading font-black text-xl sm:text-2xl text-[#E4C174] tracking-tight"> {selectedStore.currentStamps}/{selectedStore.maxStamps} </div> <div className="text-xs text-[#AAA499] uppercase font-semibold"> STAMPS </div> </div> </div> {/* Ten Stamp Positions in a Two-Row Layout of Five Positions Each */} <div className="mt-4 pt-3 border-t border-[rgba(228,193,116,0.15)]"> <div className="grid grid-cols-5 gap-2 sm:gap-2.5"> {Array.from({ length: selectedStore.maxStamps }).map((_, index) => { const isFilled = index < selectedStore.currentStamps; return ( <button key={index} type="button" onClick={() => { if (!isFilled && index === selectedStore.currentStamps) { handleAddStamp(); } }} title={ isFilled ? `Visit ${index + 1} stamped`
                        : index === selectedStore.currentStamps
                        ? `Click to stamp visit ${index + 1}`
                        : `Visit ${index + 1} (locked)`
                    }
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 transform active:scale-95 cursor-pointer ${
                      isFilled
                        ? 'bg-gradient-to-b from-[#E4C174] to-[#B58B42] text-[#11100D] shadow-[0_0_12px_rgba(228,193,116,0.35)]'
                        : 'bg-[#10100E] border border-[rgba(228,193,116,0.25)] text-[#AAA499] hover:border-[#E4C174]'
                    }`}
                  >
                    {isFilled ? (
                      <CircleCheck className="w-5 h-5 text-[#11100D] stroke-[2.2]" />
                    ) : (
                      <span className="text-xs font-mono font-medium">
                        {index + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smooth Gold Progress Bar */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#D0CBC1] mb-1.5">
              <span>Loyalty Progress</span>
              <span className="text-[#E4C174] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#10100E] border border-[rgba(228,193,116,0.20)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B58B42] to-[#E4C174] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* REWARD UNLOCKED STATE (When 10/10 visits reached) */}
          {isRewardUnlocked ? (
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-[#241F14] to-[#1C180F] border border-[#E4C174] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E4C174] text-[#11100D] flex items-center justify-center flex-shrink-0 shadow-md">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-wider text-[#E4C174] uppercase flex items-center gap-1.5">
                    <span>REWARD UNLOCKED</span>
                    <span className="w-2 h-2 rounded-full bg-[#E4C174] animate-ping" />
                  </div>
                  <div className="text-xs text-[#F7F3EB] font-medium truncate mt-0.5">
                    {selectedStore.rewardTitle}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewReward(selectedStore)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <span>View Reward</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleResetStore}
                  title="Reset store demo"
                  className="p-2 rounded-lg bg-[#151513] hover:bg-[#22211C] text-[#D0CBC1] hover:text-[#E4C174] border border-[rgba(228,193,116,0.30)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Demo Controls when card is not yet full */
            <div className="mt-4 pt-3 border-t border-[rgba(228,193,116,0.15)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddStamp}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#22211C] hover:bg-[#2C2A24] border border-[rgba(228,193,116,0.35)] text-xs font-medium text-[#E4C174] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Stamp</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnlockReward}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#22211C] hover:bg-[#2C2A24] border border-[rgba(228,193,116,0.35)] text-xs font-medium text-[#F7F3EB] hover:text-[#E4C174] transition-colors cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5 text-[#E4C174]" />
                  <span>Preview Reward</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetStore}
                className="inline-flex items-center gap-1 text-xs font-mono text-[#AAA499] hover:text-[#E4C174] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Security & Multi-Store Explanatory Footer */}
        <div className="mt-3.5 pt-3 border-t border-[rgba(228,193,116,0.15)] flex items-center justify-between text-xs font-mono text-[#AAA499]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E4C174]" />
            <span>SEPARATE STAMPS · ONE UNIFIED WALLET</span>
          </div>
          <span className="text-[#E4C174] font-semibold">NO APP REQUIRED</span>
        </div>
      </div>
    </div>
  );
};
