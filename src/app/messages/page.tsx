"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [chatCache, setChatCache] = useState<{ [key: string]: { data: any; timestamp: number } }>({});
  const [messageCache, setMessageCache] = useState<{ [key: string]: { data: any; timestamp: number } }>({});
  
  // Cache duration constants
  const CHAT_CACHE_DURATION = 30 * 1000; // 30 seconds
  const MESSAGE_CACHE_DURATION = 15 * 1000; // 15 seconds
  
  // Auto-scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent body scrolling on messages page
  useEffect(() => {
    document.body.classList.add('no-scroll');
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // Load chats when component mounts
  useEffect(() => {
    if (user?.email) {
      loadChats();
      loadSystemNotifications();
    }
  }, [user?.email]);

  // Poll for new messages every 60 seconds
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      loadChatsBackground();
      loadSystemNotifications();
      if (selectedChat) {
        loadMessages(selectedChat.id);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user?.email, selectedChat]);

  const loadChats = async () => {
    if (!user?.email) return;
    
    const cacheKey = `chats_${user.email}`;
    
    // Check cache first
    const cached = chatCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CHAT_CACHE_DURATION) {
      setChats(cached.data.chats || []);
      setLastUpdated(cached.timestamp);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data: ChatListResponse = await response.json();
        setChats(data.chats || []);
        setLastUpdated(Date.now());
        
        setChatCache(prev => ({
          ...prev,
          [cacheKey]: { data, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatsBackground = async () => {
    if (!user?.email) return;
    
    const cacheKey = `chats_${user.email}`;
    const cached = chatCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CHAT_CACHE_DURATION) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data: ChatListResponse = await response.json();
        setChats(data.chats || []);
        setLastUpdated(Date.now());
        
        setChatCache(prev => ({
          ...prev,
          [cacheKey]: { data, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Error loading chats in background:', error);
    }
  };

  const loadSystemNotifications = async () => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setSystemNotifications(parsed);
      } else {
        const defaultNotifications: SystemNotification[] = [
          {
            id: 'welcome',
            type: 'system',
            title: 'Welcome to bitsbarter!',
            message: 'Welcome to the Bitcoin trading platform. Check out our safety guidelines to get started.',
            timestamp: Date.now() - 1000 * 60 * 60 * 24,
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
    if (!user?.email) return;
    
    const cacheKey = `messages_${chatId}`;
    const cached = messageCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < MESSAGE_CACHE_DURATION) {
      setMessages(cached.data.messages || []);
      return;
    }
    
    try {
      const response = await fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user?.email || '')}`);
      if (response.ok) {
        const data: MessageResponse = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
          
          setMessageCache(prev => ({
            ...prev,
            [cacheKey]: { data, timestamp: Date.now() }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectChat = async (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    setSelectedNotification(null);
    await loadMessages(chat.id);
  };

  const selectNotification = (notification: SystemNotification) => {
    setSelectedNotification(notification);
    setSelectedChat(null);
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setSystemNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
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
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;
    
    const messageText = newMessage.trim();
    const currentUserId = user?.id;
    
    if (!currentUserId) {
      console.error('No user ID available for sending message');
      return;
    }
    
    try {
      setIsSending(true);
      
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: selectedChat.id,
        from_id: currentUserId,
        text: messageText,
        created_at: Math.floor(Date.now() / 1000),
        read_at: undefined
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, latestMessage: optimisticMessage, unreadCount: chat.unreadCount }
          : chat
      ));
      
      setNewMessage('');
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageText,
          listingId: selectedChat.listing_id,
          otherUserId: selectedChat.other_user_username,
          chatId: selectedChat.id,
          userEmail: user?.email
        })
      });
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; message?: Message; messageId?: string };
        
        if (data.message) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id ? data.message! : msg
          ));
          
          setChats(prev => prev.map(chat => 
            chat.id === selectedChat.id 
              ? { ...chat, latestMessage: data.message!, unreadCount: chat.unreadCount }
              : chat
          ));
        } else if (data.messageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, id: data.messageId! }
              : msg
          ));
        }
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, latestMessage: chat.latestMessage, unreadCount: chat.unreadCount }
            : chat
        ));
        
        setNewMessage(messageText);
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = filter === 'unread' 
    ? chats.filter(chat => chat.unreadCount > 0)
    : chats;

  const filteredNotifications = filter === 'unread'
    ? systemNotifications.filter(notification => !notification.read)
    : systemNotifications;

  const unreadChatsCount = chats.filter(chat => chat.unreadCount > 0).length;
  const unreadNotificationsCount = systemNotifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
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
    <div className="h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Main Container - Fixed Height */}
      <div className="max-w-7xl mx-auto px-4 py-2 w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
          
          {/* Left Panel - Conversations List - ABSOLUTE FIXED HEIGHT */}
          <div className="lg:col-span-1 h-full">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 h-full flex flex-col shadow-lg">
              
              {/* Header - Fixed Height */}
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-base font-bold text-white">
                    Messages & Notifications
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-orange-100">
                      {new Date(lastUpdated).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={loadChats}
                      disabled={isLoading}
                      className="p-1 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('chats')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'chats'
                          ? 'bg-white text-orange-600 shadow-md'
                          : 'text-orange-100 hover:bg-white/20'
                      }`}
                    >
                      Chats
                      {unreadChatsCount > 0 && (
                        <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-1 py-0 rounded-full font-bold">
                          {unreadChatsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'notifications'
                          ? 'bg-white text-orange-600 shadow-md'
                          : 'text-orange-100 hover:bg-white/20'
                      }`}
                    >
                      Notifications
                      {unreadNotificationsCount > 0 && (
                        <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-1 py-0 rounded-full font-bold">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Filter and Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-1.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                          filter === 'all'
                            ? 'bg-white text-orange-600'
                            : 'text-orange-100 hover:bg-white/20'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={`px-1.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                          filter === 'unread'
                            ? 'bg-white text-orange-600'
                            : 'text-orange-100 hover:bg-white/20'
                        }`}
                      >
                        Unread
                      </button>
                    </div>
                    
                    {activeTab === 'notifications' && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="px-1.5 py-0.5 rounded-lg text-xs font-medium text-orange-100 hover:bg-white/20 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  {/* Count Display */}
                  <div className="mt-1">
                    <p className="text-xs text-orange-100">
                      {activeTab === 'chats' 
                        ? `${filteredChats.length} conversation${filteredChats.length !== 1 ? 's' : ''}`
                        : `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Content Area - ABSOLUTE FIXED HEIGHT with Scrollable Content */}
              <div className="h-[calc(100vh-8rem)] overflow-y-auto conversations-panel">
                {isLoading ? (
                  <div className="p-3 text-center">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Loading...</p>
                  </div>
                ) : activeTab === 'chats' && filteredChats.length === 0 ? (
                  <div className="p-3 text-center">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-1">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-1 text-xs">No conversations yet</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Start messaging sellers about listings</p>
                  </div>
                ) : activeTab === 'notifications' && filteredNotifications.length === 0 ? (
                  <div className="p-3 text-center">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-1">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2H4z" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-1 text-xs">No notifications</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div>
                    {activeTab === 'chats' && filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className={`p-2.5 border-b border-neutral-100 dark:border-neutral-700 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                          selectedChat?.id === chat.id 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {chat.listing_image ? (
                              <img 
                                src={chat.listing_image} 
                                alt={chat.listing_title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-neutral-900 dark:text-white truncate text-xs">
                                {chat.listing_title}
                              </h4>
                              {chat.unreadCount > 0 && (
                                <span className="bg-orange-500 text-white text-xs px-1 py-0 rounded-full font-bold">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              {chat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {chat.other_user_username}
                            </p>
                            
                            {chat.latestMessage && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
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
                        className={`p-2.5 border-b border-neutral-100 dark:border-neutral-700 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                          selectedNotification?.id === notification.id 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-neutral-900 dark:text-white truncate text-xs">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="bg-orange-500 text-white text-xs px-1 py-0 rounded-full font-bold">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat/Notification Content - ABSOLUTE FIXED HEIGHT */}
          <div className="lg:col-span-2 h-full">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 h-full flex flex-col shadow-lg">
              
              {!selectedChat && !selectedNotification ? (
                // Empty State - Fixed Height
                <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      {activeTab === 'chats' ? (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2H4z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-base">
                      {activeTab === 'chats' ? 'Select a conversation' : 'Select a notification'}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs max-w-sm">
                      {activeTab === 'chats' 
                        ? 'Choose a conversation from the list to start messaging and manage your trades.'
                        : 'Choose a notification to view its details and take any required actions.'
                      }
                    </p>
                  </div>
                </div>
                
              ) : selectedChat ? (
                // Chat View - Fixed Height Layout
                <>
                  {/* Chat Header - Fixed */}
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                        {selectedChat.listing_image ? (
                          <img 
                            src={selectedChat.listing_image} 
                            alt={selectedChat.listing_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">
                          {selectedChat.listing_title}
                        </h3>
                        <p className="text-orange-100 text-xs">
                          {selectedChat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {selectedChat.other_user_username}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {formatPrice(selectedChat.listing_price)}
                        </p>
                        <p className="text-orange-100 text-xs uppercase tracking-wide">
                          {selectedChat.listing_category}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area - ABSOLUTE FIXED HEIGHT with Scrollable Content */}
                  <div className="h-[calc(100vh-12rem)] overflow-y-auto p-3 space-y-2 bg-neutral-50 dark:bg-neutral-900 chat-panel">
                    {messages.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-neutral-900 dark:text-white mb-1 text-sm">No messages yet</h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOptimistic = message.id.startsWith('temp-');
                        const isOwnMessage = message.from_id === user?.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-3xl transition-all duration-200 ${
                                isOwnMessage
                                  ? isOptimistic 
                                    ? 'bg-orange-400 text-white opacity-80'
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <p className="text-sm">{message.text}</p>
                                {isOptimistic && (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage
                                  ? 'text-orange-100'
                                  : 'text-neutral-500 dark:text-neutral-400'
                              }`}>
                                {isOptimistic ? 'Sending...' : formatTimestamp(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input - Fixed */}
                  <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-2xl text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                        disabled={isSending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </>
                
              ) : (
                // Notification View - Fixed Height Layout
                <>
                  {/* Notification Header - Fixed */}
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0">
                        {selectedNotification && getNotificationIcon(selectedNotification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">
                          {selectedNotification?.title}
                        </h3>
                        <p className="text-orange-100 text-xs">
                          {selectedNotification && formatTimestamp(selectedNotification.timestamp)}
                        </p>
                      </div>
                      {selectedNotification && !selectedNotification.read && (
                        <span className="bg-white text-orange-600 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notification Content - ABSOLUTE FIXED HEIGHT with Scrollable Content */}
                  <div className="h-[calc(100vh-8rem)] p-3 bg-neutral-50 dark:bg-neutral-900 overflow-y-auto notification-panel">
                    <div className="max-w-2xl">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                        {selectedNotification?.message}
                      </p>
                      
                      {selectedNotification?.actionUrl && (
                        <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                          <button
                            onClick={() => window.location.href = selectedNotification.actionUrl!}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                          >
                            Take Action
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
