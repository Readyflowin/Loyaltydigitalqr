import React from 'react';
import { Coffee, Gift, Wallet, Flower2, Zap } from 'lucide-react';

interface HeroLightCompositionProps {
  onViewReward: () => void;
  onOpenCardBuilder: () => void;
}

export const HeroLightComposition: React.FC<HeroLightCompositionProps> = ({
  onViewReward,
  onOpenCardBuilder,
}) => {
  return (
    <div className="relative w-full flex justify-center lg:justify-end overflow-visible">
      
      {/* Outer responsive sizing box reserving exact scaled bounds in document flow */}
      <div className="relative select-none overflow-visible w-[328px] h-[316px] sm:w-[434px] sm:h-[418px] md:w-[487px] md:h-[469px] lg:w-[530px] lg:h-[510px] xl:w-[625px] xl:h-[600px] 2xl:w-[680px] 2xl:h-[652px]">
        
        {/* Inner canvas retaining exact 530px x 510px reference geometry scaled proportionally */}
        <div className="absolute top-0 left-0 w-[530px] h-[510px] origin-top-left transform scale-[0.62] sm:scale-[0.82] md:scale-[0.92] lg:scale-100 xl:scale-[1.18] 2xl:scale-[1.28] overflow-visible">
          
          {/* LAYER 1: Full Sweeping Decorative Arc behind the cards */}
          <svg
            className="absolute -top-4 -left-20 w-[600px] h-[540px] text-[#111318]/60 pointer-events-none z-1 overflow-visible"
            viewBox="0 0 600 540"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 440 25 C 310 35, 60 110, 45 250 C 30 380, 80 470, 200 535"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>

          {/* LAYER 2: Acid-Lime Geometric Backing Panel (Rotated +6.5deg CLOCKWISE) */}
          <div
            className="absolute top-[16px] right-[18px] w-[315px] h-[450px] rounded-[32px] bg-[#D6FF38] z-2"
            style={{
              transform: 'rotate(6.5deg)',
              boxShadow: '0 20px 45px -10px rgba(214, 255, 56, 0.40)',
            }}
            aria-hidden="true"
          />

          {/* 3 Radial Ticks on Lime Panel above QR card */}
          <div className="absolute top-[44px] right-[88px] text-[#111318] z-20 pointer-events-none" aria-hidden="true">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <line x1="7" y1="26" x2="11" y2="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16" y1="24" x2="16.5" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="25" y1="26" x2="22" y2="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 2 Horizontal Ticks to the right of QR card */}
          <div className="absolute top-[172px] right-[-8px] text-[#111318] z-20 pointer-events-none" aria-hidden="true">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <line x1="5" y1="9" x2="19" y2="7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="5" y1="16" x2="19" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* LAYER 3A: Background Peeking Card 1: Bloom (Blush Pink, Rotated -10.5deg) */}
          <div
            className="absolute top-[110px] left-[-4px] w-[200px] h-[310px] rounded-[24px] bg-[#FCEAE6] border border-black/5 p-4 z-3 shadow-md"
            style={{
              transform: 'rotate(-10.5deg)',
            }}
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 text-[#111318]">
              <div className="w-5 h-5 rounded-full border border-black/25 flex items-center justify-center text-xs">
                <Flower2 className="w-3 h-3 text-[#111318]" />
              </div>
              <span className="font-heading font-black text-xs tracking-wider">
                BLOOM
              </span>
            </div>
          </div>

          {/* LAYER 3B: Background Peeking Card 2: Fitness (Charcoal, Rotated -5.5deg) */}
          <div
            className="absolute top-[70px] left-[22px] w-[210px] h-[320px] rounded-[24px] bg-[#1C1E24] text-white p-4 z-4 shadow-lg border border-black/10"
            style={{
              transform: 'rotate(-5.5deg)',
            }}
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 text-white/90">
              <Zap className="w-3.5 h-3.5 fill-current text-white/90" />
              <span className="font-heading font-black text-xs tracking-wider">
                FITNESS
              </span>
            </div>
          </div>

          {/* LAYER 4: GOODDAY COFFEE Main Card (296px x 438px, Rotated -3.5deg) */}
          <div
            className="absolute top-[30px] left-[52px] w-[296px] h-[438px] rounded-[26px] bg-white border border-black/10 overflow-hidden z-10 flex flex-col justify-between"
            style={{
              transform: 'rotate(-3.5deg)',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.26), 0 8px 16px -4px rgba(0,0,0,0.10)',
            }}
          >
            <div>
              {/* Card Dark Header Bar */}
              <div className="bg-[#18191E] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Coffee Cup Icon */}
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-heading font-black tracking-wider text-[13px] leading-tight">
                      GOODDAY
                    </div>
                    <div className="text-xs tracking-widest text-[#A0A2A8] font-bold">
                      COFFEE
                    </div>
                  </div>
                </div>

                <div className="text-right leading-none">
                  <div className="text-xs font-mono text-[#8E9199] tracking-wider">
                    EST
                  </div>
                  <div className="text-xs font-mono text-[#8E9199] tracking-wider mt-0.5">
                    2021
                  </div>
                </div>
              </div>

              {/* Coffee Photo Banner (Classic cappuccino latte art on rustic wood table) */}
              <div className="relative h-[126px] overflow-hidden bg-[#2C241D]">
                <img
                  src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80"
                  alt="Cappuccino latte art in ceramic cup on café table"
                  className="w-full h-full object-cover object-center filter brightness-95"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* White Card Body */}
              <div className="px-5 pt-3.5 pb-2">
                <h3 className="font-heading font-black text-[16.5px] leading-[1.22] text-[#111318]">
                  Collect 8 visits,
                  <br />
                  get 1 free coffee.
                </h3>

                {/* EXACTLY 8 STAMPS IN ONE SINGLE HORIZONTAL ROW */}
                <div className="flex items-center justify-between gap-1.5 my-3.5">
                  {/* Stamp 1: Filled */}
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3027F5] flex items-center justify-center text-white shadow-xs">
                    <Coffee className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Stamp 2: Filled */}
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3027F5] flex items-center justify-center text-white shadow-xs">
                    <Coffee className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Stamp 3: Filled */}
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3027F5] flex items-center justify-center text-white shadow-xs">
                    <Coffee className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Stamp 4: Filled */}
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3027F5] flex items-center justify-center text-white shadow-xs">
                    <Coffee className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Stamp 5: Filled */}
                  <div className="w-[26px] h-[26px] rounded-full bg-[#3027F5] flex items-center justify-center text-white shadow-xs">
                    <Coffee className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Stamp 6: Unfilled Dashed */}
                  <div className="w-[26px] h-[26px] rounded-full border-2 border-dashed border-[#D0CECA] bg-transparent" />
                  {/* Stamp 7: Unfilled Dashed */}
                  <div className="w-[26px] h-[26px] rounded-full border-2 border-dashed border-[#D0CECA] bg-transparent" />
                  {/* Stamp 8: Unfilled Dashed */}
                  <div className="w-[26px] h-[26px] rounded-full border-2 border-dashed border-[#D0CECA] bg-transparent" />
                </div>

                {/* Visit Count & Progress Bar */}
                <div className="mt-1">
                  <div className="flex items-center justify-between text-[13.5px] font-bold text-[#111318] mb-1.5">
                    <span>5 / 8 visits</span>
                  </div>
                  <div className="w-full h-[6px] bg-[#EAE8E1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3027F5] rounded-full"
                      style={{ width: '62.5%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Action & Attribution */}
            <div className="px-5 pb-3.5">
              <button
                type="button"
                className="w-full h-[38px] rounded-[11px] bg-[#111318] hover:bg-[#22252C] text-white font-semibold text-[12.5px] flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Save to Phone</span>
              </button>

              <div className="mt-2.5 pt-2 border-t border-[#F0EEE6] flex items-center justify-center gap-1.5 text-xs text-[#8E9199] font-medium">
                {/* 4-Square Logo icon */}
                <div className="grid grid-cols-2 gap-[1.5px] w-2.5 h-2.5">
                  <div className="w-1 h-1 rounded-[0.5px] bg-[#3027F5]" />
                  <div className="w-1 h-1 rounded-[0.5px] bg-[#3027F5]" />
                  <div className="w-1 h-1 rounded-[0.5px] bg-[#3027F5]" />
                  <div className="w-1 h-1 rounded-full bg-[#3027F5]" />
                </div>
                <span>Powered by Loyaltydigitalqr</span>
              </div>
            </div>
          </div>

          {/* LAYER 5: Standalone QR Card (Width 134px, Rotated -4.5deg) */}
          <div
            className="absolute top-[96px] right-[10px] w-[134px] h-[174px] bg-white rounded-[20px] p-2.5 border border-black/8 z-15 text-center flex flex-col justify-between"
            style={{
              transform: 'rotate(-4.5deg)',
              boxShadow: '0 16px 32px -8px rgba(0,0,0,0.18)',
            }}
          >
            {/* High-Contrast Scannable QR Matrix */}
            <div
              onClick={onOpenCardBuilder}
              className="cursor-pointer bg-white p-1 rounded-lg border border-black/5 hover:opacity-90 transition-opacity"
              title="Click to build card"
            >
              <svg viewBox="0 0 100 100" className="w-full h-auto" fill="#111318">
                {/* Top-Left Finder */}
                <rect x="5" y="5" width="28" height="28" rx="4" />
                <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
                <rect x="14" y="14" width="10" height="10" rx="1.5" />

                {/* Top-Right Finder */}
                <rect x="67" y="5" width="28" height="28" rx="4" />
                <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
                <rect x="76" y="14" width="10" height="10" rx="1.5" />

                {/* Bottom-Left Finder */}
                <rect x="5" y="67" width="28" height="28" rx="4" />
                <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
                <rect x="14" y="76" width="10" height="10" rx="1.5" />

                {/* QR Pattern Bits */}
                <rect x="39" y="8" width="8" height="8" rx="1" />
                <rect x="51" y="8" width="8" height="8" rx="1" />
                <rect x="39" y="22" width="8" height="8" rx="1" />
                <rect x="51" y="22" width="8" height="8" rx="1" />
                <rect x="10" y="39" width="8" height="8" rx="1" />
                <rect x="22" y="39" width="8" height="8" rx="1" />
                <rect x="39" y="39" width="10" height="10" rx="2" fill="#3027F5" />
                <rect x="53" y="39" width="8" height="8" rx="1" />
                <rect x="67" y="39" width="8" height="8" rx="1" />
                <rect x="81" y="39" width="8" height="8" rx="1" />
                <rect x="10" y="51" width="8" height="8" rx="1" />
                <rect x="22" y="51" width="8" height="8" rx="1" />
                <rect x="39" y="53" width="8" height="8" rx="1" />
                <rect x="51" y="53" width="12" height="12" rx="2" />
                <rect x="70" y="53" width="6" height="6" rx="1" />
                <rect x="82" y="53" width="8" height="8" rx="1" />
                <rect x="39" y="70" width="8" height="8" rx="1" />
                <rect x="53" y="70" width="8" height="8" rx="1" />
                <rect x="67" y="70" width="8" height="8" rx="1" />
                <rect x="81" y="70" width="8" height="8" rx="1" />
                <rect x="39" y="82" width="8" height="8" rx="1" />
                <rect x="53" y="82" width="8" height="8" rx="1" />
                <rect x="70" y="82" width="18" height="8" rx="1" />
              </svg>
            </div>

            {/* Text underneath QR */}
            <div className="mt-1">
              <div className="font-heading font-black text-xs tracking-wider text-[#111318]">
                SCAN. JOIN.
              </div>
              <div className="font-heading font-black text-xs tracking-wider text-[#111318]">
                EARN REWARDS.
              </div>
            </div>
          </div>

          {/* LAYER 6: Floating "Reward Unlocked!" Notification Toast (Overlaps Goodday lower-right) */}
          <div
            className="absolute bottom-[44px] right-[18px] w-[225px] h-[88px] bg-white rounded-[18px] p-3 border border-black/8 z-25 flex flex-col justify-between"
            style={{
              transform: 'rotate(-1.5deg)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.22)',
            }}
          >
            <div className="flex items-start gap-2.5">
              {/* Lime Square with Cobalt Gift Icon */}
              <div className="w-[34px] h-[34px] rounded-xl bg-[#D6FF38] flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-[#3027F5]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-heading font-black text-[12.5px] text-[#111318] flex items-center gap-1 leading-tight">
                  <span>Reward Unlocked!</span>
                </div>
                <div className="text-xs text-[#60646C] whitespace-nowrap mt-0.5">
                  1 free coffee is ready to redeem.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewReward}
              className="w-full h-[28px] rounded-lg bg-[#3027F5] hover:bg-[#2319D8] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Reward</span>
            </button>
          </div>

          {/* LAYER 7: Precision Vector Annotations with Authentic Handwritten Notes & Curved Arrows */}
          
          {/* 01 / JOIN Annotation */}
          <div className="absolute top-[8px] left-[-60px] z-30 pointer-events-none">
            <div className="font-mono text-xs font-bold tracking-widest text-[#111318]">
              01 / JOIN
            </div>
            <div className="relative">
              <div className="font-handwriting text-[14px] font-bold text-[#111318] leading-[1.15] max-w-[125px] mt-0.5">
                Customers join<br />
                in seconds on<br />
                their phone
              </div>
              {/* Curved arrow pointing over to the top of Goodday card */}
              <svg
                className="absolute -top-1 left-[86px] w-14 h-10 text-[#111318]"
                viewBox="0 0 56 40"
                fill="none"
              >
                <path
                  d="M 4 22 C 18 6, 38 4, 48 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 40 16 L 48 20 L 52 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* 02 / SHARE Annotation */}
          <div className="absolute top-[10px] right-[-14px] z-30 pointer-events-none text-right">
            <div className="font-mono text-xs font-bold tracking-widest text-[#111318]">
              02 / SHARE
            </div>
            <div className="font-handwriting text-[14px] font-bold text-[#111318] leading-[1.15] max-w-[120px] ml-auto mt-0.5">
              Display your<br />
              QR code at<br />
              your counter
            </div>
            {/* Curved arrow pointing down-left towards QR card */}
            <svg
              className="w-10 h-10 text-[#111318] ml-auto mr-8 mt-1"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M 32 4 C 22 10, 14 20, 12 32"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 7 24 L 12 33 L 19 28"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 03 / REWARD Annotation */}
          <div className="absolute bottom-[4px] right-[-16px] z-30 pointer-events-none text-right">
            {/* Curved arrow pointing up-left towards Reward Unlocked toast */}
            <svg
              className="w-10 h-10 text-[#111318] ml-auto mr-12 mb-0.5"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M 32 34 C 32 20, 20 8, 8 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 14 3 L 7 7 L 12 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="font-mono text-xs font-bold tracking-widest text-[#111318]">
              03 / REWARD
            </div>
            <div className="font-handwriting text-[14px] font-bold text-[#111318] leading-[1.15] max-w-[130px] ml-auto mt-0.5">
              Turn first-time<br />
              visitors into<br />
              regulars
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
