import React, { useState } from 'react';
import { X, ArrowRight, QrCode, Coffee, Scissors, Utensils, Dumbbell, ShoppingBag, Check } from 'lucide-react';
import type { ThemeMode } from '../../types';

interface CardBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  initialIndustry?: string;
}

export const CardBuilderModal: React.FC<CardBuilderModalProps> = ({
  isOpen,
  onClose,
  theme,
  initialIndustry = 'coffee',
}) => {
  const [businessName, setBusinessName] = useState('My Neighborhood Spot');
  const [category, setCategory] = useState(initialIndustry);
  const [stampsGoal, setStampsGoal] = useState(8);
  const [rewardTitle, setRewardTitle] = useState('1 Free Signature Item');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'coffee', label: 'Coffee / Café', icon: Coffee, defaultReward: '1 Free Coffee / Latte' },
    { id: 'salon', label: 'Salon / Barber', icon: Scissors, defaultReward: '15% Off Next Haircut' },
    { id: 'dining', label: 'Restaurant', icon: Utensils, defaultReward: 'Free Appetizer or Dessert' },
    { id: 'gym', label: 'Gym / Fitness', icon: Dumbbell, defaultReward: '1 Free Guest Pass or Shake' },
    { id: 'retail', label: 'Retail Boutique', icon: ShoppingBag, defaultReward: '$10 Off $50 Purchase' },
  ];

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const found = categories.find((c) => c.id === catId);
    if (found) {
      setRewardTitle(found.defaultReward);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#60646C] dark:text-[#B8B2A6] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          /* Success Screen */
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-[#D6FF38] dark:bg-[#E4C174] text-[#111318] dark:text-[#11100D] font-bold flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="mt-5 text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
              Your Loyalty Card is Ready!
            </h3>
            <p className="mt-2 text-sm text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
              We’ve activated your 30-day free trial for <strong>{businessName}</strong>. Check your inbox ({email || 'your email'}) for your printable counter QR kit.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`py-3 px-6 rounded-xl font-bold text-sm ${
                  theme === 'light'
                    ? 'bg-[#3027F5] text-white hover:bg-[#2319D8]'
                    : 'bg-[#E4C174] text-[#11100D] hover:bg-[#EBD294]'
                }`}
              >
                Go to Merchant Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Card Builder Interactive Form */
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
                INTERACTIVE CARD BUILDER
              </span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
              Build your digital loyalty card
            </h2>
            <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1]">
              Customize your reward, test how it looks on mobile, and claim your 30-day trial.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Form Controls Column */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Goodday Coffee"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>

                {/* Industry Category */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Industry Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSel = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                            isSel
                              ? 'bg-black/5 dark:bg-[#1E1D19] border-[#3027F5] dark:border-[#E4C174] text-[#111318] dark:text-[#E4C174] font-bold'
                              : 'bg-transparent border-[#E5E3DB] dark:border-white/10 text-[#60646C] dark:text-[#D0CBC1]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stamps Milestone */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Stamps Required for Reward
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setStampsGoal(num)}
                        className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                          stampsGoal === num
                            ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] border-transparent'
                            : 'bg-transparent border-[#E5E3DB] dark:border-white/10 text-[#60646C] dark:text-[#D0CBC1]'
                        }`}
                      >
                        {num} Visits
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reward Description */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Reward Unlocked
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    placeholder="e.g. 1 Free Coffee"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                    Your Work Email (For Free 30-Day Trial)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-[#3027F5] text-white hover:bg-[#2319D8]'
                      : 'bg-[#E4C174] text-[#11100D] hover:bg-[#EBD294]'
                  }`}
                >
                  <span>Claim 30-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-[11px] text-center text-[#60646C] dark:text-[#AAA499]">
                  No credit card required · Instant setup in under 3 minutes
                </div>
              </form>

              {/* Live Card Preview Column */}
              <div className="p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#0E0E0D] border border-black/10 dark:border-white/10 flex flex-col items-center">
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#60646C] dark:text-[#AAA499] uppercase mb-3">
                  LIVE CUSTOMER PREVIEW
                </div>

                {/* Preview Card */}
                <div className="w-full max-w-[260px] rounded-2xl bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-[rgba(228,193,116,0.3)] shadow-lg overflow-hidden">
                  <div className="bg-[#111318] text-white p-3 flex items-center justify-between text-xs font-bold">
                    <span className="truncate">{businessName || 'Business Name'}</span>
                    <span className="text-[9px] font-mono text-white/50">MEMBER</span>
                  </div>

                  <div className="p-4 text-center">
                    <div className="text-xs font-semibold text-[#111318] dark:text-[#F7F3EB]">
                      Collect {stampsGoal} visits, get:
                    </div>
                    <div className="text-sm font-extrabold text-[#3027F5] dark:text-[#E4C174] mt-0.5">
                      {rewardTitle || 'Free Reward'}
                    </div>

                    {/* Stamps preview */}
                    <div className="grid grid-cols-4 gap-1.5 my-3">
                      {Array.from({ length: stampsGoal }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            i < 3
                              ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D]'
                              : 'border border-dashed border-black/20 dark:border-white/20 text-black/30 dark:text-white/30'
                          }`}
                        >
                          {i < 3 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : i + 1}
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] font-mono text-[#60646C] dark:text-[#AAA499]">
                      3 / {stampsGoal} visits collected
                    </div>
                  </div>
                </div>

                {/* Counter QR Standee Badge */}
                <div className="mt-4 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1A1916] border border-black/5 dark:border-white/5 text-xs text-[#111318] dark:text-[#F7F3EB]">
                  <QrCode className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
                  <span>Generates your counter QR standee PDF</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
