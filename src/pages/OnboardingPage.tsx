import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  X,
  Gift,
  Percent,
  Tag,
  Edit3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Link, useRouter } from '../router';
import { BUSINESS_TYPES, CARD_COLORS } from '../data/onboardingData';
import { authService, getDefaultOnboardingData } from '../services/authService';
import { businessService } from '../services/businessService';
import { isUploadConfigured, uploadImage } from '../lib/uploads';
import { VerifyEmailScreen } from '../components/auth/VerifyEmailScreen';
import { LoyaltyCard } from '../components/ui';
import type { ThemeMode } from '../types';
import type { BusinessType, OnboardingData } from '../types/onboarding';

interface OnboardingPageProps {
  theme: ThemeMode;
}

const COUNTRIES = [
  { name: 'United States', currency: 'USD', symbol: '$' },
  { name: 'India', currency: 'INR', symbol: '₹' },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { name: 'Canada', currency: 'CAD', symbol: '$' },
  { name: 'Australia', currency: 'AUD', symbol: '$' },
  { name: 'European Union', currency: 'EUR', symbol: '€' },
  { name: 'United Arab Emirates', currency: 'AED', symbol: 'AED ' },
  { name: 'Singapore', currency: 'SGD', symbol: '$' },
  { name: 'Other Country', currency: 'USD', symbol: '$' },
];

