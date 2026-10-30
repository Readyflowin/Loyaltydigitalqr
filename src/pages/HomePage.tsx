import React from 'react';
import type { ThemeMode, StoreItem } from '../types';
import { HeroSection } from '../components/hero/HeroSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { MasterWalletFeatureStory } from '../components/sections/MasterWalletFeatureStory';
import { IndustriesSection } from '../components/sections/IndustriesSection';
import { BenefitsSection } from '../components/sections/BenefitsSection';
import { FaqSection } from '../components/sections/FaqSection';
import { FinalCtaSection } from '../components/sections/FinalCtaSection';

interface HomePageProps {
  theme: ThemeMode;
  onOpenCardBuilder: (industryId?: string) => void;
  onOpenVideoDemo: () => void;
  onViewReward: (store?: StoreItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  theme,
  onOpenCardBuilder,
  onOpenVideoDemo,
  onViewReward,
}) => {
  return (
    <>
      {/* Section A: Hero (Light: reference image product collage / Dark: interactive Master Loyalty Card) */}
      <HeroSection
        theme={theme}
        onOpenCardBuilder={() => onOpenCardBuilder()}
        onOpenVideoDemo={onOpenVideoDemo}
        onViewReward={onViewReward}
      />

      {/* Section B: Three-Step "How it works" */}
      <HowItWorksSection
        theme={theme}
        onOpenCardBuilder={() => onOpenCardBuilder()}
      />

      {/* Section C: Master Loyalty Card Product Story */}
      <MasterWalletFeatureStory
        theme={theme}
        onViewReward={onViewReward}
        onOpenCardBuilder={() => onOpenCardBuilder()}
      />

      {/* Section D: Industry Use Cases */}
      <IndustriesSection
        theme={theme}
        onSelectIndustry={(indId) => onOpenCardBuilder(indId)}
      />

      {/* Section E: Product Benefits */}
      <BenefitsSection theme={theme} />

      {/* Section F: Pricing Section REMOVED from homepage per Task 1 specifications */}

      {/* Section G: FAQ Accordion */}
      <FaqSection theme={theme} />

      {/* Section H: Final CTA */}
      <FinalCtaSection
        theme={theme}
        onOpenCardBuilder={() => onOpenCardBuilder()}
        onOpenVideoDemo={onOpenVideoDemo}
      />
    </>
  );
};
