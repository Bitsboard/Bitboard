import { z } from 'zod';

// Validation schemas for listings API
export const listingsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    q: z.string().optional(),
    category: z.string().optional(),
    adType: z.enum(['sell', 'want']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['date', 'price', 'distance', 'rating', 'boosted']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(0).max(1000).optional(),
});

export const listingCreateSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    category: z.enum(['Mining Gear', 'Electronics', 'Services', 'Home & Garden', 'Games & Hobbies', 'Office', 'Sports & Outdoors']),
    adType: z.enum(['sell', 'want']),
    location: z.string().max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    imageUrl: z.string().url().optional(),
    priceSat: z.number().positive(),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export type ListingsQuery = z.infer<typeof listingsQuerySchema>;
export type ListingCreate = z.infer<typeof listingCreateSchema>;
export type ListingUpdate = z.infer<typeof listingUpdateSchema>;
