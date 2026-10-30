import React from 'react';
import type { ThemeMode } from '../../types';
import type { BusinessType } from '../../types/onboarding';
import { LoyaltyCard } from '../ui';

interface LoyaltyCardPreviewProps {
  businessName: string;
  programName: string;
  stampsRequired: number;
  rewardDescription: string;
  accentColor: string;
  theme: ThemeMode;
  businessType?: BusinessType;
  currentStamps?: number;
}

/**
 * Thin wrapper kept for existing callers (onboarding, dashboard, loyalty views).
 * Renders the shared, category-themed {@link LoyaltyCard}.
 */
export const LoyaltyCardPreview: React.FC<LoyaltyCardPreviewProps> = ({
  businessName,
  programName,
  stampsRequired,
  rewardDescription,
  accentColor,
  businessType,
  currentStamps,
}) => (
  <LoyaltyCard
    businessType={businessType}
    businessName={businessName}
    programName={programName}
    stampsRequired={stampsRequired}
    rewardDescription={rewardDescription}
    accentColor={accentColor}
    currentStamps={currentStamps}
  />
);
