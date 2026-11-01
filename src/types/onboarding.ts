export type BusinessType =
  | 'cafe'
  | 'restaurant'
  | 'salon'
  | 'retail'
  | 'gym'
  | 'carwash'
  | 'service';

export type OperatingRegion = 'usa' | 'india' | 'other';

export interface ModuleItem {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'planned';
  isDefault?: boolean;
}

export interface BusinessTypeConfig {
  id: BusinessType;
  title: string;
  subtitle: string;
  iconName: 'Coffee' | 'UtensilsCrossed' | 'Scissors' | 'ShoppingBag' | 'Dumbbell' | 'Car' | 'Briefcase';
  defaultProgramName: string;
  defaultStamps: number;
  defaultReward: string;
  recommendedModules: ModuleItem[];
}

export interface OnboardingData {
  // Business Basics & Details
  businessName: string;
  businessType: BusinessType;
  region: OperatingRegion;
  country?: string;
  currency?: string;
  currencySymbol?: string;
  timeZone: string;
  logoInitial: string;
  logoUrl?: string | null;

  // Selected Modules
  selectedModules: string[];

  // Contact Details
  contactEmail: string;
  address?: string;
  phoneNumber?: string;
  displayName?: string;
  locationType: 'first' | 'additional';

  // Loyalty Program Configuration
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  rewardCategory?: 'item' | 'percent' | 'amount' | 'custom';
  rewardValue?: string;
  rewardExpiry?: string; // e.g. "Never expires"
  accentColor: string;

  // Workflow State
  currentStep: number;
  isCompleted: boolean;
  planContext?: string;
  completedAt?: string;
}
