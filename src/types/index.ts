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
  notificationsSound?: boolean;
  notificationsEnabled?: boolean;
  defaultFeedFilter?: 'latest' | 'following' | 'trending';
  showOnlineStatus?: boolean;
  showLocation?: boolean;
}

export interface ContactEntry {
  platform: string;
  value: string;
}

export interface Profile {
  username: string;
  displayName?: string;
  bio: string;
  joinedAt: string;
  avatar_url?: string;
  banner_url?: string;
  contacts: ContactEntry[];
  location?: string;
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

export interface Post {
  id: string;
  user_id: string;
  content: string;
  product_id?: string | null;
  product_name?: string | null;
  image_url?: string | null;
  images?: string[];
  quoted_post_id?: string | null;
  pinned?: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  likes_count?: number;
  liked_by_me?: boolean;
  comments_count?: number;
  is_following?: boolean;
  bookmarked_by_me?: boolean;
  quoted_post?: Post;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  author?: {
    username: string;
    avatar_url?: string;
  };
  replies?: PostComment[];
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'new_listing' | 'listing_sold' | 'mention';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id?: string | null;
  listing_id?: string | null;
  listing_title?: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    username: string;
    avatar_url?: string;
  };
}

export interface PriceOption {
  amount: number;
  price: number;
}

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  price_options?: PriceOption[];
  category: string;
  product_id?: string | null;
  product_name?: string | null;
  contact_platform: string;
  contact_value: string;
  image_url?: string | null;
  images?: string[];
  status: 'active' | 'sold';
  created_at: string;
  updated_at: string;
  saved_by_me?: boolean;
  avg_seller_rating?: number;
  seller_review_count?: number;
  author?: {
    username: string;
    avatar_url?: string;
  };
}

export interface ListingReview {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  author?: {
    username: string;
    avatar_url?: string;
  };
}

export const CONTACT_PLATFORMS = [
  'email',
  'phone',
  'discord',
  'telegram',
  'instagram',
  'snapchat',
  'signal',
  'whatsapp',
  'chat',
  'other',
] as const;

export const MARKETPLACE_CATEGORIES = [
  'flower',
  'concentrate',
  'edible',
  'cartridge',
  'pre-roll',
  'tincture',
  'topical',
  'seeds',
  'accessories',
  'other',
] as const;

export type SortOption = 'newest' | 'oldest' | 'name' | 'rating' | 'thc' | 'amount' | 'price' | 'favorites';
export type FilterType = string;

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Mention {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listing?: MarketplaceListing;
  other_user?: { username: string; avatar_url?: string };
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  read: boolean;
  created_at: string;
  image_url?: string;
  read_at?: string;
  edited_at?: string;
  deleted_at?: string;
  reply_to_id?: string;
  reply_to?: { content: string; user_id: string };
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}
