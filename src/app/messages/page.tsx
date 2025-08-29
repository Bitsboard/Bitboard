"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useUser, useSettings } from '@/lib/settings';
import { ListingModal } from '@/components/ListingModal';
import { generateProfilePicture, getInitials, formatPostAge, formatCADAmount } from "@/lib/utils";
import { useBtcRate } from '@/lib/hooks/useBtcRate';

interface Chat {
  id: string;
  listing_title: string;
  other_user: string;
  last_message: string;
  last_message_time: number;
  unread_count: number;
  listing_id: string;
  listing_image: string;
  listing_price: number;
  listing_created_at: number;
  seller_verified: boolean;
  listing_type: string;
  location: string;
  seller_rating: number;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'system' | 'welcome' | 'update';
  icon?: 'info' | 'success' | 'warning' | 'error' | 'system';
}

interface Message {
  id: string;
  content: string;
  timestamp: number;
  is_from_current_user: boolean;
  sender_name: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { isDark: dark } = useTheme();
  const { user } = useUser();
  const { modals, setModal, unit } = useSettings();
  const btcCad = useBtcRate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Cache for messages to avoid re-fetching
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp: number) => {
    // Convert to milliseconds if timestamp is in seconds (Unix timestamp)
    const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    const now = Date.now();
    const diff = now - timestampMs;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestampMs).toLocaleDateString();
  };

  const loadChats = async () => {
    if (!user?.email) {
      console.log('No user email available, cannot load chats');
      return;
    }
    
    console.log('🔍 Messages Page: Starting loadChats for user:', user.email);
    setIsLoading(true);
    try {
      const url = `/api/chat/list?userEmail=${encodeURIComponent(user.email)}`;
      console.log('🔍 Messages Page: Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('🔍 Messages Page: Response status:', response.status);
      console.log('🔍 Messages Page: Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json() as { chats: any[] };
        console.log('🔍 Messages Page: Chat API response:', data); // Debug log
        
        const transformedChats = data.chats.map((chat: any) => ({
            id: chat.id,
            listing_title: chat.listing_title,
            other_user: chat.other_user_username,
            last_message: chat.latest_message_text || 'No messages yet',
            last_message_time: chat.latest_message_time || chat.last_message_at || chat.created_at,
            unread_count: chat.unread_count || 0,
            listing_id: chat.listing_id,
            listing_image: chat.listing_image,
            listing_price: chat.listing_price || chat.price_sats,
            listing_created_at: chat.listing_created_at || chat.created_at,
            seller_verified: chat.seller_verified || false,
            listing_type: chat.listing_type || 'sell',
            location: chat.listing_location,
            seller_rating: chat.seller_rating || 0
        }));
        
        console.log('🔍 Raw chat API response:', data.chats);
        console.log('🔍 Transformed chats with reputation data:', transformedChats.map(c => ({
          id: c.id,
          other_user: c.other_user,
          seller_rating: c.seller_rating,
          seller_verified: c.seller_verified,
          raw_data: data.chats.find(raw => raw.id === c.id)
        })));
        setChats(transformedChats);
        
        // Auto-select the most recent chat
        if (transformedChats.length > 0 && !selectedChat) {
          setSelectedChat(transformedChats[0].id);
          loadMessages(transformedChats[0].id);
        }
      } else {
        console.error('🔍 Messages Page: Chat API error:', response.status, response.statusText);
        try {
          const errorText = await response.text();
          console.error('🔍 Messages Page: Error response body:', errorText);
        } catch (e) {
          console.error('🔍 Messages Page: Could not read error response body');
        }
      }
    } catch (error) {
      console.error('🔍 Messages Page: Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemNotifications = () => {
    // Load system notifications from localStorage or create defaults
    try {
      const stored = localStorage.getItem('systemNotifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSystemNotifications(parsed);
      } else {
        const defaultNotifications: SystemNotification[] = [
          {
            id: 'welcome',
            title: 'Welcome to bitsbarter!',
            message: 'Your account has been verified. Start trading with Bitcoin today!',
            timestamp: Date.now() - 86400000, // 24 hours ago
            read: true,
            type: 'welcome',
            icon: 'success'
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
    if (!user?.email) {
      console.log('No user email available, cannot load messages');
      return;
    }
    
    // Check cache first
    if (messagesCache[chatId]) {
      console.log('Loading messages from cache for chat:', chatId);
      setMessages(messagesCache[chatId]);
      setSelectedChat(chatId);
      setSelectedNotification(null);
      return;
    }
    
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json() as { messages: any[]; current_user_id: string };
        console.log('Messages API response:', data); // Debug log
        
        // Transform messages to match the expected format
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.text, // API returns 'text', not 'content'
          timestamp: msg.created_at,
          is_from_current_user: msg.is_from_current_user, // API already provides this
          sender_name: msg.is_from_current_user ? 'You' : 'Other User' // Simplified sender name
        }));
        
        // Cache the messages
        setMessagesCache(prev => ({
          ...prev,
          [chatId]: transformedMessages
        }));
        
        setMessages(transformedMessages);
        setSelectedChat(chatId);
        setSelectedNotification(null);
      } else {
        console.error('Messages API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending || !user?.email) return;
    
    // Get the selected chat details to extract listing_id and other_user_id
    const selectedChatData = chats.find(c => c.id === selectedChat);
    if (!selectedChatData) {
      console.error('Selected chat not found');
      return;
    }
    
    setIsSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat,
          text: newMessage.trim(), // API expects 'text', not 'content'
          listingId: selectedChatData.listing_id.toString(), // API expects listingId
          otherUserId: selectedChatData.other_user, // API expects otherUserId
          userEmail: user.email
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        // Add new message to cache and state immediately for better UX
        const newMessageObj: Message = {
          id: Date.now().toString(), // Temporary ID
          content: newMessage.trim(),
          timestamp: Date.now(),
          is_from_current_user: true,
          sender_name: 'You'
        };
        
        // Update cache
        setMessagesCache(prev => ({
          ...prev,
          [selectedChat]: [...(prev[selectedChat] || []), newMessageObj]
        }));
        
        // Update current messages
        setMessages(prev => [...prev, newMessageObj]);
      } else {
        console.error('Send message error:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectNotification = (notification: SystemNotification) => {
    setSelectedNotification(notification.id);
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
  
  // Function to refresh messages for a specific chat (for real-time updates)
  const refreshMessages = async (chatId: string) => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json() as { messages: any[]; current_user_id: string };
        
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.text,
          timestamp: msg.created_at,
          is_from_current_user: msg.is_from_current_user,
          sender_name: msg.is_from_current_user ? 'You' : 'Other User'
        }));
        
        // Update cache and current messages if this chat is selected
        setMessagesCache(prev => ({
          ...prev,
          [chatId]: transformedMessages
        }));
        
        if (selectedChat === chatId) {
          setMessages(transformedMessages);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Function to open listing modal
  const openListingModal = async (listingId: number) => {
    try {
      console.log('🔍 Opening listing modal for ID:', listingId);
      console.log('🔍 Current modal state before:', modals);
      
      // Fetch the real listing data from the API
      const response = await fetch(`/api/listings/${listingId}`);
      if (!response.ok) {
        console.error('Failed to fetch listing:', response.status);
        return;
      }
      
      const dbListing = await response.json() as any;
      console.log('🔍 Fetched listing data:', dbListing);
      
      // Transform the database listing to match the expected Listing interface
      const transformedListing = {
        id: String(dbListing.id),
        title: dbListing.title || 'Untitled Listing',
        description: dbListing.description || 'No description available',
        priceSats: Number(dbListing.price_sats) || 0,
        category: dbListing.category || 'Featured',
        location: dbListing.location || 'Location Unknown',
        lat: Number(dbListing.lat) || 0,
        lng: Number(dbListing.lng) || 0,
        type: dbListing.type || 'sell',
        images: dbListing.images ? (Array.isArray(dbListing.images) ? dbListing.images : [dbListing.images]) : 
                dbListing.listing_image ? [dbListing.listing_image] : 
                dbListing.image ? [dbListing.image] : 
                dbListing.photo ? [dbListing.photo] :
                dbListing.photo_url ? [dbListing.photo_url] :
                dbListing.image_url ? [dbListing.image_url] : [],
        boostedUntil: dbListing.boosted_until ? Number(dbListing.boosted_until) : null,
        seller: {
          name: dbListing.seller_name || dbListing.posted_by || dbListing.username || 'Unknown Seller',
          score: Number(dbListing.seller_score) || 0,
          deals: Number(dbListing.seller_deals) || 0,
          rating: Number(dbListing.seller_rating) || 0,
          verifications: {
            email: Boolean(dbListing.seller_verified_email || dbListing.verified_email),
            phone: Boolean(dbListing.seller_verified_phone || dbListing.verified_phone),
            lnurl: Boolean(dbListing.seller_verified_lnurl || dbListing.verified_lnurl)
          },
          onTimeRelease: Number(dbListing.seller_on_time_release) || 0
        },
        createdAt: Number(dbListing.created_at) || Date.now()
      };
      
      console.log('🔍 Transformed listing:', transformedListing);
      console.log('🔍 Images array:', transformedListing.images);
      console.log('🔍 Original image fields:', {
        images: dbListing.images,
        listing_image: dbListing.listing_image,
        image: dbListing.image,
        photo: dbListing.photo,
        photo_url: dbListing.photo_url,
        image_url: dbListing.image_url
      });
      
      // Set the modal with the transformed listing data
      setModal('active', transformedListing);
      console.log('🔍 Modal set to active with listing');
      console.log('🔍 Modal state after setModal:', modals);
      
      // Force a re-render to see if the modal state changes
      setTimeout(() => {
        console.log('🔍 Modal state after timeout:', modals);
      }, 100);
    } catch (error) {
      console.error('Error fetching listing:', error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadChats();
      loadSystemNotifications();
    }
  }, [user?.email]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Periodic refresh of selected chat messages (every 30 seconds)
  useEffect(() => {
    if (!selectedChat) return;
    
    const interval = setInterval(() => {
      refreshMessages(selectedChat);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedChat]);



  // Filter chats and notifications based on unread status
  // Memoize filtered and combined items to prevent unnecessary re-renders
  const filteredChats = React.useMemo(() => 
    filter === 'unread' ? chats.filter(chat => chat.unread_count > 0) : chats,
    [filter, chats]
  );
  
  const filteredNotifications = React.useMemo(() =>
    filter === 'unread' ? systemNotifications.filter(notification => !notification.read) : systemNotifications,
    [filter, systemNotifications]
  );

  // Combine notifications and chats with notifications at top
  const combinedItems = React.useMemo(() => [
    ...filteredNotifications.map(notification => ({ ...notification, itemType: 'notification' as const })),
    ...filteredChats.map(chat => ({ ...chat, itemType: 'chat' as const }))
  ], [filteredNotifications, filteredChats]);

  // Calculate counts for filter buttons
  const totalCount = chats.length + systemNotifications.length;
  const unreadCount = chats.filter(c => c.unread_count > 0).length + systemNotifications.filter(n => !n.read).length;

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Container with max-width and centering like other pages - only horizontal inset */}
      <div className="mx-auto max-w-7xl px-4 h-full">
        <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col overflow-hidden rounded-3xl">
          {/* Main Container - Full Height */}
          <div className="flex-1 flex overflow-hidden rounded-3xl">
            {/* Left Panel - Conversations & Notifications */}
            <div className="w-80 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col rounded-r-3xl shadow-xl">
              {/* Header - Compact */}
              <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-neutral-500 via-neutral-600 to-neutral-700 flex-shrink-0 rounded-tr-3xl shadow-lg">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-bold text-white drop-shadow-sm">
                    Messages
                  </h1>
                  
                  {/* Filter Toggle */}
                  <div className="flex bg-white/20 rounded-xl p-1">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filter === 'all'
                          ? 'bg-white text-neutral-600 shadow-md'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      onClick={() => setFilter('unread')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filter === 'unread'
                          ? 'bg-white text-neutral-600 shadow-md'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content List with Custom Scrollbar */}
              <div className="flex-1 overflow-y-auto rounded-br-3xl custom-scrollbar">
                {!user?.email ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      Please sign in to view your messages
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : combinedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {filter === 'unread' ? 'No unread items' : 'No messages or notifications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {combinedItems.map((item) => (
                      <div
                        key={`${item.itemType}-${item.id}`}
                        onClick={() => {
                          if (item.itemType === 'chat') {
                            loadMessages(item.id);
                          } else {
                            selectNotification(item as SystemNotification);
                          }
                        }}
                        className={`p-3 cursor-pointer transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          (item.itemType === 'chat' && selectedChat === item.id) ||
                          (item.itemType === 'notification' && selectedNotification === item.id)
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                            : item.itemType === 'notification'
                            ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
                            : 'bg-white/60 dark:bg-neutral-900/60'
                        }`}
                      >
                        {item.itemType === 'notification' ? (
                          /* System Notification Layout */
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ${
                              item.icon === 'info' ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900' :
                              item.icon === 'success' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900' :
                              item.icon === 'warning' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900' :
                              item.icon === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900' :
                              'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900'
                            }`}>
                              {item.icon === 'info' && (
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {item.icon === 'success' && (
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {item.icon === 'warning' && (
                                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              )}
                              {item.icon === 'error' && (
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {(!item.icon || item.icon === 'system') && (
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm truncate mb-1 ${
                                selectedNotification === item.id ? 'text-white' : 'text-neutral-900 dark:text-white'
                              }`}>
                                {item.title}
                              </h3>
                              
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs truncate flex-1 ${
                                  selectedNotification === item.id ? 'text-white/80' : 'text-neutral-600 dark:text-neutral-300'
                                }`}>
                                  {item.message}
                                </p>
                                <span className={`text-xs flex-shrink-0 ${
                                  selectedNotification === item.id ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'
                                }`}>
                                  {formatTimestamp(item.timestamp)}
                                </span>
                              </div>
                              
                              {!item.read && (
                                <div className="mt-1 flex justify-end">
                                  <span className={`text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center font-medium ${
                                    selectedNotification === item.id 
                                      ? 'bg-white/20 text-white'
                                      : item.icon === 'info' ? 'bg-blue-500 text-white' :
                                        item.icon === 'success' ? 'bg-green-500 text-white' :
                                        item.icon === 'warning' ? 'bg-yellow-500 text-white' :
                                        item.icon === 'error' ? 'bg-red-500 text-white' :
                                        'bg-purple-500 text-white'
                                  }`}>
                                    New
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Chat Layout */
                          <div className="flex items-start gap-3">
                            {/* Content - New Layout */}
                            <div className="flex-1 min-w-0">
                              {/* Top Row: Username Pill Only */}
                              <div className="flex items-center gap-2 mb-1">
                                {/* Username Pill with Profile Icon */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  selectedChat === item.id 
                                    ? 'bg-white/20 text-white border border-white/30'
                                    : 'bg-white/10 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border border-neutral-300/60 dark:border-neutral-700/50 hover:bg-white/20 dark:hover:bg-neutral-700/50'
                                }`}>
                                  {/* Profile Icon */}
                                  <div className="flex-shrink-0 -ml-1">
                                    <img
                                      src={generateProfilePicture(item.other_user)}
                                      alt={`${item.other_user}'s profile picture`}
                                      className="w-4 h-4 rounded-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initials if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center hidden">
                                      <span className="text-xs font-bold text-white">
                                        {getInitials(item.other_user)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Username */}
                                  <span className="ml-1">{item.other_user}</span>
                                </span>
                                
                                {/* Verified Badge */}
                                {item.seller_verified && (
                                  <span 
                                    className="verified-badge inline-flex h-4 w-4 items-center justify-center rounded-full text-white font-bold shadow-md"
                                    style={{
                                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                                    }}
                                    aria-label="Verified"
                                    title="User has verified their identity"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              
                              {/* Listing Title */}
                              <h3 className={`font-semibold text-sm truncate mb-1 ${
                                selectedChat === item.id ? 'text-white' : 'text-neutral-900 dark:text-white'
                              }`}>
                                {item.listing_title}
                              </h3>
                              
                              {/* Last Message */}
                              <p className={`text-xs truncate mb-1 ${
                                selectedChat === item.id ? 'text-white/80' : 'text-neutral-600 dark:text-neutral-300'
                              }`}>
                                {item.last_message}
                              </p>
                              
                              {/* Bottom Row: Unread Count */}
                              {item.unread_count > 0 && (
                                <div className="flex justify-end">
                                  <span className={`text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center font-medium ${
                                    selectedChat === item.id 
                                      ? 'bg-white/20 text-white'
                                      : 'bg-red-500 text-white'
                                  }`}>
                                    {item.unread_count}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Age of Last Message - Top Right */}
                            <div className="flex-shrink-0">
                              <span className={`text-xs font-bold ${
                                selectedChat === item.id ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'
                              }`}>
                                {formatPostAge(item.last_message_time)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chat Messages or Notification View */}
            <div className="flex-1 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm flex flex-col rounded-l-3xl shadow-xl">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-2 rounded-t-3xl">
                    <div className="flex items-end gap-3">
                      {/* Listing Image - Fix top-left corner rounding */}
                      <img
                        src={chats.find(c => c.id === selectedChat)?.listing_image || '/placeholder-listing.jpg'}
                        alt="Listing"
                        className="w-32 h-32 rounded-tl-2xl rounded-tr-lg rounded-br-lg rounded-bl-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={async () => {
                          const selectedChatData = chats.find(c => c.id === selectedChat);
                          console.log('🔍 Image clicked, selectedChatData:', selectedChatData);
                          if (selectedChatData?.listing_id) {
                            console.log('🔍 Calling openListingModal with ID:', selectedChatData.listing_id);
                            await openListingModal(Number(selectedChatData.listing_id));
                          } else {
                            console.log('🔍 No listing_id found in selectedChatData');
                          }
                        }}
                      />
                      
                      {/* Content Section */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-32">
                        {/* Top Section: Selling Tag + Title + Age + Location */}
                        <div>
                          {/* Top Row: Selling Tag + Title + Age + Location */}
                          <div className="flex items-center gap-2 mb-1">
                            {/* Selling/Looking For Tag */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                              chats.find(c => c.id === selectedChat)?.listing_type === 'want' 
                                ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}>
                              {chats.find(c => c.id === selectedChat)?.listing_type === 'want' ? 'Looking For' : 'Selling'}
                            </span>
                            
                            {/* Listing Title - Directly to the right of selling tag */}
                            <h2 className="text-lg font-bold text-white truncate flex-1">
                              {chats.find(c => c.id === selectedChat)?.listing_title || 'Untitled Listing'}
                            </h2>
                          </div>
                          
                          {/* Price + Dollar Equivalent */}
                          <div className="text-white/90 mb-1">
                            {/* Primary Price */}
                            {unit === 'BTC' ? (
                              <div>
                                <span className="text-lg font-semibold">
                                  {(Number(chats.find(c => c.id === selectedChat)?.listing_price || 0) / 100000000).toFixed(8)} BTC
                                </span>
                                {/* Dollar equivalent */}
                                <div className="text-sm text-white/80">
                                  {formatCADAmount((Number(chats.find(c => c.id === selectedChat)?.listing_price || 0) / 100000000) * (btcCad || 0))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-lg font-semibold">
                                  {chats.find(c => c.id === selectedChat)?.listing_price?.toLocaleString() || 0} sats
                                </span>
                                {/* Dollar equivalent */}
                                <div className="text-sm text-white/80">
                                  {formatCADAmount((Number(chats.find(c => c.id === selectedChat)?.listing_price || 0) / 100000000) * (btcCad || 0))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Bottom Section: Username Pill - Aligned with bottom of image */}
                        <div className="flex items-center gap-2">
                          <div 
                            className="inline-flex items-center px-3 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer relative bg-white/10 dark:bg-neutral-800/50 hover:bg-white/20 dark:hover:bg-neutral-700/50 border border-neutral-300/60 dark:border-neutral-700/50 hover:scale-105 hover:shadow-md"
                            onClick={() => {
                              const selectedChatData = chats.find(c => c.id === selectedChat);
                              if (selectedChatData?.other_user) {
                                router.push(`/profile/${selectedChatData.other_user}`);
                              }
                            }}
                          >
                            <div className="flex-shrink-0 -ml-1">
                              <img
                                src={generateProfilePicture(chats.find(c => c.id === selectedChat)?.other_user || '')}
                                alt={`${chats.find(c => c.id === selectedChat)?.other_user}'s profile picture`}
                                className="w-5 h-5 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('div') as HTMLDivElement;
                                    if (fallback) fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center hidden">
                                <span className="text-xs font-bold text-white">{getInitials(chats.find(c => c.id === selectedChat)?.other_user || '')}</span>
                              </div>
                            </div>
                            <span className="text-sm ml-1 text-white">{chats.find(c => c.id === selectedChat)?.other_user}</span>
                          </div>
                          
                          {/* Verified Badge */}
                          {chats.find(c => c.id === selectedChat)?.seller_verified && (
                            <span className="verified-badge inline-flex h-5 w-5 items-center justify-center rounded-full text-white font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} aria-label="Verified" title="User has verified their identity">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          )}
                          
                          {/* User Reputation - +x 👍 format */}
                          <span className="text-white/80 text-xs">
                            +{(() => {
                              const selectedChatData = chats.find(c => c.id === selectedChat);
                              const score = selectedChatData?.seller_rating || 0;
                              console.log('🔍 Reputation display debug:', {
                                chatId: selectedChat,
                                other_user: selectedChatData?.other_user,
                                seller_rating: selectedChatData?.seller_rating,
                                final_score: score,
                                all_available_fields: selectedChatData ? Object.keys(selectedChatData) : [],
                                raw_chat_data: chats.find(c => c.id === selectedChat)
                              });
                              return score;
                            })()} 👍
                          </span>
                        </div>
                      </div>
                      
                      {/* Right Side: Age + Location + View Listing Button */}
                      <div className="flex flex-col justify-between h-32">
                        {/* Top Section: Age + Location - Aligned with top of header */}
                        <div className="flex items-center gap-1 mt-2">
                          {/* Posting Age - Use same logic as grid/list cards */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-white/20 backdrop-blur-sm">
                            {chats.find(c => c.id === selectedChat)?.listing_created_at ? 
                              formatPostAge(chats.find(c => c.id === selectedChat)?.listing_created_at!) : 
                              'Unknown'
                            }
                          </span>
                          
                          {/* "in" text */}
                          <span className="text-white/80 text-xs">in</span>
                          
                          {/* Location Tag - Fixed SVG path */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-white/20 backdrop-blur-sm">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {chats.find(c => c.id === selectedChat)?.location || 'Location N/A'}
                          </span>
                        </div>
                        
                        {/* Bottom Section: View Listing Button - Aligned with bottom of image */}
                        <button
                          onClick={async () => {
                            const selectedChatData = chats.find(c => c.id === selectedChat);
                            console.log('🔍 Button clicked, selectedChatData:', selectedChatData);
                            if (selectedChatData?.listing_id) {
                              console.log('🔍 Calling openListingModal with ID:', selectedChatData.listing_id);
                              await openListingModal(Number(selectedChatData.listing_id));
                            } else {
                              console.log('🔍 No listing_id found in selectedChatData');
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-white hover:bg-orange-50 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md"
                        >
                          View Listing
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {isLoadingMessages ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 mx-auto mb-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          Loading messages...
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                        
                        // Show timestamp if:
                        // 1. It's the first message
                        // 2. Previous message is from different user
                        // 3. There's a significant time gap (1 hour, 1 day, etc.)
                        // 4. It's the last message
                        const getTimeDifference = (current: number, previous: number) => {
                          const diff = current - previous;
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          
                          if (days > 0) return days;
                          if (hours > 0) return hours;
                          return 0;
                        };
                        
                        const shouldShowTimestamp = 
                          index === 0 || 
                          !prevMessage || 
                          prevMessage.is_from_current_user !== message.is_from_current_user ||
                          getTimeDifference(message.timestamp, prevMessage.timestamp) > 0 || // Show timestamp for any hour/day change
                          index === messages.length - 1;
                        
                        // Group messages from same user with smaller spacing
                        const isGroupedWithPrev = prevMessage && 
                          prevMessage.is_from_current_user === message.is_from_current_user &&
                          (message.timestamp - prevMessage.timestamp) <= 300000; // 5 minutes for grouping
                        
                        return (
                          <div key={message.id}>
                            {/* Timestamp above message if needed - positioned above the message side */}
                            {shouldShowTimestamp && (
                              <div className={`mb-3 ${
                                message.is_from_current_user ? 'text-right' : 'text-left'
                              }`}>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                            )}
                            
                            {/* Message bubble */}
                            <div
                              className={`flex ${message.is_from_current_user ? 'justify-end' : 'justify-start'} ${
                                isGroupedWithPrev ? 'mt-1' : 'mt-3'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                  message.is_from_current_user
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-800/50 rounded-bl-3xl">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : selectedNotification ? (
                <>
                  {/* Notification View */}
                  <div className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        {systemNotifications.find(n => n.id === selectedNotification)?.title}
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {systemNotifications.find(n => n.id === selectedNotification)?.message}
                      </p>
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="px-6 py-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                      Select a conversation or notification
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Choose a chat or notification from the left panel
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Listing Modal */}
      {modals.active && (
        <ListingModal
          listing={modals.active}
          open={!!modals.active}
          onClose={() => setModal('active', null)}
          unit="sats"
          btcCad={btcCad}
          dark={dark}
          user={user}
          onShowAuth={() => setModal('showAuth', true)}
        />
      )}
    </div>
  );
}
