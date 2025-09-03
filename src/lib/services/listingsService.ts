/**
 * Listings Service
 * Provides consistent listings data management across the application
 */

import { apiService, apiUtils } from './apiService';
import { ErrorHandler } from '@/lib/error/errorHandler';
import type { Listing, ListingsResponse, ListingFilters } from '@/lib/types';

export interface ListingsFilters {
  limit?: number;
  offset?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  query?: string;
  category?: string;
  adType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

export class ListingsService {
  /**
   * Get listings with filters
   */
  async getListings(filters: ListingsFilters = {}): Promise<ListingsResponse> {
    try {
      const queryString = apiUtils.createQueryString(filters);
      const endpoint = `/api/listings${queryString ? `?${queryString}` : ''}`;
      
      return await apiService.get<ListingsResponse>(endpoint);
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Get listings');
    }
  }

  /**
   * Get listing by ID
   */
  async getListing(id: string): Promise<Listing> {
    try {
      const response = await apiService.get<{ listing: Listing }>(`/api/listings/${id}`);
      return response.listing;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      throw ErrorHandler.handleGenericError(error, 'Get listing');
    }
  }

  /**
   * View a listing (increment view count)
   */
  async viewListing(id: string): Promise<void> {
    try {
      await apiService.post(`/api/listings/${id}/view`);
    } catch (error) {
      // Don't throw error for view tracking failures
      console.warn('Failed to track listing view:', error);
    }
  }

  /**
   * Create a new listing
   */
  async createListing(listing: Partial<Listing>): Promise<Listing> {
    try {
      const response = await apiService.post<{ listing: Listing }>('/api/listings', listing);
      return response.listing;
    } catch (error) {
      if (error instanceof Error && error.message.includes('400')) {
        throw ErrorHandler.handleValidationError('Invalid listing data');
      }
      throw ErrorHandler.handleGenericError(error, 'Create listing');
    }
  }

  /**
   * Update a listing
   */
  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    try {
      const response = await apiService.put<{ listing: Listing }>(`/api/listings/${id}`, updates);
      return response.listing;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      if (error instanceof Error && error.message.includes('400')) {
        throw ErrorHandler.handleValidationError('Invalid listing data');
      }
      throw ErrorHandler.handleGenericError(error, 'Update listing');
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    try {
      await apiService.delete(`/api/listings/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      throw ErrorHandler.handleGenericError(error, 'Delete listing');
    }
  }

  /**
   * Boost a listing
   */
  async boostListing(id: string, duration: number): Promise<void> {
    try {
      await apiService.post(`/api/listings/${id}/boost`, { duration });
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      throw ErrorHandler.handleGenericError(error, 'Boost listing');
    }
  }

  /**
   * Get listing images
   */
  async getListingImages(id: string): Promise<string[]> {
    try {
      const response = await apiService.get<{ images: string[] }>(`/api/listings/${id}/images`);
      return response.images;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      throw ErrorHandler.handleGenericError(error, 'Get listing images');
    }
  }

  /**
   * Upload listing images
   */
  async uploadListingImages(id: string, images: File[]): Promise<string[]> {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await apiService.post<{ images: string[] }>(`/api/listings/${id}/images`, formData, {
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        }
      });
      
      return response.images;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Listing', id);
      }
      throw ErrorHandler.handleGenericError(error, 'Upload listing images');
    }
  }
}

/**
 * Default listings service instance
 */
export const listingsService = new ListingsService();
