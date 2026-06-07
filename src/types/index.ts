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
  notes?: string;
  rating: number;
  brand?: string;
  consumptionCount: number;
  lastConsumed?: Date;
  createdAt: Date;
  updatedAt: Date;
  favorite: boolean;
}

export interface Settings {
  language: 'en' | 'es' | 'fr' | 'de' | 'pt';
  theme: 'dark' | 'light';
  currency: string;
  statsVisibility: {
    totalProducts: boolean;
    totalAmount: boolean;
    totalSessions: boolean;
    averageRating: boolean;
    averageTHC: boolean;
    totalValue: boolean;
    lastConsumed: boolean;
  };
  favoriteBrands: string[];
  recentBrands: string[];
  sessionDefaults: {
    defaultAmount: number;
    defaultPeople: number;
    defaultHitTimer: number;
    defaultGramsPerBowl: number;
    rotationEnabled: boolean;
  };
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
export type ViewLayout = 'grid' | 'list' | 'compact';