const EXPIRY_OPTIONS = [
  'Never expires',
  'Expires in 30 days',
  'Expires in 60 days',
  'Expires in 90 days',
  'Expires in 6 months',
  'Expires in 1 year',
];

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
  const { navigate } = useRouter();
  const currentUser = authService.getCurrentUser();
  const [, setAuthVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => authService.subscribe(() => setAuthVersion((v) => v + 1)), []);

  // Creating a business requires an account.
  useEffect(() => {
    if (!currentUser) {
      navigate('/signup', { replace: true });
    }
  }, [currentUser, navigate]);

  // Load existing draft or initialize default
  const [formData, setFormData] = useState<OnboardingData>(() => {
    const draft = authService.getOnboardingDraft();
    if (draft && !draft.isCompleted) {
      return draft;
    }
    const def = getDefaultOnboardingData('usa', 'starter');
    return {
      ...def,
      contactEmail: currentUser?.email || '',
      displayName: currentUser?.displayName || '',
      country: 'United States',
      currency: 'USD',
      currencySymbol: '$',
      stampsRequired: 10,
      rewardDescription: 'Free coffee',
      rewardCategory: 'item',
      rewardValue: 'Free coffee',
      rewardExpiry: 'Never expires',
      currentStep: 1,
    };
  });

  const [customStamps, setCustomStamps] = useState(
    [5, 6, 8, 10, 12].includes(formData.stampsRequired) ? '' : String(formData.stampsRequired)
  );
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<OnboardingData | null>(null);
  // The chosen logo is held as a File and only uploaded to Cloudflare R2 after
  // the business exists (the upload worker authorises by business membership).
  // We keep a local object-URL purely for the live preview, and never write the
  // raw image into the onboarding draft or Firestore.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Auto-save draft on changes
  useEffect(() => {
    if (!formData.isCompleted) {
      authService.saveOnboardingDraft(formData);
    }
  }, [formData]);

  const currentBusinessConfig =
    BUSINESS_TYPES.find((b) => b.id === formData.businessType) || BUSINESS_TYPES[0];

  // Step navigation validation
  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.businessType) {
        errors.businessType = 'Please select your business type.';
      }
    }

    if (step === 2) {
      if (!formData.businessName.trim()) {
        errors.businessName = 'Business name is required.';
      } else if (formData.businessName.trim().length < 2) {
        errors.businessName = 'Business name must be at least 2 characters.';
      }
    }

    if (step === 3) {
      if (!formData.rewardDescription.trim()) {
        errors.rewardDescription = 'Please specify what reward customers get.';
      }
      if (formData.stampsRequired < 2) {
        errors.stampsRequired = 'Minimum visits required is 2.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(formData.currentStep)) return;
    const nextStep = Math.min(4, formData.currentStep + 1);
    setFormData((prev) => ({ ...prev, currentStep: nextStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setValidationErrors({});
    const prevStep = Math.max(1, formData.currentStep - 1);
    setFormData((prev) => ({ ...prev, currentStep: prevStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1: Select business type
  const handleSelectBusinessType = (typeId: BusinessType) => {
    const config = BUSINESS_TYPES.find((b) => b.id === typeId) || BUSINESS_TYPES[0];
    const defaultModuleIds = config.recommendedModules
      .filter((m) => m.isDefault || m.status === 'available')
      .map((m) => m.id);

    // If 'service' (Other), ensure generic services module is enabled
    if (typeId === 'service' && !defaultModuleIds.includes('service-catalogue')) {
      defaultModuleIds.push('service-catalogue');
    }

    setFormData((prev) => ({
      ...prev,
      businessType: typeId,
      selectedModules: defaultModuleIds,
      programName: config.defaultProgramName,
      stampsRequired: typeId === 'cafe' ? 10 : config.defaultStamps,
      rewardDescription: typeId === 'cafe' ? 'Free coffee' : config.defaultReward,
      rewardValue: typeId === 'cafe' ? 'Free coffee' : config.defaultReward,
      currentStep: 2, // Auto-advance to Step 2
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Logo selection. The file is uploaded to Cloudflare R2 at the end of
  // onboarding (handleCompleteSetup); here we only validate and preview it.
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, logo: 'Please choose a PNG, JPG or WebP image.' }));
      return;
    }
    if (file.size > 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, logo: 'Logo file must be under 1 MB.' }));
      return;
    }

    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setLogoFile(file);
    setFormData((prev) => ({ ...prev, logoUrl: null }));
    setValidationErrors((prev) => ({ ...prev, logo: '' }));
  };

  const clearLogo = () => {
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setLogoFile(null);
    setFormData((prev) => ({ ...prev, logoUrl: null }));
  };

  const handleCountryChange = (countryName: string) => {
    const match = COUNTRIES.find((c) => c.name === countryName);
    const curr = match?.currency || 'USD';
    const sym = match?.symbol || '$';
    const reg = countryName.toLowerCase() === 'india' ? 'india' : 'usa';

    setFormData((prev) => ({
      ...prev,
      country: countryName,
      currency: curr,
      currencySymbol: sym,
      region: reg,
    }));
  };

  // Step 3: Reward selection handlers
  const handleRewardCategoryChange = (cat: 'item' | 'percent' | 'amount' | 'custom') => {
    let defVal = '';
    const sym = formData.currencySymbol || '$';
    if (cat === 'item') defVal = formData.businessType === 'cafe' ? 'Free coffee' : 'Free gift or treat';
    else if (cat === 'percent') defVal = '10% off entire order';
    else if (cat === 'amount') defVal = `${sym}5 off your next visit`;
    else defVal = 'Complimentary consultation or bonus credit';

    setFormData((prev) => ({
      ...prev,
      rewardCategory: cat,
      rewardValue: defVal,
      rewardDescription: defVal,
    }));
  };

  // Final submission of onboarding wizard
  const handleCompleteSetup = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const business = await businessService.createBusiness({
        ...formData,
        rewardExpiry: formData.rewardExpiry || 'Never expires',
      });

      // Now that the business (and the owner's membership) exists, upload the
      // logo to Cloudflare R2 and save its URL. A failure here never blocks the
      // workspace — the owner can re-upload later from Settings → Profile.
      if (logoFile && isUploadConfigured()) {
        try {
          const { url } = await uploadImage(business.id, 'logo', logoFile);
          await businessService.updateBusiness(business.id, { logoUrl: url });
        } catch (uploadErr) {
          console.warn('Logo upload failed; workspace created without a logo.', uploadErr);
        }
      }
      if (logoPreview) URL.revokeObjectURL(logoPreview);

      setCompletedResult({ ...formData, isCompleted: true, completedAt: business.createdAt });
      // Redirect directly to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setSubmitError(
        code === 'permission-denied'
          ? 'We could not confirm your account yet. Please refresh the page and try again.'
          : err instanceof Error
            ? err.message
            : 'Could not create your business. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;
  if (authService.needsEmailVerification()) return <VerifyEmailScreen />;

  // -------------------------------------------------------------
  // COMPLETION VIEW (Fallback if still rendering)
  // -------------------------------------------------------------
  if (completedResult) {
    return (
      <div className="py-12 sm:py-20 max-w-xl mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-heading font-black">Workspace ready!</h1>
        <p className="mt-2 text-muted-foreground text-sm">Entering your dashboard…</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE WIZARD (4 STEPS)
  // -------------------------------------------------------------
  const stepTitles = [
    'Business Type',
    'Your Business',
    'Customer Reward',
    'Review & Finish',
  ];

  return (
    <div className="py-8 sm:py-14 max-w-3xl mx-auto px-4 sm:px-6">
      
      {/* Wizard Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            {formData.currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-[#3027F5] dark:hover:text-[#E4C174] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <span className="text-[#3027F5] dark:text-[#E4C174] font-bold">
                Step {formData.currentStep} of 4
              </span>
              <span>·</span>
              <span className="text-foreground">
                {stepTitles[formData.currentStep - 1]}
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-[#111318] dark:hover:text-[#E4C174] underline"
          >
            Cancel
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E3DB] dark:bg-[#1E1D19] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3027F5] dark:bg-[#E4C174] transition-all duration-300"
            style={{ width: `${(formData.currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Step Card */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xl transition-all">
        
        {/* ========================================================= */}
        {/* STEP 1: TYPE OF BUSINESS                                  */}
        {/* ========================================================= */}
        {formData.currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                What type of business are you?
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                We'll tailor your loyalty card and features to fit how you serve customers.
              </p>
            </div>

            {validationErrors.businessType && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationErrors.businessType}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {BUSINESS_TYPES.map((bt) => {
                const isSelected = formData.businessType === bt.id;
                const isOther = bt.id === 'service';

                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => handleSelectBusinessType(bt.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                        : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] bg-white dark:bg-[#2D2D2D] hover:border-[#3027F5]/50 dark:hover:border-[#E4C174]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                              : 'bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <BusinessIcon iconName={bt.iconName} className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] flex items-center justify-center text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        {isOther && !isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            Custom Services
                          </span>
                        )}
                      </div>

                      <div className="font-heading font-bold text-sm text-foreground">
                        {isOther ? 'Other (Service / Custom)' : bt.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {isOther
                          ? 'Add custom service offerings into your menu option — scanning the QR displays them for customers.'
                          : bt.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: BUSINESS DETAILS                                  */}
        {/* ========================================================= */}
        {formData.currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                Tell us about your business
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                This appears on your customers' loyalty cards.
              </p>
            </div>

            {/* Business name */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Business name
              </label>
              <input
                type="text"
                autoFocus
                value={formData.businessName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    businessName: val,
                    displayName: prev.displayName || val,
                    logoInitial: val.trim() ? val.trim().charAt(0).toUpperCase() : 'B',
                  }));
                  if (validationErrors.businessName) {
                    setValidationErrors((prev) => ({ ...prev, businessName: '' }));
                  }
                }}
                placeholder="e.g. Sunrise Café"
                className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base font-medium focus:outline-none focus:ring-2 ${
                  validationErrors.businessName
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus:ring-red-500'
                    : 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-white dark:bg-[#2D2D2D] text-foreground focus:ring-[#3027F5] dark:focus:ring-[#E4C174]'
                }`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Customers see this on their loyalty card.
              </p>
              {validationErrors.businessName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors.businessName}</span>
                </p>
              )}
            </div>

            {/* Business logo upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Logo
                </label>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-muted/40 flex items-center gap-4">
                {/* Logo Box / Preview */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-white overflow-hidden shadow-xs flex-shrink-0"
                  style={{
                    background: logoPreview || formData.logoUrl
                      ? 'transparent'
                      : 'linear-gradient(135deg, #00C0FF 0%, #42E695 100%)',
                  }}
                >
                  {logoPreview || formData.logoUrl ? (
                    <img src={logoPreview || formData.logoUrl || ''} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    formData.businessName?.trim() ? formData.businessName.trim().charAt(0).toUpperCase() : 'B'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl border border-border hover:border-[#3027F5] dark:hover:border-[#E4C174] bg-white dark:bg-[#2D2D2D] text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoPreview || formData.logoUrl ? 'Change logo' : 'Add logo'}</span>
                    </button>
                    {(logoPreview || formData.logoUrl) && (
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="p-2 text-muted-foreground hover:text-red-500 cursor-pointer"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG or WebP, up to 1 MB. Square works best.
                  </p>
                  {validationErrors.logo && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.logo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Country and Currency (NO price displayed, NO time zone displayed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Country
                </label>
                <select
                  value={formData.country || 'United States'}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Currency
                </label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => {
                    const curr = e.target.value;
                    const matched = COUNTRIES.find((c) => c.currency === curr);
                    setFormData((prev) => ({
                      ...prev,
                      currency: curr,
                      currencySymbol: matched?.symbol || '$',
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CHOOSE CUSTOMER REWARD                            */}
        {/* ========================================================= */}
        {formData.currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                Choose your customer reward
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Customers earn one stamp per visit.
              </p>
            </div>

            {/* Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-center">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#3027F5] dark:text-[#E4C174] block">
                RECOMMENDED FOR {currentBusinessConfig.title.toUpperCase()}
              </span>
              <div className="text-base sm:text-lg font-heading font-black text-foreground mt-1">
                {formData.stampsRequired} visits = {formData.rewardDescription || 'Free item'}
              </div>
            </div>

            {/* How many visits to earn it? */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                How many visits to earn it?
              </label>
              <div className="flex flex-wrap gap-2">
                {[5, 6, 8, 10, 12].map((num) => {
                  const isSelected = formData.stampsRequired === num && customStamps === '';
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCustomStamps('');
                        setFormData((prev) => ({ ...prev, stampsRequired: num }));
                      }}
                      className={`min-w-14 py-2.5 px-3 rounded-xl text-sm font-heading font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-[#3027F5] bg-[#3027F5] text-white dark:border-[#E4C174] dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                          : 'border-border bg-white dark:bg-[#2D2D2D] text-foreground hover:border-[#3027F5]/40'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    const fallback = customStamps ? parseInt(customStamps, 10) : 15;
                    setCustomStamps(String(fallback));
                    setFormData((prev) => ({ ...prev, stampsRequired: fallback }));
                  }}
                  className={`py-2.5 px-4 rounded-xl text-sm font-heading font-bold transition-all cursor-pointer border ${
                    customStamps !== ''
                      ? 'border-[#3027F5] bg-[#3027F5] text-white dark:border-[#E4C174] dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                      : 'border-border bg-white dark:bg-[#2D2D2D] text-foreground hover:border-[#3027F5]/40'
                  }`}
                >
                  Other
                </button>
              </div>

              {customStamps !== '' && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={customStamps}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomStamps(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setFormData((prev) => ({ ...prev, stampsRequired: num }));
                      }
                    }}
                    placeholder="e.g. 15"
                    className="w-24 px-3 py-2 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                  />
                  <span className="text-xs text-muted-foreground">visits</span>
                </div>
              )}
            </div>

            {/* What do customers get? (4 option cards) */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                What do customers get?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'item', label: 'Free item', icon: Gift, hint: 'e.g. a free coffee' },
                  { id: 'percent', label: 'Percent off', icon: Percent, hint: 'e.g. 10% off' },
                  { id: 'amount', label: 'Amount off', icon: Tag, hint: `e.g. ${formData.currencySymbol || '$'}5 off` },
                  { id: 'custom', label: 'Something else', icon: Edit3, hint: 'Write your own reward' },
                ].map((opt) => {
                  const isSelected = (formData.rewardCategory || 'item') === opt.id;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleRewardCategoryChange(opt.id as 'item' | 'percent' | 'amount' | 'custom')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#3027F5] dark:border-[#E4C174] bg-[#3027F5]/5 dark:bg-[#E4C174]/10 shadow-xs'
                          : 'border-border bg-white dark:bg-[#2D2D2D] hover:border-[#3027F5]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D]'
                              : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-sm text-foreground">
                            {opt.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{opt.hint}</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#3027F5] border-[#3027F5] text-white dark:bg-[#E4C174] dark:border-[#E4C174] dark:text-[#11100D]'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free item input */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                {formData.rewardCategory === 'percent'
                  ? 'Discount percent details'
                  : formData.rewardCategory === 'amount'
                  ? 'Amount off details'
                  : formData.rewardCategory === 'custom'
                  ? 'Custom reward description'
                  : 'Free item description'}
              </label>
              <input
                type="text"
                value={formData.rewardDescription}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    rewardDescription: e.target.value,
                    rewardValue: e.target.value,
                  }));
                  if (validationErrors.rewardDescription) {
                    setValidationErrors((prev) => ({ ...prev, rewardDescription: '' }));
                  }
                }}
                placeholder={
                  formData.rewardCategory === 'percent'
                    ? '10% off entire order'
                    : formData.rewardCategory === 'amount'
                    ? `${formData.currencySymbol || '$'}5 off next purchase`
                    : 'Free coffee'
                }
                className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.rewardCategory === 'item'
                  ? 'Start with "Free", e.g. "Free coffee".'
                  : 'Customers will see this printed on their reward voucher.'}
              </p>
              {validationErrors.rewardDescription && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.rewardDescription}</p>
              )}
            </div>

            {/* Reward Expiry Selector (Default Never expires) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Reward expiration
                </label>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Default: Never expires
                </span>
              </div>
              <select
                value={formData.rewardExpiry || 'Never expires'}
                onChange={(e) => setFormData((prev) => ({ ...prev, rewardExpiry: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-[#2D2D2D] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Displayed on your loyalty card as: <strong>1 stamp per visit · {formData.rewardExpiry || 'Never expires'}</strong>. You can also change this anytime from your dashboard.
              </p>
            </div>

            {/* Brand Accent Color */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                Card brand color
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, accentColor: c.hex }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      formData.accentColor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-foreground' : 'hover:scale-105'
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
        )}

        {/* ========================================================= */}
        {/* STEP 4: FINAL REVIEW CARD                                 */}
        {/* ========================================================= */}
        {formData.currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to launch</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                Review your loyalty card
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Here is how your loyalty pass will look to customers on mobile.
              </p>
            </div>

            {/* Interactive Loyalty Card Component */}
            <div className="py-2">
              <LoyaltyCard
                size="full"
                businessType={formData.businessType}
                businessName={formData.businessName || 'Your Business'}
                programName={formData.programName || 'Loyalty Card'}
                rewardDescription={formData.rewardDescription || 'Free reward'}
                rewardExpiry={formData.rewardExpiry || 'Never expires'}
                stampsRequired={formData.stampsRequired}
                accentColor={formData.accentColor || '#3027F5'}
                logoUrl={logoPreview || formData.logoUrl}
              />
            </div>

            {/* Detailed summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted border border-border space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground font-semibold uppercase">Business Name</span>
                <strong className="text-foreground">{formData.businessName}</strong>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground font-semibold uppercase">Category</span>
                <strong className="text-foreground">{currentBusinessConfig.title}</strong>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground font-semibold uppercase">Country & Currency</span>
                <strong className="text-foreground">{formData.country} ({formData.currency})</strong>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground font-semibold uppercase">Milestone & Reward</span>
                <strong className="text-foreground">{formData.stampsRequired} visits = {formData.rewardDescription}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold uppercase">Expiration Policy</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{formData.rewardExpiry || 'Never expires'}</strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You can adjust rewards, add staff members, and download your printable counter QR kit inside the dashboard.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* NAVIGATION CONTROLS                                       */}
        {/* ========================================================= */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          {formData.currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {formData.currentStep < 4 ? (
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
              <span>{isSubmitting ? 'Creating workspace…' : 'Complete Setup & Open Dashboard'}</span>
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
