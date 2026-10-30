import React, { useState, useEffect } from 'react';
import { X, Play, Pause, ArrowRight, ArrowLeft, QrCode, CheckCircle, Gift, Check } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const steps = [
    {
      title: '1. Customer points camera at counter QR',
      subtitle: 'ZERO APP INSTALLATION',
      desc: 'No app download or account setup required. A native Safari or Chrome prompt opens instantly.',
      visual: (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-2xl bg-white p-3 border-2 border-black/10 shadow-lg flex items-center justify-center">
            <QrCode className="w-16 h-16 text-[#111318]" />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] text-xs font-mono font-bold">
            <span>● CAMERA DETECTED: loyaltydigitalqr.com/join</span>
          </div>
        </div>
      ),
    },
    {
      title: '2. Card opens in browser in 3 seconds',
      subtitle: 'SEAMLESS WEB APP',
      desc: 'The customer’s card opens in their phone browser and can be saved to the home screen.',
      visual: (
        <div className="w-64 bg-[#111318] text-white rounded-2xl p-4 shadow-xl text-center">
          <div className="text-xs font-mono text-white/50">GOODDAY COFFEE</div>
          <div className="font-heading font-black text-sm mt-1">1st Visit Stamped!</div>
          <div className="mt-3 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 1 ? 'bg-[#3027F5] text-white' : 'border border-dashed border-white/30 text-white/40'
                }`}
              >
                {i === 1 ? <Check className="w-3 h-3 stroke-[2.5]" /> : i}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-white/70">1 / 8 visits collected</div>
        </div>
      ),
    },
    {
      title: '3. Staff stamps with secret 4-digit PIN',
      subtitle: 'FRAUD-PROOF CHECKOUT',
      desc: 'During checkout, your staff enters your 4-digit code directly on the customer’s phone or taps validate.',
      visual: (
        <div className="w-64 bg-white dark:bg-[#1C1A16] rounded-2xl p-4 border border-black/10 dark:border-white/10 shadow-xl text-center">
          <div className="text-xs font-mono font-bold text-[#60646C] dark:text-[#AAA499]">
            STAFF VERIFICATION PIN
          </div>
          <div className="flex justify-center gap-2 my-3">
            {['•', '•', '•', '•'].map((dot, i) => (
              <div
                key={i}
                className="w-8 h-10 rounded-lg bg-[#F8F7F2] dark:bg-[#121211] border border-black/10 dark:border-white/10 flex items-center justify-center font-bold text-lg text-[#3027F5] dark:text-[#E4C174]"
              >
                {dot}
              </div>
            ))}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Stamp Authorized!</span>
          </div>
        </div>
      ),
    },
    {
      title: '4. Reward unlocks on 8th visit',
      subtitle: 'INSTANT CELEBRATION',
      desc: 'When the card is complete, it transforms into an unlocked voucher ready for staff to redeem.',
      visual: (
        <div className="w-64 bg-[#D6FF38] dark:bg-[#E4C174] text-[#111318] dark:text-[#11100D] rounded-2xl p-5 shadow-2xl text-center">
          <Gift className="w-10 h-10 mx-auto text-[#111318] dark:text-[#11100D]" />
          <div className="font-heading font-black text-base mt-2">
            Reward Unlocked!
          </div>
          <div className="text-xs font-medium mt-1">
            1 Free Specialty Coffee on the house
          </div>
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-black text-white text-xs font-bold">
            Staff: Tap to Redeem
          </div>
        </div>
      ),
    },
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-[#111318] dark:text-[#E4C174] uppercase">
              1-MINUTE PRODUCT WALKTHROUGH
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Visual Simulation Stage */}
        <div className="relative h-64 sm:h-72 bg-[#F8F7F2] dark:bg-[#0A0A09] flex items-center justify-center border-b border-black/5 dark:border-white/5">
          {steps[currentStep].visual}
        </div>

        {/* Step Explanation & Navigation */}
        <div className="p-6">
          <div className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
            {steps[currentStep].subtitle}
          </div>
          <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            {steps[currentStep].title}
          </h3>
          <p className="mt-1 text-sm text-[#60646C] dark:text-[#D0CBC1]">
            {steps[currentStep].desc}
          </p>

          {/* Progress Indicators */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCurrentStep(i);
                  setIsPlaying(false);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentStep
                    ? 'w-10 bg-[#3027F5] dark:bg-[#E4C174]'
                    : 'w-4 bg-black/10 dark:bg-white/10'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls Bar */}
          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#60646C] dark:text-[#AAA499] hover:text-[#111318] dark:hover:text-[#E4C174]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'AUTO-PLAY'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1));
                  setIsPlaying(false);
                }}
                className="p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[#111318] dark:text-[#F7F3EB]"
                aria-label="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep((prev) => (prev + 1) % steps.length);
                  setIsPlaying(false);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ${
                  theme === 'light'
                    ? 'bg-[#3027F5] text-white hover:bg-[#2319D8]'
                    : 'bg-[#E4C174] text-[#11100D] hover:bg-[#EBD294]'
                }`}
              >
                <span>{currentStep === steps.length - 1 ? 'Start Over' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
