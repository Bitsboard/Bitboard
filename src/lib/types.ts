// Core Types
export type Unit = "sats" | "BTC";
export type Layout = "grid" | "list";
export type AdType = "all" | "sell" | "want";
export type Theme = "light" | "dark";

export type Category =
  | "Featured"
  | "Electronics"
  | "Mining Gear"
  | "Home & Garden"
  | "Sports & Bikes"
  | "Tools"
  | "Games & Hobbies"
  | "Furniture"
  | "Services";

export type Place = {
  name: string;
  lat: number;
  lng: number;
};

export type Seller = {
  name: string;
  thumbsUp: number; // Number of thumbs up received (not 0-5 rating)
  deals: number;
  verifications: {
    email?: boolean;
    phone?: boolean;
    lnurl?: boolean;
  };
  onTimeRelease: number;
};

export type PricingType = "fixed" | "make_offer";

export type Listing = {
  id: string; // Now 10 alphanumeric characters
  title: string;
  description: string; // Standardized to description
  priceSats: number; // -1 indicates "make offer", >= 0 for fixed prices
  pricingType: PricingType; // "fixed" or "make_offer"
  category: Category | Exclude<string, never>;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  images: string[];
  boostedUntil: number | null;
  seller: Seller;
  createdAt: number;
  postedBy?: string; // Now 8 alphanumeric characters
  views?: number; // View count for the listing
};

export type SavedSearch = {
  id: string; // Now 10 alphanumeric characters
  name: string;
  notify: boolean;
  lastOpenedAt: number;
  newCount: number;
  query: string;
  category: Category;
  center: Place;
  radiusKm: number;
  adType: AdType;
};

export type User = {
  id: string; // Now 8 alphanumeric characters
  email: string;
  handle?: string | null;
  hasChosenUsername: boolean;
  image?: string;
  thumbsUp?: number; // Number of thumbs up received (not 0-5 rating)
  deals?: number;
};

// Chat Types
export type Message = {
  id: string; // Now 10 alphanumeric characters
  chat_id: string; // Now 10 alphanumeric characters
  from_id: string; // Now 8 alphanumeric characters
  text: string;
  created_at: number;
  read_at?: number;
};

export type Chat = {
  id: string; // Now 10 alphanumeric characters
  listing_id: string; // Now 10 alphanumeric characters
  buyer_id: string; // Now 8 alphanumeric characters
  seller_id: string; // Now 8 alphanumeric characters
  created_at: number;
  last_message_at: number;
  messages: Message[];
};

// Escrow Types
export type EscrowStatus =
  | "PROPOSED"
  | "FUNDED"
  | "RELEASED"
  | "REFUND_REQUESTED"
  | "REFUNDED"
  | "DISPUTED";

export type Escrow = {
  id: string; // Now 10 alphanumeric characters
  listingId: string; // Now 10 alphanumeric characters
  buyerId: string; // Now 8 alphanumeric characters
  sellerId: string; // Now 8 alphanumeric characters
  amountSats: number;
  feeSats: number;
  holdInvoice: string;
  status: EscrowStatus;
  createdAt: number;
  updatedAt: number;
};

// API Response Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type RateResponse = {
  cad: number | null;
  updatedAt?: string;
};

export type ListingsResponse = {
  success: boolean;
  data: {
    listings: Listing[];
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Form Types
export type ListingForm = {
  title: string;
  description: string; // Standardized to description
  priceSats: number;
  category: Category;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  imageUrl: string;
};

export type AuthForm = {
  email: string;
  handle?: string;
};

// Filter Types
export type ListingFilters = {
  query?: string;
  category?: Category;
  adType?: AdType;
  center?: Place;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "date" | "rating" | "boosted" | "distance";
  sortOrder?: "asc" | "desc";
};

// Notification Types
export type Notification = {
  id: string;
  userId: string;
  type: "message" | "escrow" | "listing" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, any>;
};

// Utility Types
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Component Props Types
export type BaseComponentProps = {
  className?: string;
  children?: React.ReactNode;
};

export type ThemeProps = {
  dark: boolean;
};

// Event Types
export type ListingEvent =
  | "created"
  | "updated"
  | "deleted"
  | "boosted"
  | "expired";

export type EscrowEvent =
  | "proposed"
  | "funded"
  | "released"
  | "refunded"
  | "disputed";

// Search Types
export type SearchResult = {
  listings: Listing[];
  total: number;
  filters: ListingFilters;
  suggestions?: string[];
};

// Settings Types
export type UserSettings = {
  theme: Theme;
  unit: Unit;
  layout: Layout;
};

// Session Types - Consolidated
export type Session = {
  user?: {
    username?: string | null;
    image?: string | null;
    email: string;
    id: string;
    verified?: boolean;
    isAdmin?: boolean;
  };
  account?: {
    sso: string;
    email: string;
    username: string | null;
    verified: boolean;
    registeredAt: number;
    profilePhoto?: string | null;
    listings: Array<{
      id: number;
      title: string;
      priceSat: number;
      createdAt: number;
      type: string;
    }>;
  } | null;
} | null;

// Profile Types - Consolidated with Session
export type ProfileData = {
  sso: string;
  email: string;
  username: string | null;
  verified: boolean;
  registeredAt: number;
  profilePhoto?: string | null;
  listings: Array<{
    id: number;
    title: string;
    priceSat: number;
    createdAt: number;
    type: string;
  }>;
} | null;

// Sort Types
export type SortOptionProfile = 'alphabetical' | 'newest' | 'oldest';

// Country Expansion Types
export type CountryExpansion = Record<string, string>;

// Location Types
export type LocationData = {
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
};
