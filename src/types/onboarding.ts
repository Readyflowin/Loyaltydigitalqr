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
  // Step 1: Business Basics
  businessName: string;
  businessType: BusinessType;
  region: OperatingRegion;
  timeZone: string;
  logoInitial: string;

  // Step 2: Selected Modules
  selectedModules: string[];

  // Step 3: Business Details
  contactEmail: string;
  address?: string;
  phoneNumber?: string;
  displayName?: string;
  locationType: 'first' | 'additional';

  // Step 4: Loyalty Program Configuration
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  accentColor: string;

  // Workflow State
  currentStep: number;
  isCompleted: boolean;
  planContext?: string;
  completedAt?: string;
}
