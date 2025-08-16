// Core Types
export type Unit = "sats" | "BTC";
export type Layout = "grid" | "list";
export type AdType = "all" | "sell" | "want";

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
  score: number;
  deals: number;
  rating: number;
  verifications: {
    email?: boolean;
    phone?: boolean;
    lnurl?: boolean;
  };
  onTimeRelease: number;
};

export type Listing = {
  id: string;
  title: string;
  desc: string;
  priceSats: number;
  category: Category | Exclude<string, never>;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  images: string[];
  boostedUntil: number | null;
  seller: Seller;
  createdAt: number;
  postedBy?: string;
};

export type SavedSearch = {
  id: string;
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
  id: string;
  email: string;
  handle: string;
  image?: string;
  rating?: number;
  deals?: number;
};

// Chat Types
export type Message = {
  id: string;
  chatId: string;
  fromId: string;
  text: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: number;
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
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
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
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
};

// Form Types
export type ListingForm = {
  title: string;
  desc: string;
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
  handle: string;
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
  sortBy?: "price" | "date" | "rating" | "boosted";
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

export type SortOption = {
  field: string;
  order: "asc" | "desc";
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

// Analytics Types
export type ListingAnalytics = {
  views: number;
  clicks: number;
  messages: number;
  escrowProposals: number;
  conversionRate: number;
};
