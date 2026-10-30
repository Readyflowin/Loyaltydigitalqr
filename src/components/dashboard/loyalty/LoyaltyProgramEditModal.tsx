import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { LoyaltyProgramConfig, LoyaltyProgramType } from '../../../types/loyalty';
import type { ThemeMode } from '../../../types';
import type { BusinessType } from '../../../types/onboarding';
import { LoyaltyCardPreview } from '../../onboarding/LoyaltyCardPreview';
import { CARD_COLORS, syncRewardWithStamps } from '../../../data/onboardingData';

interface LoyaltyProgramEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: LoyaltyProgramConfig;
  businessName: string;
  businessType?: BusinessType;
  onSaveProgram: (updated: Partial<LoyaltyProgramConfig>) => void;
  theme: ThemeMode;
}

const LoyaltyProgramEditModalContent: React.FC<Omit<LoyaltyProgramEditModalProps, 'isOpen'>> = ({
  onClose,
  program,
  businessName,
  businessType,
  onSaveProgram,
  theme,
}) => {
  // Form draft state initialized directly from props
  const [name, setName] = useState(program.name);
  const [type, setType] = useState<LoyaltyProgramType>(program.type);
  const [stampsRequired, setStampsRequired] = useState(program.stampsRequired);
  const [rewardDescription, setRewardDescription] = useState(program.rewardDescription);
  const [terms, setTerms] = useState(program.terms || '');
  const [accentColor, setAccentColor] = useState(program.accentColor);
  const [status, setStatus] = useState(program.status);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Program name is required.';
    }
    if (!rewardDescription.trim()) {
      newErrors.rewardDescription = 'Reward description is required.';
    }
    if (stampsRequired < 3 || stampsRequired > 24) {
      newErrors.stampsRequired = 'Milestone must be between 3 and 24 visits.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSaveProgram({
      name: name.trim(),
      type,
      stampsRequired,
      rewardDescription: rewardDescription.trim(),
      terms: terms.trim() || undefined,
      accentColor,
      status,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              PROGRAM EDITOR
            </span>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              Configure Loyalty Rewards
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Form (left) + Live Card Preview (right) */}
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Program Name */}
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Program Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Regulars Club, VIP Grooming Pass"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus:ring-red-500'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:ring-[#3027F5] dark:focus:ring-[#E4C174]'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Program Type */}
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Loyalty Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'stamp_card', label: 'Stamp Card' },
                  { id: 'visit_reward', label: 'Visit Count' },
                  { id: 'points_program', label: 'Points Program' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as LoyaltyProgramType)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      type === item.id
                        ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174]'
                        : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] bg-white dark:bg-[#1A1916] text-[#60646C] dark:text-[#AAA499]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Milestone Threshold */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase">
                  Reward Milestone <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#3027F5] dark:text-[#E4C174] font-bold">
                  {stampsRequired} visits to earn reward
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setStampsRequired(num);
                      setRewardDescription((prev) => syncRewardWithStamps(prev, num));
                    }}
                    className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      stampsRequired === num
                        ? 'bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] shadow-xs'
                        : 'bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-[#111318] dark:text-[#F7F3EB] hover:border-[#3027F5]/40'
                    }`}
                  >
                    {num} Visits
                  </button>
                ))}
              </div>
            </div>

            {/* Reward Description */}
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Unlocked Customer Reward <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rewardDescription}
                onChange={(e) => {
                  setRewardDescription(e.target.value);
                  if (errors.rewardDescription) setErrors((prev) => ({ ...prev, rewardDescription: '' }));
                }}
                placeholder="e.g. Free specialty drink, 15% off haircut, $10 off bill"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                  errors.rewardDescription
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus:ring-red-500'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:ring-[#3027F5] dark:focus:ring-[#E4C174]'
                }`}
              />
              {errors.rewardDescription && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.rewardDescription}</span>
                </p>
              )}
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {accentColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Program Status (Active / Paused) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Operational Status
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'border border-[#E5E3DB] dark:border-white/10 text-[#60646C]'
                  }`}
                >
                  Active (Accepting Visits)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paused')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'paused'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300'
                      : 'border border-[#E5E3DB] dark:border-white/10 text-[#60646C]'
                  }`}
                >
                  Paused
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="block text-xs font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Terms & Restrictions (Optional)
              </label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="e.g. Valid on dine-in and takeout. One stamp per counter transaction."
                className="w-full px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

          </div>

          {/* Right Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center p-4 rounded-3xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#3027F5] dark:text-[#E4C174] mb-3">
              LIVE DIGITAL PASS PREVIEW
            </span>
            <LoyaltyCardPreview
              businessType={businessType}
              businessName={businessName}
              programName={name || 'Loyalty Card'}
              stampsRequired={stampsRequired}
              rewardDescription={rewardDescription || 'Your Reward'}
              accentColor={accentColor}
              theme={theme}
            />
            <p className="text-[11px] text-subtle-foreground text-center mt-3">
              Preview updates live as you customize colors, milestones, and reward copy.
            </p>
          </div>

          {/* Modal Actions Footer */}
          <div className="lg:col-span-12 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs sm:text-sm font-semibold text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all"
            >
              Save Program Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export const LoyaltyProgramEditModal: React.FC<LoyaltyProgramEditModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <LoyaltyProgramEditModalContent key={props.program.id} {...props} />;
};
