"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { useSettingsStore } from "@/lib/settings";
import type { Chat, Message } from "@/lib/types";

interface ChatWithDetails extends Chat {
  listing_title: string;
  listing_price: number;
  listing_image: string;
  listing_category: string;
  user_role: 'buyer' | 'seller';
  other_user_id: string;
  latestMessage: Message | null;
  unreadCount: number;
}

interface ChatListResponse {
  chats: ChatWithDetails[];
  userEmail: string;
  totalChats: number;
}

interface MessageResponse {
  success: boolean;
  messages: Message[];
}

export default function MessagesPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const lang = useLang();
  const { user } = useSettingsStore();
  
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Load chats when component mounts
  useEffect(() => {
    if (user?.email) {
      loadChats();
    }
  }, [user?.email]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      loadChats();
      if (selectedChat) {
        loadMessages(selectedChat.id);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user?.email, selectedChat]);

  const loadChats = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data: ChatListResponse = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user?.email || '')}`);
      if (response.ok) {
        const data: MessageResponse = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectChat = async (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    await loadMessages(chat.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.email || isSending) return;
    
    try {
      setIsSending(true);
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newMessage.trim(),
          listingId: selectedChat.listing_id,
          otherUserId: selectedChat.other_user_id,
          userEmail: user.email
        })
      });
      
      if (response.ok) {
        setNewMessage("");
        // Reload messages and chats
        await loadMessages(selectedChat.id);
        await loadChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (filter === 'unread') return chat.unreadCount > 0;
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000; // Convert from Unix timestamp
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatPrice = (priceSats: number) => {
    return `${priceSats.toLocaleString()} sats`;
  };

  if (!user?.email) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Please sign in to view messages
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            You need to be signed in to access your chat conversations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Messages
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Your conversations and chat history
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-4">
            {[
              { key: 'all', label: 'All Chats', count: chats.length },
              { key: 'unread', label: 'Unread', count: chats.filter(c => c.unreadCount > 0).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === tab.key
                    ? 'bg-orange-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Conversations</h3>
            </div>
            
            {isLoading ? (
              <div className="p-4 text-center text-neutral-600 dark:text-neutral-400">
                Loading chats...
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  No conversations yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Start a conversation by messaging a seller about a listing.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto h-[500px]">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat)}
                    className={`p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 ${
                      selectedChat?.id === chat.id ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {chat.listing_image ? (
                          <img 
                            src={chat.listing_image} 
                            alt={chat.listing_title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                            {chat.listing_title}
                          </h4>
                          {chat.unreadCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          {chat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {chat.other_user_id}
                        </p>
                        
                        {chat.latestMessage && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-500 truncate">
                            {chat.latestMessage.text}
                          </p>
                        )}
                        
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {formatTimestamp(chat.last_message_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {!selectedChat ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Choose a chat from the list to start messaging.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                      {selectedChat.listing_image ? (
                        <img 
                          src={selectedChat.listing_image} 
                          alt={selectedChat.listing_title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {selectedChat.listing_title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedChat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {selectedChat.other_user_id}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {formatPrice(selectedChat.listing_price)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        {selectedChat.listing_category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 h-[400px] space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.from_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.from_id === user.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.from_id === user.id
                              ? 'text-orange-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            {formatTimestamp(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={isSending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
