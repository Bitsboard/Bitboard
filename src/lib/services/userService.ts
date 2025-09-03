/**
 * User Service
 * Provides consistent user data management across the application
 */

import { apiService, apiUtils } from './apiService';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface User {
  id: string;
  email: string;
  username?: string;
  verified?: boolean;
  isAdmin?: boolean;
  hasChosenUsername?: boolean;
  image?: string;
  thumbsUp?: number;
  deals?: number;
  lastActive?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  verified: boolean;
  registeredAt: number;
  profilePhoto?: string;
  rating: number;
  deals: number;
  lastActive: number;
}

export interface UserListingsResponse {
  user: UserProfile;
  listings: any[];
  count: number;
}

export class UserService {
  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.get<{ user: User }>('/api/users/me');
      return response.user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        return null; // User not authenticated
      }
      throw ErrorHandler.handleGenericError(error, 'Get current user');
    }
  }

  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<UserProfile> {
    try {
      const response = await apiService.get<{ user: UserProfile; listingCount: number }>(`/api/users/${username}`);
      return response.user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('User', username);
      }
      throw ErrorHandler.handleGenericError(error, 'Get user profile');
    }
  }

  /**
   * Get user listings by username
   */
  async getUserListings(username: string): Promise<UserListingsResponse> {
    try {
      return await apiService.get<UserListingsResponse>(`/api/users/${username}/listings`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('User', username);
      }
      throw ErrorHandler.handleGenericError(error, 'Get user listings');
    }
  }

  /**
   * Set username for current user
   */
  async setUsername(username: string): Promise<void> {
    try {
      await apiService.post('/api/users/set-username', { username });
    } catch (error) {
      if (error instanceof Error && error.message.includes('400')) {
        throw ErrorHandler.handleValidationError('Username is already taken or invalid');
      }
      throw ErrorHandler.handleGenericError(error, 'Set username');
    }
  }

  /**
   * Check if username is available
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ available: boolean }>(`/api/users/check-username?username=${username}`);
      return response.available;
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Check username availability');
    }
  }

  /**
   * Reset user reputation
   */
  async resetReputation(): Promise<void> {
    try {
      await apiService.post('/api/users/reset-reputation');
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Reset reputation');
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<void> {
    try {
      await apiService.post('/api/users/block', { userId });
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Block user');
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      await apiService.delete(`/api/users/block?userId=${userId}`);
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Unblock user');
    }
  }

  /**
   * Get user's blocklist
   */
  async getBlocklist(): Promise<User[]> {
    try {
      const response = await apiService.get<{ blockedUsers: User[] }>('/api/users/blocklist');
      return response.blockedUsers;
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Get blocklist');
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ blocked: boolean }>(`/api/users/block-status?userId=${userId}`);
      return response.blocked;
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Check block status');
    }
  }
}

/**
 * Default user service instance
 */
export const userService = new UserService();
