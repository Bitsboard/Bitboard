/**
 * Chat Service
 * Provides consistent chat data management across the application
 */

import { apiService, apiUtils } from './apiService';
import { ErrorHandler } from '@/lib/error/errorHandler';
import type { Message, Chat } from '@/lib/types';

export interface ChatListResponse {
  success: boolean;
  chats: Chat[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatMessagesResponse {
  success: boolean;
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface SendMessageRequest {
  chatId: string;
  text: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export class ChatService {
  /**
   * Get user's chat list
   */
  async getChatList(): Promise<ChatListResponse> {
    try {
      return await apiService.get<ChatListResponse>('/api/chat/list');
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, 'Get chat list');
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(chatId: string, page: number = 1, limit: number = 50): Promise<ChatMessagesResponse> {
    try {
      const queryString = apiUtils.createQueryString({ page, limit });
      const endpoint = `/api/chat/${chatId}${queryString ? `?${queryString}` : ''}`;
      
      return await apiService.get<ChatMessagesResponse>(endpoint);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Chat', chatId);
      }
      throw ErrorHandler.handleGenericError(error, 'Get chat messages');
    }
  }

  /**
   * Send a message
   */
  async sendMessage(chatId: string, text: string): Promise<SendMessageResponse> {
    try {
      return await apiService.post<SendMessageResponse>('/api/chat/send', {
        chatId,
        text
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Chat', chatId);
      }
      if (error instanceof Error && error.message.includes('400')) {
        throw ErrorHandler.handleValidationError('Invalid message data');
      }
      throw ErrorHandler.handleGenericError(error, 'Send message');
    }
  }

  /**
   * Hide a conversation
   */
  async hideConversation(chatId: string): Promise<void> {
    try {
      await apiService.post('/api/chat/hide', { chatId });
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Chat', chatId);
      }
      throw ErrorHandler.handleGenericError(error, 'Hide conversation');
    }
  }

  /**
   * Unhide a conversation
   */
  async unhideConversation(chatId: string): Promise<void> {
    try {
      await apiService.delete(`/api/chat/hide?chatId=${chatId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Chat', chatId);
      }
      throw ErrorHandler.handleGenericError(error, 'Unhide conversation');
    }
  }

  /**
   * Get chat by ID
   */
  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await apiService.get<{ chat: Chat }>(`/api/chat/${chatId}`);
      return response.chat;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw ErrorHandler.handleNotFoundError('Chat', chatId);
      }
      throw ErrorHandler.handleGenericError(error, 'Get chat');
    }
  }

  /**
   * Create a new chat
   */
  async createChat(listingId: string, buyerId: string): Promise<Chat> {
    try {
      const response = await apiService.post<{ chat: Chat }>('/api/chat', {
        listingId,
        buyerId
      });
      return response.chat;
    } catch (error) {
      if (error instanceof Error && error.message.includes('400')) {
        throw ErrorHandler.handleValidationError('Invalid chat data');
      }
      throw ErrorHandler.handleGenericError(error, 'Create chat');
    }
  }
}

/**
 * Default chat service instance
 */
export const chatService = new ChatService();
