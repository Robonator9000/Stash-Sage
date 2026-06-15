export interface Product {
  id: string;
  name: string;
  strain: string;
  type: string;
  thc: number;
  cbd: number;
  amount: number; // Always in grams
  price: number;
  picture?: string;
  pictures?: string[];
  notes?: string;
  rating: number;
  brand?: string;
  tags?: string;
  effects?: string;
  consumptionCount: number;
  lastConsumed?: Date;
  purchasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  favorite: boolean;
}

export interface Settings {
  language: 'en' | 'es' | 'fr' | 'de' | 'pt';
  theme: 'dark' | 'light';
  themeAuto: boolean;
  onboardingDone: boolean;
  coachMarksDone?: boolean;
  currency: string;
  statsVisibility: {
    totalProducts: boolean;
    totalAmount: boolean;
    totalSessions: boolean;
    averageRating: boolean;
    averageTHC: boolean;
    totalValue: boolean;
    pricePerGram: boolean;
    lastConsumed: boolean;
    consumptionRate: boolean;
    projectedRunOut: boolean;
  };
  decimalPrecision: number;
  showTimerMs: boolean;
  pinEnabled: boolean;
  pinHash: string;
  favoriteBrands: string[];
  recentBrands: string[];
  sessionDefaults: {
    defaultAmount: number;
    defaultPeople: number;
    defaultHitTimer: number;
    defaultGramsPerBowl: number;
    rotationEnabled: boolean;
  };
  lowStockThreshold: number;
  budgetLimit: number;
  budgetPeriod: 'weekly' | 'monthly' | 'yearly';
  settingsVersion?: number;
  customStrainColors?: Record<string, string>;
  profile?: Profile;
}

export interface Profile {
  username: string;
  bio: string;
  joinedAt: string;
}

export interface Session {
  id: string;
  productId: string;
  productName: string;
  date: Date;
  amount: number;
  people: number;
  hitsCount: number;
  notes: string;
  bowlsPerPerson: number;
  personHits?: number[];
  rotationEnabled?: boolean;
}

export type SortOption = 'newest' | 'oldest' | 'name' | 'rating' | 'thc' | 'amount' | 'price' | 'favorites';
export type FilterType = string;
