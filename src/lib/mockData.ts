import { Listing, User, Category, AdType } from './types';

// Mock users - using same usernames as database for consistency
export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'satoshi@example.com',
    handle: '@satoshi',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    deals: 12
  },
  {
    id: 'user2',
    email: 'luna@example.com',
    handle: '@luna',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    deals: 8
  },
  {
    id: 'user3',
    email: 'rob@example.com',
    handle: '@rob',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 4.7,
    deals: 15
  },
  {
    id: 'user4',
    email: 'mika@example.com',
    handle: '@mika',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 4.6,
    deals: 9
  },
  {
    id: 'user5',
    email: 'arya@example.com',
    handle: '@arya',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.5,
    deals: 6
  },
  {
    id: 'user6',
    email: 'nova@example.com',
    handle: '@nova',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 4.4,
    deals: 11
  },
  {
    id: 'user7',
    email: 'kai@example.com',
    handle: '@kai',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 4.3,
    deals: 7
  },
  {
    id: 'user8',
    email: 'zen@example.com',
    handle: '@zen',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.2,
    deals: 13
  },
  {
    id: 'user9',
    email: 'olivia@example.com',
    handle: '@olivia',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 4.1,
    deals: 5
  },
  {
    id: 'user10',
    email: 'noah@example.com',
    handle: '@noah',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 4.0,
    deals: 8
  }
];

// Mock listings
export const mockListings: Listing[] = [
  {
    id: 'listing1',
    title: 'Antminer S19 XP Hyd',
    desc: 'Excellent condition mining rig, 255TH/s, only used for 6 months. Perfect for home mining setup. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 2500000, // 0.025 BTC
    category: 'Mining Gear' as const,
    type: 'sell' as const,
    location: 'Toronto, ON',
    lat: 43.6532,
    lng: -79.3832,
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=300&fit=crop'
    ],
    boostedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    seller: {
      name: mockUsers[0].handle, // @satoshi
      score: 28,
      deals: mockUsers[0].deals || 0,
      rating: mockUsers[0].rating || 5,
      verifications: { email: true, phone: true, lnurl: true },
      onTimeRelease: 0.98
    }
  },
  {
    id: 'listing2',
    title: 'Bitcoin Node Setup Service',
    desc: 'Professional Bitcoin node installation and configuration. I\'ll set up your full node with proper security. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 500000, // 0.005 BTC
    category: 'Services' as const,
    type: 'sell' as const,
    location: 'Vancouver, BC',
    lat: 49.2827,
    lng: -123.1207,
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'
    ],
    boostedUntil: null, // Not boosted
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    seller: {
      name: mockUsers[1].handle,
      score: 15,
      deals: mockUsers[1].deals || 0,
      rating: mockUsers[1].rating || 5,
      verifications: { email: true, phone: true, lnurl: false },
      onTimeRelease: 0.95
    }
  },
  {
    id: 'listing3',
    title: 'Looking for: Cold Storage Wallet',
    desc: 'Want to buy a hardware wallet (Ledger, Trezor, or similar) in good condition. Must be genuine. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 300000, // 0.003 BTC
    category: 'Electronics' as const,
    type: 'want' as const,
    location: 'Montreal, QC',
    lat: 45.5017,
    lng: -73.5673,
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'
    ],
    boostedUntil: null, // Not boosted
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    seller: {
      name: mockUsers[2].handle,
      score: 22,
      deals: mockUsers[2].deals || 0,
      rating: mockUsers[2].rating || 5,
      verifications: { email: true, phone: false, lnurl: true },
      onTimeRelease: 0.93
    }
  },
  {
    id: 'listing4',
    title: 'Bitcoin Mining Books Collection',
    desc: 'Complete set of Bitcoin and mining books. Includes "Mastering Bitcoin", "Programming Bitcoin", and more. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 150000, // 0.0015 BTC
    category: 'Games & Hobbies' as const,
    type: 'sell' as const,
    location: 'Calgary, AB',
    lat: 51.0447,
    lng: -114.0719,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop'
    ],
    boostedUntil: null, // Not boosted
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    seller: {
      name: mockUsers[0].handle,
      score: 28,
      deals: mockUsers[0].deals || 0,
      rating: mockUsers[0].rating || 5,
      verifications: { email: true, phone: true, lnurl: true },
      onTimeRelease: 0.98
    }
  },
  {
    id: 'listing5',
    title: 'Home Garden Bitcoin Mining Setup',
    desc: 'Complete home mining setup with solar panels. Includes 2 Antminer S9s and solar installation. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 8000000, // 0.08 BTC
    category: 'Home & Garden' as const,
    type: 'sell' as const,
    location: 'Ottawa, ON',
    lat: 45.4215,
    lng: -75.6972,
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop'
    ],
    boostedUntil: null, // Not boosted
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    seller: {
      name: mockUsers[1].handle,
      score: 15,
      deals: mockUsers[1].deals || 0,
      rating: mockUsers[1].rating || 5,
      verifications: { email: true, phone: true, lnurl: false },
      onTimeRelease: 0.95
    }
  },
  {
    id: 'listing6',
    title: 'Bitcoin Meetup Organizer',
    desc: 'Looking for someone to help organize monthly Bitcoin meetups in the area. Will pay in sats! ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(60),
    priceSats: 100000, // 0.001 BTC
    category: 'Services' as const,
    type: 'want' as const,
    location: 'Edmonton, AB',
    lat: 53.5461,
    lng: -113.4938,
    images: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop'
    ],
    boostedUntil: null, // Not boosted
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    seller: {
      name: mockUsers[2].handle,
      score: 22,
      deals: mockUsers[2].deals || 0,
      rating: mockUsers[2].rating || 5,
      verifications: { email: true, phone: false, lnurl: true },
      onTimeRelease: 0.93
    }
  }
];

// Mock saved searches
export const mockSavedSearches = [
  {
    id: 'search1',
    name: 'Mining Gear • Toronto • 25km • All',
    query: '',
    category: 'Mining Gear' as const,
    adType: 'all' as const,
    center: { name: 'Toronto, ON', lat: 43.6532, lng: -79.3832 },
    radiusKm: 25,
    notify: true,
    lastOpenedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    newCount: 2
  },
  {
    id: 'search2',
    name: 'Electronics • Vancouver • 15km • Selling',
    query: '',
    category: 'Electronics' as const,
    adType: 'sell' as const,
    center: { name: 'Vancouver, BC', lat: 49.2827, lng: -123.1207 },
    radiusKm: 15,
    notify: true,
    lastOpenedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    newCount: 0
  }
];
