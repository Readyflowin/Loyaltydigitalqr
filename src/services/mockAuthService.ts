import type { MockUser } from '../types/auth';
import type { OnboardingData, OperatingRegion } from '../types/onboarding';

const STORAGE_KEYS = {
  USER: 'loyalty_mock_auth_user',
  DRAFT: 'loyalty_onboarding_draft',
  COMPLETED: 'loyalty_onboarding_completed',
};

/**
 * Initial empty / default onboarding configuration
 */
export function getDefaultOnboardingData(region: OperatingRegion = 'usa', planContext = 'starter'): OnboardingData {
  return {
    businessName: '',
    businessType: 'cafe',
    region,
    timeZone: region === 'india' ? 'Asia/Kolkata' : 'America/New_York',
    logoInitial: 'L',
    selectedModules: ['loyalty-cards'],
    contactEmail: '',
    address: '',
    phoneNumber: '',
    displayName: '',
    locationType: 'first',
    programName: 'Coffee Regulars Club',
    stampsRequired: 8,
    rewardDescription: 'Buy 8 coffees, get your 9th drink free',
    accentColor: '#3027F5',
    currentStep: 1,
    isCompleted: false,
    planContext,
  };
}

class MockAuthService {
  /**
   * Get current mock user session (if any)
   */
  getCurrentUser(): MockUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) return null;
      return JSON.parse(data) as MockUser;
    } catch {
      return null;
    }
  }

  /**
   * Demo sign in with Google (strictly non-production demo session)
   */
  async signInWithMockGoogle(): Promise<{ user: MockUser; isNewUser: boolean }> {
    const mockUser: MockUser = {
      id: 'mock_usr_' + Math.random().toString(36).substring(2, 9),
      email: 'alex.merchant@example.com',
      displayName: 'Alex Merchant',
      avatarUrl: '',
      isMock: true,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    }

    // Check if onboarding was already completed
    const existingCompleted = this.getCompletedOnboarding();
    const isNewUser = !existingCompleted;

    return { user: mockUser, isNewUser };
  }

  /**
   * Demo sign in with Email
   */
  async signInWithMockEmail(email: string): Promise<MockUser> {
    const cleanEmail = email.trim() || 'demo.owner@example.com';
    const mockUser: MockUser = {
      id: 'mock_usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      isMock: true,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    }

    return mockUser;
  }

  /**
   * Demo sign up with Google
   */
  async signUpWithMockGoogle(options?: { region?: OperatingRegion; plan?: string }): Promise<MockUser> {
    const mockUser: MockUser = {
      id: 'mock_usr_' + Math.random().toString(36).substring(2, 9),
      email: 'founder@mybusiness.com',
      displayName: 'New Merchant',
      isMock: true,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    }

    // Initialize draft with region
    const draft = this.getOnboardingDraft();
    if (!draft) {
      this.saveOnboardingDraft(getDefaultOnboardingData(options?.region || 'usa', options?.plan || 'starter'));
    }

    return mockUser;
  }

  /**
   * Sign out mock user
   */
  signOut(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  /**
   * Retrieve active onboarding draft
   */
  getOnboardingDraft(): OnboardingData | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (!data) return null;
      return JSON.parse(data) as OnboardingData;
    } catch {
      return null;
    }
  }

  /**
   * Save / update onboarding draft in local browser storage
   */
  saveOnboardingDraft(draft: Partial<OnboardingData>): OnboardingData {
    if (typeof window === 'undefined') {
      return { ...getDefaultOnboardingData(), ...draft };
    }

    const current = this.getOnboardingDraft() || getDefaultOnboardingData();
    const updated: OnboardingData = { ...current, ...draft };
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(updated));
    return updated;
  }

  /**
   * Clear active draft
   */
  clearOnboardingDraft(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    }
  }

  /**
   * Complete mock onboarding and store finalized configuration
   */
  async completeOnboarding(data: OnboardingData): Promise<{ success: boolean; data: OnboardingData; isMock: true }> {
    const finalized: OnboardingData = {
      ...data,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(finalized));
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(finalized));
    }

    return {
      success: true,
      data: finalized,
      isMock: true,
    };
  }

  /**
   * Get previously completed onboarding configuration
   */
  getCompletedOnboarding(): OnboardingData | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED);
      if (!data) return null;
      return JSON.parse(data) as OnboardingData;
    } catch {
      return null;
    }
  }
}

export const mockAuthService = new MockAuthService();
