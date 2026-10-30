import React, { useState, useEffect } from 'react';
import {
  Coffee,
  UtensilsCrossed,
  Scissors,
  ShoppingBag,
  Dumbbell,
  Car,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  Info,
  CheckCircle2,

} from 'lucide-react';
import { Link, useRouter } from '../router';
import { BUSINESS_TYPES, TIMEZONE_OPTIONS, CARD_COLORS } from '../data/onboardingData';
import { authService, getDefaultOnboardingData } from '../services/authService';
import { businessService } from '../services/businessService';
import { LoyaltyCardPreview } from '../components/onboarding/LoyaltyCardPreview';
import type { ThemeMode } from '../types';
import type { BusinessType, OperatingRegion, OnboardingData } from '../types/onboarding';

interface OnboardingPageProps {
  theme: ThemeMode;
}

const BusinessIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => {
  switch (iconName) {
    case 'Coffee':
      return <Coffee className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'Scissors':
      return <Scissors className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Briefcase':
    default:
      return <Briefcase className={className} />;
  }
};

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ theme }) => {
  const { searchParams, navigate } = useRouter();
  const regionParam = searchParams.get('region');
  const initialRegion: OperatingRegion = regionParam === 'india' ? 'india' : 'usa';
  const planParam = searchParams.get('plan') || 'starter';
  const currentUser = authService.getCurrentUser();

  // Creating a business requires an account.
  useEffect(() => {
    if (!currentUser) {
      navigate(`/signup?region=${initialRegion}&plan=${planParam}`, { replace: true });
    }
  }, [currentUser, initialRegion, planParam, navigate]);

  // Load existing draft or initialize default
  const [formData, setFormData] = useState<OnboardingData>(() => {
    const draft = authService.getOnboardingDraft();
    if (draft && !draft.isCompleted) {
      return draft;
    }
    return {
      ...getDefaultOnboardingData(initialRegion, planParam),
      contactEmail: currentUser?.email || '',
      displayName: currentUser?.displayName || '',
    };
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<OnboardingData | null>(null);
  const [createdStaffPin, setCreatedStaffPin] = useState<string | null>(null);

  // Auto-save draft on changes (non-sensitive browser persistence)
  useEffect(() => {
    if (!formData.isCompleted) {
      authService.saveOnboardingDraft(formData);
    }
  }, [formData]);

  // Current business configuration helper
  const currentBusinessConfig =
    BUSINESS_TYPES.find((b) => b.id === formData.businessType) || BUSINESS_TYPES[0];

  // Step navigation validation
  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        errors.businessName = 'Business name is required.';
      } else if (formData.businessName.trim().length < 2) {
        errors.businessName = 'Business name must be at least 2 characters.';
      }
    }

    if (step === 2) {
      if (!formData.selectedModules || formData.selectedModules.length === 0) {
        errors.modules = 'Please select at least one module.';
      }
    }

    if (step === 3) {
      if (!formData.contactEmail.trim()) {
        errors.contactEmail = 'Contact email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
        errors.contactEmail = 'Please provide a valid email address.';
      }
    }

    if (step === 4) {
      if (!formData.programName.trim()) {
        errors.programName = 'Program name is required.';
      }
      if (!formData.rewardDescription.trim()) {
        errors.rewardDescription = 'Reward description is required.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(formData.currentStep)) return;
    const nextStep = Math.min(5, formData.currentStep + 1);
    setFormData((prev) => ({ ...prev, currentStep: nextStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setValidationErrors({});
    const prevStep = Math.max(1, formData.currentStep - 1);
    setFormData((prev) => ({ ...prev, currentStep: prevStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToStep = (step: number) => {
    // Only allow jumping back or to next valid step
    if (step < formData.currentStep) {
      setValidationErrors({});
      setFormData((prev) => ({ ...prev, currentStep: step }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle business type change -> update module defaults and program defaults
  const handleSelectBusinessType = (typeId: BusinessType) => {
    const config = BUSINESS_TYPES.find((b) => b.id === typeId) || BUSINESS_TYPES[0];
    const defaultModuleIds = config.recommendedModules
      .filter((m) => m.isDefault || m.status === 'available')
      .map((m) => m.id);

    setFormData((prev) => ({
      ...prev,
      businessType: typeId,
      selectedModules: defaultModuleIds,
      programName: config.defaultProgramName,
      stampsRequired: config.defaultStamps,
      rewardDescription: config.defaultReward,
    }));
  };

  // Toggle module selection
  const handleToggleModule = (moduleId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedModules.includes(moduleId);
      const updated = exists
        ? prev.selectedModules.filter((id) => id !== moduleId)
        : [...prev.selectedModules, moduleId];
      return { ...prev, selectedModules: updated };
    });
  };

  // Final submission of onboarding wizard
  const handleCompleteSetup = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const business = await businessService.createBusiness(formData);
      setCreatedStaffPin(business.locations[0]?.staffPin || null);
      setCompletedResult({ ...formData, isCompleted: true, completedAt: business.createdAt });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create your business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  // -------------------------------------------------------------
  // COMPLETION VIEW
  // -------------------------------------------------------------
  if (completedResult) {
    return (
      <div className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Completion Card */}
        <div className="rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] p-8 sm:p-12 shadow-2xl">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold uppercase mb-3">
              <span>SETUP COMPLETE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
              Your business workspace is configured!
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#60646C] dark:text-[#D0CBC1]">
              <strong>{completedResult.businessName}</strong> is ready. Next, create your counter QR code so customers can join your loyalty card.
            </p>
          </div>

          {/* Configured Summary Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
            {/* Business Identity */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#60646C] dark:text-[#AAA499] font-bold block">
                BUSINESS IDENTITY & REGION
              </span>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-black"
                  style={{ backgroundColor: completedResult.accentColor }}
                >
                  <BusinessIcon iconName={currentBusinessConfig.iconName} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                    {completedResult.businessName}
                  </h3>
                  <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                    {currentBusinessConfig.title} · {completedResult.region === 'india' ? 'India (INR)' : 'United States (USD)'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#60646C] dark:text-[#AAA499] space-y-1 pt-2">
                <div>Email: <strong className="text-[#111318] dark:text-[#F7F3EB]">{completedResult.contactEmail}</strong></div>
                <div>Timezone: <strong className="text-[#111318] dark:text-[#F7F3EB]">{completedResult.timeZone}</strong></div>
                <div>Plan: <strong className="text-[#111318] dark:text-[#F7F3EB]">{completedResult.region === 'india' ? '₹299/mo (30 days free)' : '$10/mo (30 days free)'}</strong></div>
              </div>
            </div>

            {/* Loyalty Card Summary */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#60646C] dark:text-[#AAA499] font-bold block">
                CONFIGURED PROGRAM
              </span>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#121211] border border-black/5 dark:border-white/5">
                <div className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                  {completedResult.programName}
                </div>
                <div className="text-xs text-[#3027F5] dark:text-[#E4C174] font-semibold mt-0.5">
                  {completedResult.stampsRequired} visits = {completedResult.rewardDescription}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#60646C] dark:text-[#AAA499]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Customers join by scanning your counter QR code</span>
                </div>
              </div>
            </div>
          </div>

          {/* Staff PIN */}
          {createdStaffPin && (
            <div className="mt-8 p-4 rounded-2xl bg-[#3027F5]/5 dark:bg-[#E4C174]/10 border border-[#3027F5]/20 dark:border-[#E4C174]/25 text-xs text-[#111318] dark:text-[#F7F3EB]">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Your staff PIN is {createdStaffPin}.</strong> Staff enter it at the counter to issue stamps and
                  redeem rewards. You can change it any time under Settings. Share it only with your team.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-end gap-4 pt-6 border-t border-black/10 dark:border-white/10">

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-semibold text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>Return to Loyaltydigitalqr Homepage</span>
              </Link>

              <Link
                href="/dashboard"
                className={`px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-md'
                    : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-md'
                }`}
              >
                <span>Enter Business Workspace</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE WIZARD (STEPS 1 - 5)
  // -------------------------------------------------------------
  const stepTitles = [
    'Business Basics',
    'Choose Modules',
    'Business Details',
    'Loyalty Program',
    'Review & Finish',
  ];

  return (
    <div className="py-8 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6">
      
      {/* Wizard Progress Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#60646C] dark:text-[#AAA499]">
              <Link href="/" className="hover:text-[#111318] dark:hover:text-[#E4C174] transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#3027F5] dark:text-[#E4C174] font-bold">
                Step {formData.currentStep} of 5
              </span>
              <span>·</span>
              <span className="text-[#111318] dark:text-[#F7F3EB] font-bold">
                {stepTitles[formData.currentStep - 1]}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB]">
              {formData.currentStep === 1 && 'Tell us about your business'}
              {formData.currentStep === 2 && 'Select your business modules'}
              {formData.currentStep === 3 && 'Provide your contact details'}
              {formData.currentStep === 4 && 'Design your initial loyalty card'}
              {formData.currentStep === 5 && 'Review and finish setup'}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-full bg-[#EBE9E1] dark:bg-[#1A1916] text-[11px] font-mono font-bold text-[#60646C] dark:text-[#AAA499]">
              {formData.region === 'india' ? 'India Plan · ₹299/mo' : 'US Plan · $10/mo'}
            </span>
            <Link
              href="/"
              className="text-xs text-[#60646C] dark:text-[#AAA499] hover:text-[#111318] dark:hover:text-[#E4C174] underline"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Progress Bar & Steps Tabs */}
        <div className="w-full bg-[#E5E3DB] dark:bg-[#1E1D19] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3027F5] dark:bg-[#E4C174] transition-all duration-300"
            style={{ width: `${(formData.currentStep / 5) * 100}%` }}
          />
        </div>

        <div className="hidden sm:grid grid-cols-5 gap-2 mt-3 text-[11px] font-mono text-[#868A94] dark:text-[#AAA499]">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < formData.currentStep;
            const isCurrent = stepNum === formData.currentStep;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJumpToStep(stepNum)}
                disabled={stepNum > formData.currentStep}
                className={`text-left truncate transition-colors ${
                  isCurrent
                    ? 'text-[#3027F5] dark:text-[#E4C174] font-bold'
                    : isDone
                    ? 'text-[#111318] dark:text-[#F7F3EB] cursor-pointer hover:underline'
                    : 'text-[#A0A2A8] dark:text-[#666] cursor-not-allowed'
                }`}
              >
                {stepNum}. {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Step Card */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] p-6 sm:p-10 shadow-xl transition-all">
        
        {/* ========================================================= */}
        {/* STEP 1: BUSINESS BASICS                                    */}
        {/* ========================================================= */}
        {formData.currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Business Name Field */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    businessName: val,
                    displayName: prev.displayName || val,
                    logoInitial: val.trim() ? val.trim().charAt(0).toUpperCase() : 'L',
                  }));
                  if (validationErrors.businessName) {
                    setValidationErrors((prev) => ({ ...prev, businessName: '' }));
                  }
                }}
                placeholder="e.g. Good Day Espresso Bar, Apex Barbershop"
                className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base font-medium focus:outline-none focus:ring-2 ${
                  validationErrors.businessName
                    ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-red-500'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:ring-[#3027F5] dark:focus:ring-[#E4C174]'
                }`}
              />
              {validationErrors.businessName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.businessName}</span>
                </p>
              )}
            </div>

            {/* Business Type Selector (Cards) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-[#60646C] dark:text-[#AAA499]">
                  Configures recommended features
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {BUSINESS_TYPES.map((bt) => {
                  const isSelected = formData.businessType === bt.id;

                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => handleSelectBusinessType(bt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                          : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white dark:bg-[#1A1916] hover:border-[#3027F5]/40 dark:hover:border-[#E4C174]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                              : 'bg-black/5 dark:bg-white/5 text-[#60646C] dark:text-[#AAA499]'
                          }`}
                        >
                          <BusinessIcon iconName={bt.iconName} className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] flex items-center justify-center text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="font-heading font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                        {bt.title}
                      </div>
                      <div className="text-[11px] text-[#60646C] dark:text-[#AAA499] mt-1 leading-snug">
                        {bt.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operating Region & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Operating Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => {
                    const reg = e.target.value as OperatingRegion;
                    setFormData((prev) => ({
                      ...prev,
                      region: reg,
                      timeZone: reg === 'india' ? 'Asia/Kolkata' : 'America/New_York',
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  <option value="usa">United States (USD — $10/mo)</option>
                  <option value="india">India (INR — ₹299/mo)</option>
                  <option value="other">Other International Region</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Operating Timezone
                </label>
                <select
                  value={formData.timeZone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timeZone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CHOOSE BUSINESS MODULES                           */}
        {/* ========================================================= */}
        {formData.currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                TAILORED FOR {currentBusinessConfig.title.toUpperCase()}
              </span>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Select the capabilities you want active in your counter workspace. Available modules are ready to configure immediately.
              </p>
            </div>

            {validationErrors.modules && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationErrors.modules}</span>
              </p>
            )}

            <div className="space-y-3.5">
              {currentBusinessConfig.recommendedModules.map((mod) => {
                const isChecked = formData.selectedModules.includes(mod.id);
                const isAvailable = mod.status === 'available';

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                      isChecked
                        ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                        : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white dark:bg-[#1A1916] hover:border-[#3027F5]/40 dark:hover:border-[#E4C174]/40'
                    }`}
                  >
                    {/* Checkbox button */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isChecked
                          ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                          : 'border-2 border-[#868A94] bg-white dark:bg-[#121211]'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB]">
                          {mod.name}
                        </h3>

                        {/* Status Badge */}
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold uppercase">
                            Available Now
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-bold uppercase">
                            Planned Module
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Informative Note */}
            <div className="p-3.5 rounded-xl bg-[#F0EEE6] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] flex items-start gap-2.5 text-xs text-[#60646C] dark:text-[#AAA499]">
              <Info className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0 mt-0.5" />
              <div>
                <strong>Staged Feature Rollout:</strong> Digital Loyalty Cards with counter QR generation are fully ready today. Planned modules can be enabled now and will activate seamlessly as their staged tasks complete.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: BUSINESS DETAILS                                   */}
        {/* ========================================================= */}
        {formData.currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                CONTACT & LOCATION
              </span>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Provide public details for customer receipts and staff stamp notifications.
              </p>
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                Contact & Administration Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#868A94] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, contactEmail: e.target.value }));
                    if (validationErrors.contactEmail) {
                      setValidationErrors((prev) => ({ ...prev, contactEmail: '' }));
                    }
                  }}
                  placeholder="manager@yourbusiness.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                    validationErrors.contactEmail
                      ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                      : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:ring-[#3027F5] dark:focus:ring-[#E4C174]'
                  }`}
                />
              </div>
              {validationErrors.contactEmail && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.contactEmail}</span>
                </p>
              )}
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                Storefront / Venue Address (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#868A94] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 142 Elm St, Suite B or Market Road"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Business Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#868A94] absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Location Type
                </label>
                <select
                  value={formData.locationType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      locationType: e.target.value as 'first' | 'additional',
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  <option value="first">First / Primary Location</option>
                  <option value="additional">Additional Branch / Multi-Location</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: CONFIGURE INITIAL LOYALTY PROGRAM                 */}
        {/* ========================================================= */}
        {formData.currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-150">
            {/* Form Fields */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                  PROGRAM REWARDS
                </span>
                <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                  Design the incentive that brings customers back. You can edit this anytime.
                </p>
              </div>

              {/* Program Name */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Loyalty Program Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.programName}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, programName: e.target.value }));
                    if (validationErrors.programName) {
                      setValidationErrors((prev) => ({ ...prev, programName: '' }));
                    }
                  }}
                  placeholder="e.g. Regulars Club, VIP Punch Pass"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>

              {/* Stamps Required */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-2">
                  Visits Required for Reward: <span className="text-[#3027F5] dark:text-[#E4C174] font-black">{formData.stampsRequired} visits</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[5, 6, 8, 10, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, stampsRequired: num }))}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        formData.stampsRequired === num
                          ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[#60646C] dark:text-[#AAA499] hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {num} Stamps
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Description */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1.5">
                  Reward Unlocked Upon Completion <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rewardDescription}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, rewardDescription: e.target.value }));
                    if (validationErrors.rewardDescription) {
                      setValidationErrors((prev) => ({ ...prev, rewardDescription: '' }));
                    }
                  }}
                  placeholder="e.g. 1 Free Coffee, 15% off haircut, Free dessert"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                />
              </div>

              {/* Card Accent Color */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-2">
                  Brand Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, accentColor: c.hex }))}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        formData.accentColor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-[#111318] dark:ring-[#F7F3EB]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {formData.accentColor === c.hex && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Card Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#60646C] dark:text-[#AAA499] mb-3 font-semibold">
                LIVE CUSTOMER PASS PREVIEW
              </span>
              <LoyaltyCardPreview
                businessName={formData.businessName}
                programName={formData.programName}
                stampsRequired={formData.stampsRequired}
                rewardDescription={formData.rewardDescription}
                accentColor={formData.accentColor}
                theme={theme}
              />
              <p className="mt-3 text-[11px] text-center text-[#60646C] dark:text-[#AAA499]">
                Customers view this card in mobile Safari or Chrome — no app needed.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: REVIEW AND FINISH                                 */}
        {/* ========================================================= */}
        {formData.currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
                CONFIGURATION SUMMARY
              </span>
              <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
                Review your details before creating your workspace.
              </p>
            </div>

            <div className="space-y-4">
              {/* Section 1: Business Basics */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#60646C] dark:text-[#AAA499] font-bold block">
                    1. BUSINESS BASICS
                  </span>
                  <div className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                    {formData.businessName}
                  </div>
                  <div className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
                    Type: <strong className="text-[#111318] dark:text-[#F7F3EB]">{currentBusinessConfig.title}</strong>
                    {' · '}
                    Region: <strong className="text-[#111318] dark:text-[#F7F3EB]">{formData.region === 'india' ? 'India' : 'United States'}</strong>
                    {' · '}
                    Timezone: <strong className="text-[#111318] dark:text-[#F7F3EB]">{formData.timeZone}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleJumpToStep(1)}
                  className="text-xs font-semibold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 2: Selected Modules */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#60646C] dark:text-[#AAA499] font-bold block">
                    2. ACTIVE & PLANNED MODULES
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.selectedModules.map((modId) => {
                      const mod = currentBusinessConfig.recommendedModules.find((m) => m.id === modId);
                      const isAvail = mod?.status === 'available';

                      return (
                        <span
                          key={modId}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            isAvail
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-black/5 dark:bg-white/5 text-[#60646C] dark:text-[#AAA499]'
                          }`}
                        >
                          {isAvail ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                          <span>{mod?.name || modId}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleJumpToStep(2)}
                  className="text-xs font-semibold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 3: Contact Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#60646C] dark:text-[#AAA499] font-bold block">
                    3. CONTACT & LOCATION
                  </span>
                  <div className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1 space-y-0.5">
                    <div>Contact: <strong className="text-[#111318] dark:text-[#F7F3EB]">{formData.contactEmail}</strong></div>
                    {formData.address && <div>Address: <strong className="text-[#111318] dark:text-[#F7F3EB]">{formData.address}</strong></div>}
                    <div>Location: <strong className="text-[#111318] dark:text-[#F7F3EB]">{formData.locationType === 'first' ? 'Primary Storefront' : 'Additional Branch'}</strong></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleJumpToStep(3)}
                  className="text-xs font-semibold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 4: Loyalty Program */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.18)] flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#60646C] dark:text-[#AAA499] font-bold block">
                    4. LOYALTY PROGRAM
                  </span>
                  <div className="font-heading font-bold text-base text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                    {formData.programName}
                  </div>
                  <div className="text-xs text-[#3027F5] dark:text-[#E4C174] font-semibold mt-1">
                    {formData.stampsRequired} visits = {formData.rewardDescription}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleJumpToStep(4)}
                  className="text-xs font-semibold text-[#3027F5] dark:text-[#E4C174] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Confirmation notice */}
            <div className="p-3.5 rounded-xl bg-[#F0EEE6] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.2)] flex items-start gap-2.5 text-xs text-[#60646C] dark:text-[#AAA499]">
              <Info className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0 mt-0.5" />
              <div>
                <strong>Ready to create your workspace.</strong> Your business, loyalty program and first location will be saved to your account. You can change any of these details later in Settings.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* WIZARD NAVIGATION CONTROLS                                */}
        {/* ========================================================= */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          {formData.currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] text-xs sm:text-sm font-semibold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {formData.currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-md'
                  : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-md'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              className={`px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#3027F5] hover:bg-[#2319D8] text-white shadow-[#3027F5]/25'
                  : 'bg-[#E4C174] hover:bg-[#EBD294] text-[#11100D] shadow-[0_4px_20px_rgba(228,193,116,0.3)]'
              }`}
            >
              <span>{isSubmitting ? 'Creating your workspace…' : 'Complete setup'}</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
        {submitError && (
          <div role="alert" className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
            {submitError}
          </div>
        )}

      </div>

    </div>
  );
};
