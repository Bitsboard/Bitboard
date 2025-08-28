"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLang } from "@/lib/i18n-client";
import { useSettingsStore } from "@/lib/settings";

interface Message {
  id: string;
  text: string;
  from_id: string;
  created_at: number;
  is_from_current_user: boolean;
}

interface ChatWithDetails {
  id: string;
  listing_title: string;
  listing_image?: string;
  last_message_at: number;
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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  
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
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user?.email]);

  const loadChats = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data: ChatListResponse = await response.json();
        setChats(data.chats || []);
      } else {
        console.error('Messages page: Chat API error response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Messages page: Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatsBackground = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data: ChatListResponse = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Messages page: Error loading chats background:', error);
    }
  };

  const loadSystemNotifications = async () => {
    try {
      // For now, load from localStorage or create default notifications
      const stored = localStorage.getItem('systemNotifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSystemNotifications(parsed);
      } else {
        const defaultNotifications: SystemNotification[] = [
          {
            id: '1',
            type: 'system',
            title: 'Welcome to bitsbarter!',
            message: 'Your account has been verified. Start trading with Bitcoin today! We&apos;re excited to have you on board.',
            timestamp: Date.now() - 86400000, // 24 hours ago
            read: true
          }
        ];
        setSystemNotifications(defaultNotifications);
        localStorage.setItem('systemNotifications', JSON.stringify(defaultNotifications));
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
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim() || !user?.email) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: newMessage.trim(),
          fromEmail: user.email
        })
      });
      
      if (response.ok) {
        setNewMessage("");
        // Reload messages to show the new one
        await loadMessages(selectedChat.id);
        // Reload chats to update unread counts
        await loadChatsBackground();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const selectChat = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    setSelectedNotification(null);
    loadMessages(chat.id);
  };

  const selectNotification = (notification: SystemNotification) => {
    setSelectedNotification(notification);
    setSelectedChat(null);
    
    // Mark as read if not already read
    if (!notification.read) {
      setSystemNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        );
        localStorage.setItem('systemNotifications', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const markAllNotificationsAsRead = () => {
    setSystemNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('systemNotifications', JSON.stringify(updated));
      return updated;
    });
  };

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'system':
        return (
          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:bg-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    // Convert to milliseconds if timestamp is in seconds (Unix timestamp)
    const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    const now = Date.now();
    const diff = now - timestampMs;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Filter and combine items
  const filteredChats = filter === 'unread' 
    ? chats.filter(chat => chat.unreadCount > 0)
    : chats;

  const filteredNotifications = filter === 'unread'
    ? systemNotifications.filter(notification => !notification.read)
    : systemNotifications;

  // Combine notifications and chats with notifications at top
  const combinedItems = [
    ...filteredNotifications.map(notification => ({
      type: 'notification' as const,
      data: notification,
      priority: notification.read ? 1 : 0
    })),
    ...filteredChats.map(chat => ({
      type: 'chat' as const,
      data: chat,
      priority: chat.unreadCount > 0 ? 2 : 3
    }))
  ].sort((a, b) => a.priority - b.priority);

  const unreadChatsCount = chats.filter(chat => chat.unreadCount > 0).length;
  const unreadNotificationsCount = systemNotifications.filter(n => !n.read).length;

  if (!user?.email) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Please sign in to access your messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col overflow-hidden">
      {/* Main Container - Fixed Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversations & Notifications */}
        <div className="w-80 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col rounded-r-3xl shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 flex-shrink-0 rounded-tr-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">
                Messages & Notifications
              </h1>
              <button
                onClick={loadChats}
                disabled={isLoading}
                className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    filter === 'all'
                      ? 'bg-white text-orange-600 shadow-lg scale-105'
                      : 'text-orange-100 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    filter === 'unread'
                      ? 'bg-white text-orange-600 shadow-lg scale-105'
                      : 'text-orange-100 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  Unread
                </button>
              </div>
              
              <button
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-orange-100 hover:bg-white/20 hover:scale-105 transition-all duration-200"
              >
                Mark all read
              </button>
            </div>
            
            {/* Count */}
            <div className="mt-3">
              <p className="text-xs text-orange-100/90 font-medium">
                {combinedItems.length} items • {unreadNotificationsCount + unreadChatsCount} unread
              </p>
            </div>
          </div>
          
          {/* Content List */}
          <div className="flex-1 overflow-y-auto rounded-br-3xl p-3">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading conversations...</p>
              </div>
            ) : combinedItems.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-base">No messages or notifications</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedItems.map((item) => {
                  if (item.type === 'notification') {
                    const notification = item.data;
                    return (
                      <div
                        key={`notification-${notification.id}`}
                        onClick={() => selectNotification(notification)}
                        className={`p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.02] ${
                          selectedNotification?.id === notification.id 
                            ? 'ring-2 ring-purple-500 bg-purple-50/80 dark:bg-purple-900/30 shadow-lg scale-[1.02]' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-neutral-900 dark:text-white truncate text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const chat = item.data;
                    return (
                      <div
                        key={`chat-${chat.id}`}
                        onClick={() => selectChat(chat)}
                        className={`p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.02] ${
                          selectedChat?.id === chat.id 
                            ? 'ring-2 ring-orange-500 bg-orange-50/80 dark:bg-orange-900/30 shadow-lg scale-[1.02]' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                            {chat.listing_image ? (
                              <img 
                                src={chat.listing_image} 
                                alt={chat.listing_title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-neutral-900 dark:text-white truncate text-sm">
                                {chat.listing_title}
                              </h4>
                              {chat.unreadCount > 0 && (
                                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 font-medium">
                              {chat.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: <span className="font-semibold text-neutral-800 dark:text-neutral-300">{chat.other_user_username}</span>
                            </p>
                            
                            {chat.latestMessage && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate mb-2 leading-relaxed">
                                {chat.latestMessage.text}
                              </p>
                            )}
                            
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                              {formatTimestamp(chat.last_message_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Messages */}
        <div className="flex-1 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm flex flex-col rounded-l-3xl shadow-xl">
          {!selectedChat && !selectedNotification ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                  Select a conversation or notification
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-base max-w-md leading-relaxed">
                  Choose a conversation or notification from the list to start messaging and manage your trades.
                </p>
              </div>
            </div>
          ) : selectedNotification ? (
            // Notification View
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-500 flex-shrink-0 rounded-tl-3xl shadow-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white drop-shadow-sm">
                    {selectedNotification.title}
                  </h2>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl p-8 mb-6 border border-purple-200/50 dark:border-purple-800/50 shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      {getNotificationIcon(selectedNotification.type)}
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                          {selectedNotification.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                          {formatTimestamp(selectedNotification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-base">
                      {selectedNotification.message}
                    </p>
                    {selectedNotification.actionUrl && (
                      <div className="mt-6">
                        <a
                          href={selectedNotification.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <span className="font-semibold">Take Action</span>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat View
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 flex-shrink-0 rounded-tl-3xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      {selectedChat?.listing_image ? (
                        <img 
                          src={selectedChat.listing_image} 
                          alt={selectedChat?.listing_title || ''}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white drop-shadow-sm">
                        {selectedChat?.listing_title || ''}
                      </h2>
                      <p className="text-sm text-orange-100/90 font-medium">
                        {selectedChat?.user_role === 'buyer' ? 'Buying from' : 'Selling to'}: {selectedChat?.other_user_username || ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-lg">No messages yet</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_current_user ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-5 py-3 rounded-3xl shadow-lg ${
                            message.is_from_current_user
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-white border border-neutral-200/50 dark:border-neutral-700/50'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-2 font-medium ${
                            message.is_from_current_user
                              ? 'text-orange-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            {formatTimestamp(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-6 border-t border-neutral-200/50 dark:border-neutral-700/50 flex-shrink-0 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm">
                <form onSubmit={sendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-3 border border-neutral-300/50 dark:border-neutral-600/50 rounded-2xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
