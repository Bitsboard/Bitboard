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
  other_user_username: string;
  latestMessage: Message | null;
  unreadCount: number;
}

interface SystemNotification {
  id: string;
  type: 'system' | 'update' | 'message';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
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
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'notifications'>('chats');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Load chats when component mounts
  useEffect(() => {
    if (user?.email) {
      loadChats();
      loadSystemNotifications();
    }
  }, [user?.email]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      loadChats();
      loadSystemNotifications();
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

  const loadSystemNotifications = async () => {
    try {
      // Load notifications from localStorage (same as NotificationMenu)
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setSystemNotifications(parsed);
      } else {
        // Fallback to welcome notification for fresh accounts
        const defaultNotifications: SystemNotification[] = [
          {
            id: 'welcome',
            type: 'system',
            title: 'Welcome to bitsbarter!',
            message: 'Welcome to the Bitcoin trading platform. Check out our safety guidelines to get started.',
            timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            read: false,
            actionUrl: '/messages'
          }
        ];
        setSystemNotifications(defaultNotifications);
        localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
      }
    } catch (error) {
      console.error('Error loading system notifications:', error);
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
    setSelectedNotification(null); // Clear selected notification
    await loadMessages(chat.id);
  };

  const selectNotification = (notification: SystemNotification) => {
    setSelectedNotification(notification);
    setSelectedChat(null); // Clear selected chat
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setSystemNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      // Persist to localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save notifications to localStorage:', error);
      }
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setSystemNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save notifications to localStorage:', error);
      }
      return updated;
    });
  };

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'message':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;
    
    try {
      setIsSending(true);
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newMessage.trim(),
          listingId: selectedChat.listing_id,
          otherUserId: selectedChat.other_user_username,
          chatId: selectedChat.id,
          userEmail: user?.email
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedChat.id);
        await loadChats(); // Refresh chat list to show latest message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Computed values for filtering and counts
  const filteredChats = filter === 'unread' 
    ? chats.filter(chat => chat.unreadCount > 0)
    : chats;

  const filteredNotifications = filter === 'unread'
    ? systemNotifications.filter(notification => !notification.read)
    : systemNotifications;

  const unreadChatsCount = chats.filter(chat => chat.unreadCount > 0).length;
  const unreadNotificationsCount = systemNotifications.filter(n => !n.read).length;

  const tabs = [
    { key: 'chats', label: 'Chats', count: activeTab === 'chats' ? (filter === 'unread' ? unreadChatsCount : chats.length) : chats.length },
    { key: 'notifications', label: 'Notifications', count: activeTab === 'notifications' ? (filter === 'unread' ? unreadNotificationsCount : systemNotifications.length) : systemNotifications.length }
  ];

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
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'chats' | 'notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'bg-orange-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  filter === 'all'
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  filter === 'unread'
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Unread
              </button>
            </div>
            
            {activeTab === 'notifications' && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
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
            ) : activeTab === 'chats' && filteredChats.length === 0 ? (
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
            ) : activeTab === 'notifications' && filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  No notifications yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  You have no unread notifications.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto h-[500px]">
                {activeTab === 'chats' && filteredChats.map((chat) => (
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
                          {chat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {chat.other_user_username}
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
                {activeTab === 'notifications' && filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => selectNotification(notification)}
                    className={`p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 ${
                      selectedNotification?.id === notification.id ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages or Notification Details */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {!selectedChat && !selectedNotification ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'chats' ? (
                      <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2H4z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    {activeTab === 'chats' ? 'Select a conversation' : 'Select a notification'}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {activeTab === 'chats' 
                      ? 'Choose a conversation from the list to start messaging.'
                      : 'Choose a notification to view its details.'
                    }
                  </p>
                </div>
              </div>
            ) : selectedChat ? (
              // Chat Messages View
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
                        {selectedChat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {selectedChat.other_user_username}
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
                        className={`flex ${message.from_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.from_id === user?.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.from_id === user?.id
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
            ) : (
              // Notification Details View
              <>
                {/* Notification Header */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                      {selectedNotification && getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {selectedNotification?.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedNotification && formatTimestamp(selectedNotification.timestamp)}
                      </p>
                    </div>
                    {selectedNotification && !selectedNotification.read && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification Content */}
                <div className="flex-1 p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {selectedNotification?.message}
                    </p>
                  </div>
                  
                  {selectedNotification?.actionUrl && (
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => window.location.href = selectedNotification.actionUrl!}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                      >
                        Take Action
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
