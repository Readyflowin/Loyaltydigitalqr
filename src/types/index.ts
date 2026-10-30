export type ThemeMode = 'light' | 'dark';

export interface StoreItem {
  id: string;
  initial: string;
  name: string;
  category: string;
  currentStamps: number;
  maxStamps: number;
  rewardRule: string;
  rewardTitle: string;
  rewardSubtitle: string;
  rewardCode: string;
  iconName: 'Flame' | 'Scissors' | 'Coffee' | 'Utensils' | 'Car' | 'Fuel' | 'Dumbbell';
  accentColor?: string;
}

export interface IndustryItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  stampsRequired: number;
  sampleReward: string;
  benefit: string;
  tags: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  iconColor: 'lime' | 'cobalt';
}
