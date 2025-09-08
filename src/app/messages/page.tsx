"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useUser, useSettings } from '@/lib/settings';
import { ListingModal } from '@/components/ListingModal';
import DeleteConversationModal from '@/components/DeleteConversationModal';
import DeleteNotificationModal from '@/components/DeleteNotificationModal';
import OfferModal from '@/components/OfferModal';
import OfferMessage from '@/components/OfferMessage';
import { generateProfilePicture, getInitials, formatPostAge, formatCADAmount, cn } from "@/lib/utils";
import { useBtcRate } from '@/lib/hooks/useBtcRate';

interface Chat {
  id: string;
  other_user: string;
  other_user_verified: boolean;
  listing_id: string;
  listing_title: string;
  listing_image: string;
  listing_price_sat: number;
  listing_created_at: number;
  listing_location: string;
  listing_ad_type: string;
  last_message: string;
  last_message_time: number;
  unread_count: number;
  seller_thumbsUp: number;
}

interface SystemNotification {
  id: string;
  userNotificationId?: string | null;
  systemNotificationId?: string | null;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'system' | 'welcome' | 'update';
  icon?: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface Message {
  id: string;
  content: string;
  created_at: number; // Use created_at to match the global Message type
  is_from_current_user: boolean;
  sender_name: string;
  type?: 'message' | 'offer'; // Added for offer support
  amount_sat?: number; // Added for offer support
  expires_at?: number; // Added for offer support
  status?: string; // Added for offer support
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Cache for messages to avoid re-fetching
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Debounce click handlers to prevent rapid API calls
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Delete conversation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Chat | null>(null);
  
  // Delete notification modal state
  const [showDeleteNotificationModal, setShowDeleteNotificationModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<SystemNotification | null>(null);
  
  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // iMessage-style timestamp logic
  const shouldShowTimestamp = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true; // First message always shows timestamp
    
    const currentTime = currentMessage.created_at * 1000; // Convert to milliseconds
    const previousTime = previousMessage.created_at * 1000;
    const timeDiff = currentTime - previousTime;
    
    // Show timestamp if more than 5 minutes have passed
    const FIVE_MINUTES = 5 * 60 * 1000;
    return timeDiff > FIVE_MINUTES;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // If message is from today, show time only
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    }
    
    // If message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}`;
    }
    
    // If message is from this week (within 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (messageDate.getTime() > weekAgo.getTime()) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' at ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    }
    
    // For older messages, show full date and time
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  const loadChats = async (showLoading = true) => {
    if (!user?.email) {
      
      return;
    }
    
    
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const url = `/api/chat/list?userEmail=${encodeURIComponent(user.email)}`;
      
      
      const response = await fetch(url);
      
      
      
      if (response.ok) {
        const data = await response.json() as { chats: any[] };

        
        const transformedChats = data.chats.map((chat: any) => ({
            id: chat.id,
            other_user: chat.seller?.name || 'Unknown User',
            other_user_verified: chat.seller?.verified || false,
            listing_id: chat.listing?.id || chat.listing_id,
            listing_title: chat.listing?.title || chat.listing_title,
            listing_image: chat.listing?.imageUrl || chat.listing_image,
            listing_price_sat: chat.listing?.priceSat || chat.listing_price || 0,
            listing_created_at: chat.listing?.createdAt || chat.listing_created_at || 0,
            listing_location: chat.listing?.location || chat.listing_location || 'Location N/A',
            listing_ad_type: chat.listing?.type || 'sell',
            last_message: chat.lastMessageText || chat.latest_message_text || 'No messages yet',
            last_message_time: chat.latest_message_time || chat.lastMessageAt || chat.created_at || 0,
            unread_count: chat.unread_count || 0,
            seller_thumbsUp: chat.seller?.rating || 0
                }));
        
        // Only update if there are actual changes to prevent flashing
        setChats(prev => {
          // Quick comparison: check length and last message times
          if (prev.length !== transformedChats.length) {
            return transformedChats;
          }
          
          // Check if any conversation has updated last message time
          for (let i = 0; i < prev.length; i++) {
            if (prev[i].last_message_time !== transformedChats[i].last_message_time ||
                prev[i].last_message !== transformedChats[i].last_message ||
                prev[i].unread_count !== transformedChats[i].unread_count) {
              return transformedChats;
            }
          }
          
          return prev;
        });
        
        // Auto-select the most recent item (chat or notification)
        if (transformedChats.length > 0 && !selectedChat && !selectedNotification) {
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

  const loadSystemNotifications = async () => {
    
    // If no user, don't load notifications
    if (!user?.email) {
      return;
    }

    try {
      const url = `/api/notifications?userEmail=${encodeURIComponent(user.email)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; notifications: any[] };
        
        if (data.success && data.notifications.length > 0) {
          const transformedNotifications: SystemNotification[] = data.notifications.map(notification => {
            // Use user_notification_id for delete operations, fallback to notification_id for display
            const id = notification.user_notification_id || notification.notification_id;
            return {
              id,
              // Store both IDs for proper API operations
              userNotificationId: notification.user_notification_id,
              systemNotificationId: notification.notification_id,
              title: notification.title,
              message: notification.message,
              timestamp: notification.received_at, // Keep as seconds since formatTimestamp expects seconds
              read: !!notification.read_at,
              type: 'system' as const,
              icon: notification.icon,
              priority: notification.priority || 'normal'
            };
          });
          setSystemNotifications(transformedNotifications);
        }
      } else {
        console.error('Error loading system notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading system notifications:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    
    if (!user?.email) {
      return;
    }
    
    // Set selected states immediately to prevent UI flicker
    setSelectedChat(chatId);
    setSelectedNotification(null);
    
    // Check cache first
    if (messagesCache[chatId]) {
      setMessages(messagesCache[chatId]);
      return;
    }
    
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json() as { messages: any[]; current_user_id: string };

        
        // Transform messages to match the expected format
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.text, // API returns 'text', not 'content'
          created_at: msg.created_at,
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
        const messageText = newMessage.trim();
        setNewMessage('');
        
        // Add new message to cache and state immediately for better UX
        const newMessageObj: Message = {
          id: Date.now().toString(), // Temporary ID
          content: messageText,
          created_at: Math.floor(Date.now() / 1000), // Use seconds to match server and ChatModal
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
        
        // Update conversation list to show new most recent message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat 
            ? {
                ...chat,
                last_message: messageText,
                last_message_time: Math.floor(Date.now() / 1000) // Use seconds to match server
              }
            : chat
        ));
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

  const sendOffer = async (amount: number, expiresAt: number) => {
    if (!selectedChat || !user?.email) return;

    try {
      const response = await fetch('/api/offers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat,
          listingId: chats.find(c => c.id === selectedChat)?.listing_id,
          amountSat: amount,
          expiresAt
        })
      });

      if (response.ok) {
        // Reload messages to show the new offer
        await loadMessages(selectedChat);
      } else {
        const error = await response.json() as { error?: string };
        console.error('Failed to send offer:', error);
        alert(error.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer');
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'decline' | 'revoke' | 'abort') => {
    try {
      const response = await fetch('/api/offers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          action
        })
      });

      if (response.ok) {
        // Reload messages to show the updated offer status
        if (selectedChat) {
          await loadMessages(selectedChat);
        }
      } else {
        const error = await response.json() as { error?: string };
        console.error('Failed to process offer action:', error);
        alert(error.error || 'Failed to process offer action');
      }
    } catch (error) {
      console.error('Error processing offer action:', error);
      alert('Failed to process offer action');
    }
  };

  const handleDeleteConversation = (chat: Chat) => {
    setConversationToDelete(chat);
    setShowDeleteModal(true);
  };

  const handleDeleteNotification = (notification: SystemNotification) => {
    setNotificationToDelete(notification);
    setShowDeleteNotificationModal(true);
  };

  const confirmDeleteConversation = async () => {
    
    if (!conversationToDelete) return;

    try {
      const response = await fetch('/api/chat/hide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: conversationToDelete.id,
          action: 'hide'
        }),
      });

      if (response.ok) {
        // Remove the conversation from the local state
        setChats(prev => prev.filter(chat => chat.id !== conversationToDelete.id));
        
        // If this was the selected chat, clear the selection
        if (selectedChat === conversationToDelete.id) {
          setSelectedChat(null);
          setMessages([]);
        }
        
        // Close the modal
        setShowDeleteModal(false);
        setConversationToDelete(null);
      } else {
        console.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      let response;
      
      // For old notifications with null userNotificationId, we need to delete differently
      if (!notificationToDelete.userNotificationId) {
        // For old notifications, we'll delete by system notification ID + user email
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: notificationToDelete.id,
            action: 'delete_by_system_id',
            userEmail: user?.email
          })
        });
      } else {
        // Use userNotificationId for new notifications
        response = await fetch('/api/notifications', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId: notificationToDelete.userNotificationId
          }),
        });
      }

      if (response.ok) {
        // Remove the notification from the local state
        setSystemNotifications(prev => prev.filter(notification => notification.id !== notificationToDelete.id));
        
        // If this was the selected notification, clear the selection
        if (selectedNotification === notificationToDelete.id) {
          setSelectedNotification(null);
        }
        
        // Close the modal
        setShowDeleteNotificationModal(false);
        setNotificationToDelete(null);
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Debounced click handler to prevent rapid API calls
  const handleItemClick = (item: any) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (item.itemType === 'chat') {
        setSelectedChat(item.id);
        setSelectedNotification(null);
        loadMessages(item.id);
      } else {
        selectNotification(item as SystemNotification);
      }
    }, 100); // 100ms debounce
    
    setClickTimeout(timeout);
  };

  const selectNotification = async (notification: SystemNotification) => {
    setSelectedNotification(notification.id);
    setSelectedChat(null);
    
    // Mark as read if not already read
    if (!notification.read) {
      // For old notifications with null userNotificationId, we need to mark read differently
      if (!notification.userNotificationId) {
        try {
          const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId: notification.id,
              action: 'mark_read_by_system_id',
              userEmail: user?.email
            })
          });

          if (response.ok) {
            // Update local state
            setSystemNotifications(prev => 
              prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
          } else {
            console.error('Failed to mark old notification as read:', response.status);
          }
        } catch (error) {
          console.error('Error marking old notification as read:', error);
        }
        return;
      }

      // Use userNotificationId for new notifications
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: notification.userNotificationId,
            action: 'mark_read'
          })
        });

        if (response.ok) {
          // Update local state
          setSystemNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
        } else {
          console.error('Failed to mark notification as read:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
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
          created_at: msg.created_at,
          is_from_current_user: msg.is_from_current_user,
          sender_name: msg.is_from_current_user ? 'You' : 'Other User'
        }));
        
        // Check if there are actual changes (compare with cached messages)
        const cachedMessages = messagesCache[chatId] || [];
        const hasNewMessages = transformedMessages.length > cachedMessages.length;
        
        // Only update if there are actual changes to prevent flashing
        const hasChanges = hasNewMessages || 
          cachedMessages.length !== transformedMessages.length ||
          (cachedMessages.length > 0 && transformedMessages.length > 0 && 
           cachedMessages[cachedMessages.length - 1].id !== transformedMessages[transformedMessages.length - 1].id);
        
        if (hasChanges) {
          // Update cache and current messages if this chat is selected
          setMessagesCache(prev => ({
            ...prev,
            [chatId]: transformedMessages
          }));
          
          if (selectedChat === chatId) {
            setMessages(transformedMessages);
          }
          
          // If there are new messages, update the conversation list
          if (hasNewMessages && transformedMessages.length > 0) {
            const latestMessage = transformedMessages[transformedMessages.length - 1];
            
            setChats(prev => prev.map(chat => 
              chat.id === chatId 
                ? {
                    ...chat,
                    last_message: latestMessage.content,
                    last_message_time: latestMessage.created_at
                  }
                : chat
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Function to open listing modal
  const openListingModal = async (listingId: string | number) => {
    try {
      // Fetch the real listing data from the API
      const response = await fetch(`/api/listings/${listingId}`);
      if (!response.ok) {
        console.error('Failed to fetch listing:', response.status);
        return;
      }
      
      const listingData = await response.json();
      
      // The listings API now returns the correct transformed data, so use it directly
      setModal('active', listingData);
    } catch (error) {
      console.error('Error fetching listing:', error);
    }
  };

  const handleListingClick = (listingId: string, title: string) => {
    openListingModal(listingId);
  };

  useEffect(() => {
    
    if (user?.email) {
      loadChats();
      loadSystemNotifications();
      setIsInitialLoad(false);
    } else {
      // Don't clear existing data if user becomes null temporarily
      // This prevents data loss during authentication state changes
      // Only set initial load to false if we've never had a user
      if (isInitialLoad) {
        // Wait a bit for user to load
        const timer = setTimeout(() => {
          setIsInitialLoad(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.email, isInitialLoad]);

  // Auto-scroll to bottom when new messages are added (not on every refresh)
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  useEffect(() => {
    // Only auto-scroll if there are more messages than before (new message added)
    if (messages.length > lastMessageCount && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount]);
  
  // Load messages when a chat is selected
  useEffect(() => {
    if (selectedChat && user?.email) {
      loadMessages(selectedChat);
    }
  }, [selectedChat, user?.email]);
  
  // Periodic refresh of selected chat messages (every 30 seconds)
  useEffect(() => {
    if (!selectedChat) return;
    
    const interval = setInterval(() => {
      refreshMessages(selectedChat);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Periodic refresh of conversation list and notifications (every 60 seconds to reduce load)
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      loadChats(false); // Don't show loading spinner for periodic refresh
      loadSystemNotifications(); // Refresh notifications too
    }, 60000); // 60 seconds - reduced frequency to prevent performance issues
    
    return () => clearInterval(interval);
  }, [user?.email]);

  // Listen for notification state changes from other components
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      // Reload notifications when state changes in other components
      loadSystemNotifications();
    };

    window.addEventListener('notificationStateChanged', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('notificationStateChanged', handleStateChange as EventListener);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

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

  // Auto-select the topmost item if nothing is selected
  React.useEffect(() => {
    if (combinedItems.length > 0 && !selectedChat && !selectedNotification) {
      const topItem = combinedItems[0];
      if (topItem.itemType === 'notification') {
        setSelectedNotification(topItem.id);
      } else if (topItem.itemType === 'chat') {
        setSelectedChat(topItem.id);
        loadMessages(topItem.id);
      }
    }
  }, [combinedItems, selectedChat, selectedNotification]);

  // Calculate counts for filter buttons
  const totalCount = chats.length + systemNotifications.length;
  const unreadCount = chats.filter(c => c.unread_count > 0).length + systemNotifications.filter(n => !n.read).length;

  // Memoize className calculation for better performance
  const getItemClassName = React.useCallback((item: any) => {
    const isSelected = (item.itemType === 'chat' && selectedChat === item.id) ||
                      (item.itemType === 'notification' && selectedNotification === item.id);
    
    if (isSelected) {
      // Selected: Always use bright orange vertical line regardless of read/unread status
      const isUnread = item.itemType === 'notification' ? !item.read : item.unread_count > 0;
      if (isUnread) {
        // Selected unread: keep vibrant styling but add bright orange selection border
        if (item.itemType === 'notification') {
          const icon = item.icon || 'system';
          switch (icon) {
            case 'info':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 border-l-8 border-orange-500 shadow-md';
            case 'success':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 border-l-8 border-orange-500 shadow-md';
            case 'warning':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 border-l-8 border-orange-500 shadow-md';
            case 'error':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 border-l-8 border-orange-500 shadow-md';
            case 'system':
            default:
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-600 border-l-8 border-orange-500 shadow-md';
          }
        } else {
          // Selected unread chat
          return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/60 dark:to-blue-700/60 shadow-md border-l-8 border-orange-600';
        }
      } else {
        // Selected read: keep faded colors but add bright orange selection border
        if (item.itemType === 'notification') {
          const icon = item.icon || 'system';
          switch (icon) {
            case 'info':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 bg-gradient-to-br from-blue-50/20 to-blue-100/20 dark:from-blue-900/10 dark:to-blue-800/10 border-l-8 border-orange-500';
            case 'success':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-green-50/30 dark:hover:bg-green-900/10 bg-gradient-to-br from-green-50/20 to-green-100/20 dark:from-green-900/10 dark:to-green-800/10 border-l-8 border-orange-500';
            case 'warning':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50/30 dark:hover:bg-red-900/10 bg-gradient-to-br from-red-50/20 to-red-100/20 dark:from-red-900/10 dark:to-red-800/10 border-l-8 border-orange-500';
            case 'error':
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50/30 dark:hover:bg-red-900/10 bg-gradient-to-br from-red-50/20 to-red-100/20 dark:from-red-900/10 dark:to-red-800/10 border-l-8 border-orange-500';
            case 'system':
            default:
              return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 bg-gradient-to-br from-purple-50/20 to-purple-100/20 dark:from-purple-900/10 dark:to-purple-800/10 border-l-8 border-orange-500';
          }
        } else {
          // Selected read chat
          return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/20 dark:to-neutral-700/20 border-l-8 border-orange-600';
        }
      }
    }
    
    // Check if item is unread
    const isUnread = item.itemType === 'notification' ? !item.read : item.unread_count > 0;
    
    if (item.itemType === 'notification') {
      const icon = item.icon || 'system';
      if (isUnread) {
        // UNREAD: Very vibrant and high contrast
        switch (icon) {
          case 'info':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 border-l-4 border-blue-600 shadow-md';
          case 'success':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 border-l-4 border-green-600 shadow-md';
          case 'warning':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 border-l-4 border-red-600 shadow-md';
          case 'error':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 border-l-4 border-red-600 shadow-md';
          case 'system':
        default:
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-600 border-l-4 border-purple-600 shadow-md';
        }
      } else {
        // READ: Very faded and low contrast but still colored
        switch (icon) {
          case 'info':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 bg-gradient-to-br from-blue-50/20 to-blue-100/20 dark:from-blue-900/10 dark:to-blue-800/10';
          case 'success':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-green-50/30 dark:hover:bg-green-900/10 bg-gradient-to-br from-green-50/20 to-green-100/20 dark:from-green-900/10 dark:to-green-800/10';
          case 'warning':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50/30 dark:hover:bg-red-900/10 bg-gradient-to-br from-red-50/20 to-red-100/20 dark:from-red-900/10 dark:to-red-800/10';
          case 'error':
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-red-50/30 dark:hover:bg-red-900/10 bg-gradient-to-br from-red-50/20 to-red-100/20 dark:from-red-900/10 dark:to-red-800/10';
          case 'system':
          default:
            return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 bg-gradient-to-br from-purple-50/20 to-purple-100/20 dark:from-purple-900/10 dark:to-purple-800/10';
        }
      }
    }
    
    // Chat items
    if (isUnread) {
      // UNREAD: Very vibrant and high contrast
      return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/60 dark:to-blue-700/60 shadow-md border-l-4 border-blue-500';
    } else {
      // READ: Very faded and low contrast
      return 'group p-3 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/20 dark:to-neutral-700/20';
    }
  }, [selectedChat, selectedNotification]);

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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                        onClick={() => handleItemClick(item)}
                        className={getItemClassName(item)}
                        style={{
                          borderLeftColor: (item.itemType === 'chat' && selectedChat === item.id) || 
                                         (item.itemType === 'notification' && selectedNotification === item.id) 
                                         ? '#f97316' : undefined
                        }}
                      >
                        {item.itemType === 'notification' ? (
                          /* System Notification Layout - Pill Style */
                          <div className="flex items-start gap-3 relative">
                            <div className="flex-1 min-w-0">
                              {/* Row 1: Bitsbarter Team with Logo */}
                              <div className="flex items-center gap-2 mb-2">
                                {/* Bitsbarter Logo */}
                                <img
                                  src="/Bitsbarterlogo.svg"
                                  alt="Bitsbarter"
                                  className="w-4 h-4 flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                
                                {/* Bitsbarter Team Pill */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                      selectedNotification === item.id 
                                    ? !item.read
                                      ? 'bg-white/20 dark:bg-neutral-700/60 text-neutral-900 dark:text-white border border-neutral-400/80 dark:border-neutral-500/80 hover:bg-white/30 dark:hover:bg-neutral-600/60 font-bold'
                                      : 'bg-white/10 dark:bg-neutral-800/30 text-neutral-500 dark:text-neutral-500 border border-neutral-300/60 dark:border-neutral-600/60 hover:bg-white/20 dark:hover:bg-neutral-700/40 font-semibold'
                                    : !item.read
                                      ? 'bg-white/20 dark:bg-neutral-700/60 text-neutral-900 dark:text-white border border-neutral-400/80 dark:border-neutral-500/80 hover:bg-white/30 dark:hover:bg-neutral-600/60 font-bold'
                                      : 'bg-white/5 dark:bg-neutral-800/20 text-neutral-400 dark:text-neutral-600 border border-neutral-200/40 dark:border-neutral-700/30 hover:bg-white/10 dark:hover:bg-neutral-700/30 font-light'
                                }`}>
                                  <span className="ml-1">The bitsbarter team</span>
                                  </span>
                              </div>
                              
                              {/* Row 2: Title */}
                              <h3 className={`text-sm truncate mb-1 ${
                                selectedNotification === item.id 
                                  ? !item.read
                                    ? 'text-neutral-900 dark:text-white font-black'
                                    : 'text-neutral-500 dark:text-neutral-500 font-semibold'
                                  : !item.read
                                    ? 'text-neutral-900 dark:text-white font-black'
                                    : 'text-neutral-400 dark:text-neutral-600 font-light'
                              }`}>
                                {item.title}
                              </h3>
                              
                              {/* Rows 3-4: Truncated message */}
                              <p className={`text-xs truncate mb-1 ${
                                selectedNotification === item.id 
                                  ? !item.read
                                    ? 'text-neutral-700 dark:text-neutral-200'
                                    : 'text-neutral-400 dark:text-neutral-500'
                                  : !item.read
                                    ? 'text-neutral-700 dark:text-neutral-200'
                                    : 'text-neutral-300 dark:text-neutral-600'
                              }`}>
                                {(() => {
                                  // Strip Markdown formatting for conversation preview
                                  let text = item.message || '';
                                  text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
                                  text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
                                  text = text.replace(/`([^`]+)`/g, '$1'); // Remove code markers
                                  text = text.replace(/^#+\s*/gm, ''); // Remove heading markers
                                  text = text.replace(/^>\s*/gm, ''); // Remove quote markers
                                  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // Remove link markers, keep text
                                  return text;
                                })()}
                              </p>
                            </div>
                            
                            {/* Age of Notification - Top Right */}
                            <div className="flex-shrink-0">
                              <span className={`text-xs ${
                                selectedNotification === item.id 
                                  ? item.read 
                                    ? 'text-neutral-400 dark:text-neutral-500 font-semibold' 
                                    : 'text-neutral-600 dark:text-neutral-300 font-bold'
                                  : item.read 
                                    ? 'text-neutral-300 dark:text-neutral-600 font-light' 
                                    : 'text-neutral-600 dark:text-neutral-300 font-bold'
                              }`}>
                                {formatPostAge(item.timestamp)}
                              </span>
                            </div>
                            
                            {/* Delete Button - Bottom Right (Show on Hover) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                handleDeleteNotification(item);
                                }}
                              className="absolute bottom-0 right-0 p-1 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                                title="Delete notification"
                              >
                              <svg className="w-4 h-4 text-neutral-600 dark:text-white hover:text-neutral-800 dark:hover:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                          </div>
                        ) : (
                          /* Chat Layout */
                          <div className="flex items-start gap-3 relative">
                            {/* Content - New Layout */}
                            <div className="flex-1 min-w-0">
                              {/* Top Row: Unread Count + Username Pill */}
                              <div className="flex items-center gap-2 mb-1">
                                {/* Unread Count Badge */}
                                {item.unread_count > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center font-bold ${
                                    selectedChat === item.id 
                                      ? 'bg-red-700 text-white shadow-lg'
                                      : 'bg-red-600 text-white shadow-md'
                                  }`}>
                                    {item.unread_count}
                                  </span>
                                )}
                                
                                {/* Username Pill with Profile Icon */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  selectedChat === item.id 
                                    ? item.unread_count > 0
                                      ? 'bg-white/20 dark:bg-neutral-700/60 text-neutral-900 dark:text-white border border-neutral-400/80 dark:border-neutral-500/80 hover:bg-white/30 dark:hover:bg-neutral-600/60 font-bold'
                                      : 'bg-white/10 dark:bg-neutral-800/30 text-neutral-500 dark:text-neutral-500 border border-neutral-300/60 dark:border-neutral-600/60 hover:bg-white/20 dark:hover:bg-neutral-700/40 font-semibold'
                                    : item.unread_count > 0
                                      ? 'bg-white/20 dark:bg-neutral-700/60 text-neutral-900 dark:text-white border border-neutral-400/80 dark:border-neutral-500/80 hover:bg-white/30 dark:hover:bg-neutral-600/60 font-bold'
                                      : 'bg-white/5 dark:bg-neutral-800/20 text-neutral-400 dark:text-neutral-600 border border-neutral-200/40 dark:border-neutral-700/30 hover:bg-white/10 dark:hover:bg-neutral-700/30 font-light'
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
                                {item.other_user_verified && (
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
                              <h3
                                className={`text-sm truncate mb-1 ${
                                  selectedChat === item.id 
                                    ? item.unread_count > 0
                                      ? 'text-neutral-900 dark:text-white font-black'
                                      : 'text-neutral-500 dark:text-neutral-500 font-semibold'
                                    : item.unread_count > 0
                                      ? 'text-neutral-900 dark:text-white font-black'
                                      : 'text-neutral-400 dark:text-neutral-600 font-light'
                                }`}
                              >
                                {item.listing_title}
                              </h3>
                              
                              {/* Last Message */}
                              <p className={`text-xs truncate mb-1 ${
                                selectedChat === item.id 
                                  ? item.unread_count > 0
                                    ? 'text-neutral-700 dark:text-neutral-200'
                                    : 'text-neutral-400 dark:text-neutral-500'
                                  : item.unread_count > 0
                                    ? 'text-neutral-700 dark:text-neutral-200'
                                    : 'text-neutral-300 dark:text-neutral-600'
                              }`}>
                                {(() => {
                                  // Simple Markdown rendering for conversation preview
                                  let text = item.last_message || '';
                                  text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
                                  text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
                                  text = text.replace(/`([^`]+)`/g, '$1'); // Remove code markers
                                  text = text.replace(/^#+\s*/gm, ''); // Remove heading markers
                                  text = text.replace(/^>\s*/gm, ''); // Remove quote markers
                                  return text;
                                })()}
                              </p>
                              
                            </div>
                            
                            {/* Age of Last Message - Top Right */}
                            <div className="flex-shrink-0">
                              <span className={`text-xs ${
                                selectedChat === item.id 
                                  ? item.unread_count > 0
                                    ? 'text-neutral-600 dark:text-neutral-300 font-bold'
                                    : 'text-neutral-400 dark:text-neutral-500 font-semibold'
                                  : item.unread_count > 0
                                    ? 'text-neutral-600 dark:text-neutral-300 font-bold'
                                    : 'text-neutral-300 dark:text-neutral-600 font-light'
                              }`}>
                                {formatPostAge(item.last_message_time)}
                              </span>
                            </div>
                            
                            {/* Delete Button - Bottom Right (Show on Hover) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(item);
                                }}
                              className="absolute bottom-0 right-0 p-1 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                                title="Delete conversation"
                              >
                              <svg className="w-4 h-4 text-neutral-600 dark:text-white hover:text-neutral-800 dark:hover:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
                    <div className="flex gap-3">
                      {/* Left: Listing Image */}
                      <div className="p-1 flex-shrink-0">
                      <img
                        src={chats.find(c => c.id === selectedChat)?.listing_image || '/placeholder-listing.jpg'}
                        alt="Listing"
                          className="w-24 h-24 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={async () => {
                          const selectedChatData = chats.find(c => c.id === selectedChat);
                          if (selectedChatData?.listing_id) {
                              await openListingModal(selectedChatData.listing_id);
                          }
                        }}
                      />
                      </div>
                      
                      {/* Right: Content Rows */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Selling Tag + Title + Age + Location */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Selling/Looking For Tag */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                              chats.find(c => c.id === selectedChat)?.listing_ad_type === 'want' 
                                ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}>
                              {chats.find(c => c.id === selectedChat)?.listing_ad_type === 'want' ? 'Looking For' : 'Selling'}
                            </span>
                            
                            {/* Listing Title */}
                            <h2 className="text-lg font-bold text-white truncate">
                              {chats.find(c => c.id === selectedChat)?.listing_title || 'Untitled Listing'}
                            </h2>
                          </div>
                          
                          {/* Age + Location in one pill */}
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-white/20 backdrop-blur-sm flex-shrink-0">
                            {chats.find(c => c.id === selectedChat)?.listing_created_at ? 
                              `${formatPostAge(chats.find(c => c.id === selectedChat)?.listing_created_at!)} ago` : 
                              'Unknown'
                            } in {chats.find(c => c.id === selectedChat)?.listing_location || 'Location N/A'}
                          </span>
                        </div>
                        
                        {/* Row 2: Price + Dollar Equivalent */}
                        <div className="text-white/90 mb-3">
                            {(() => {
                              const priceSat = chats.find(c => c.id === selectedChat)?.listing_price_sat || 0;
                              if (priceSat === -1) {
                                return (
                                  <div>
                                    <span className="text-lg font-semibold">Make an offer</span>
                                  </div>
                                );
                              }
                              return unit === 'BTC' ? (
                              <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold">
                                    {(Number(priceSat) / 100000000).toFixed(8)} BTC
                                  </span>
                                  {/* Dollar equivalent */}
                                <span className="text-sm text-white/80">
                                  ({formatCADAmount((Number(priceSat) / 100000000) * (btcCad || 0))})
                                </span>
                                </div>
                              ) : (
                              <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold">
                                    {priceSat.toLocaleString()} sats
                                  </span>
                                  {/* Dollar equivalent */}
                                <span className="text-sm text-white/80">
                                  ({formatCADAmount((Number(priceSat) / 100000000) * (btcCad || 0))})
                                </span>
                                </div>
                              );
                            })()}
                        </div>
                        
                        {/* Row 3: Username + Reputation + Action Buttons */}
                        <div className="flex items-center justify-between">
                          {/* Left: Username + Reputation */}
                        <div className="flex items-center gap-2">
                          <div 
                              className="inline-flex items-center px-2 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer relative bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-105 hover:shadow-md"
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
                                  className="w-4 h-4 rounded-full object-cover"
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
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center hidden">
                                <span className="text-xs font-bold text-white">{getInitials(chats.find(c => c.id === selectedChat)?.other_user || '')}</span>
                              </div>
                            </div>
                              <span className="text-xs ml-1 text-white">{chats.find(c => c.id === selectedChat)?.other_user}</span>
                          </div>
                          
                          {/* Verified Badge */}
                          {chats.find(c => c.id === selectedChat)?.other_user_verified && (
                            <span className="verified-badge inline-flex h-5 w-5 items-center justify-center rounded-full text-white font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} aria-label="Verified" title="User has verified their identity">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          )}
                          
                            {/* User Reputation */}
                            <span className="text-sm text-white/80">+{chats.find(c => c.id === selectedChat)?.seller_thumbsUp || 0} 👍</span>
                      </div>
                      
                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* View Listing Button */}
                            <button
                              onClick={async () => {
                                const selectedChatData = chats.find(c => c.id === selectedChat);
                                if (selectedChatData?.listing_id) {
                                  await openListingModal(selectedChatData.listing_id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                              title="View listing"
                            >
                              View Listing
                            </button>
                            
                            {/* Mark as Unread Button */}
                        <button
                          onClick={async () => {
                            const selectedChatData = chats.find(c => c.id === selectedChat);
                                if (selectedChatData) {
                                  setChats(prev => 
                                    prev.map(c => 
                                      c.id === selectedChatData.id ? { ...c, unread_count: 1 } : c
                                    )
                                  );
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              title="Mark as unread"
                            >
                              Mark Unread
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                const selectedChatData = chats.find(c => c.id === selectedChat);
                                if (selectedChatData) {
                                  handleDeleteConversation(selectedChatData);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                              title="Delete conversation"
                            >
                              Delete
                        </button>
                          </div>
                        </div>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((item, index) => {
                        const prevItem = index > 0 ? messages[index - 1] : null;
                        const showTimestamp = shouldShowTimestamp(item, prevItem);
                        
                        return (
                          <div key={item.id}>
                            {/* Timestamp header - only show when needed */}
                            {showTimestamp && (
                              <div className="flex justify-center my-4">
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                  {formatTimestamp(item.created_at)}
                                </div>
                              </div>
                            )}
                            
                            {/* Render offer or message */}
                            {item.type === 'offer' ? (
                              <OfferMessage
                                offer={item}
                                currentUserId={user?.id || ''}
                                dark={dark}
                                unit={unit}
                                onAction={handleOfferAction}
                              />
                            ) : (
                              /* Message bubble */
                              <div
                                className={`flex ${item.is_from_current_user ? 'justify-end' : 'justify-start'} mt-3`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                    item.is_from_current_user
                                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                                  }`}
                                >
                                  <div 
                                    className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                      __html: (() => {
                                        let text = item.content || '';
                                        // Enhanced Markdown rendering for messages
                                        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                                        text = text.replace(/`([^`]+)`/g, '<code class="bg-black/20 dark:bg-white/20 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
                                        text = text.replace(/^# (.*$)/gm, '<div class="font-bold text-base">$1</div>');
                                        text = text.replace(/^## (.*$)/gm, '<div class="font-semibold text-sm">$1</div>');
                                        text = text.replace(/^### (.*$)/gm, '<div class="font-medium text-sm">$1</div>');
                                        text = text.replace(/^> (.*$)/gm, '<div class="border-l-2 border-current/30 pl-2 italic">$1</div>');
                                        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>');
                                        text = text.replace(/\n/g, '<br>');
                                        return text;
                                      })()
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-800/50 rounded-bl-3xl">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowOfferModal(true)}
                        className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
                        title="Make an offer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none min-h-[30px] max-h-16"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (newMessage.trim() && !isSending) {
                                sendMessage();
                              }
                            }
                          }}
                        />
                      </div>
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
                  {/* System Notification View - Email Style */}
                  <div className="flex-1 flex flex-col">
                    {/* Email Header */}
                    <div className={`border-b border-neutral-200 dark:border-neutral-700 p-4 ${
                      (() => {
                        const notification = systemNotifications.find(n => n.id === selectedNotification);
                        const priority = notification?.priority || 'normal';
                        switch (priority) {
                          case 'urgent':
                            return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/40';
                          case 'high':
                            return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/40';
                          case 'normal':
                            return 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40';
                          case 'low':
                            return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/40';
                          default:
                            return 'bg-white dark:bg-neutral-900';
                        }
                      })()
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Notification Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                            systemNotifications.find(n => n.id === selectedNotification)?.icon === 'info' ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900' :
                            systemNotifications.find(n => n.id === selectedNotification)?.icon === 'success' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900' :
                            systemNotifications.find(n => n.id === selectedNotification)?.icon === 'warning' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900' :
                            systemNotifications.find(n => n.id === selectedNotification)?.icon === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900' :
                            'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900'
                          }`}>
                            {systemNotifications.find(n => n.id === selectedNotification)?.icon === 'info' && (
                              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {systemNotifications.find(n => n.id === selectedNotification)?.icon === 'success' && (
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {systemNotifications.find(n => n.id === selectedNotification)?.icon === 'warning' && (
                              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                            {systemNotifications.find(n => n.id === selectedNotification)?.icon === 'error' && (
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {(!systemNotifications.find(n => n.id === selectedNotification)?.icon || systemNotifications.find(n => n.id === selectedNotification)?.icon === 'system') && (
                              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          
                          <div>
                            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                              {systemNotifications.find(n => n.id === selectedNotification)?.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                              <span>bitsbarter</span>
                              <span>•</span>
                              <span>{formatTimestamp(systemNotifications.find(n => n.id === selectedNotification)?.timestamp || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Mark as Unread Button */}
                          {systemNotifications.find(n => n.id === selectedNotification)?.read && (
                            <button
                              onClick={async () => {
                                const notification = systemNotifications.find(n => n.id === selectedNotification);
                                if (notification) {
                                  try {
                                    const response = await fetch('/api/notifications', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        notificationId: notification.id,
                                        action: 'mark_unread'
                                      })
                                    });

                                    if (response.ok) {
                                      // Update local state
                                      setSystemNotifications(prev => 
                                        prev.map(n => 
                                          n.id === notification.id ? { ...n, read: false } : n
                                        )
                                      );
                                      // Trigger events to refresh all notification components
                                      window.dispatchEvent(new CustomEvent('refreshNotifications'));
                                      window.dispatchEvent(new CustomEvent('notificationStateChanged', {
                                        detail: { action: 'mark_unread', notificationId: notification.id }
                                      }));
                                    } else {
                                      console.error('Failed to mark notification as unread');
                                    }
                                  } catch (error) {
                                    console.error('Error marking notification as unread:', error);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              title="Mark as unread"
                            >
                              Mark Unread
                            </button>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              const notification = systemNotifications.find(n => n.id === selectedNotification);
                              if (notification) {
                                handleDeleteNotification(notification);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Delete notification"
                          >
                            Delete
                          </button>
                          
                          {/* Close Button */}
                          <button
                            onClick={() => setSelectedNotification(null)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Close notification"
                          >
                            <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="flex-1 p-6 bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="max-w-4xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                              <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {(() => {
                                  const message = systemNotifications.find(n => n.id === selectedNotification)?.message || '';
                                  // Enhanced Markdown rendering
                                  let text = message;
                                  
                                  // Headers
                                  text = text.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-neutral-900 dark:text-white mb-3 mt-4">$1</h1>');
                                  text = text.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-2 mt-3">$1</h2>');
                                  text = text.replace(/^### (.*$)/gm, '<h3 class="text-base font-bold text-neutral-900 dark:text-white mb-2 mt-2">$1</h3>');
                                  
                                  // Bold and italic
                                  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>');
                                  text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
                                  
                                  // Links
                                  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">$1</a>');
                                  
                                  // Code
                                  text = text.replace(/`([^`]+)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-xs font-mono text-neutral-800 dark:text-neutral-200">$1</code>');
                                  
                                  // Quotes
                                  text = text.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-300 dark:border-blue-600 pl-4 italic my-3 text-neutral-700 dark:text-neutral-300">$1</blockquote>');
                                  
                                  // Dividers
                                  text = text.replace(/^---$/gm, '<hr class="my-4 border-neutral-300 dark:border-neutral-600">');
                                  
                                  // Line breaks
                                  text = text.replace(/\n/g, '<br>');
                                  
                                  return <div dangerouslySetInnerHTML={{ __html: text }} />;
                                })()}
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    {isInitialLoad ? (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-full flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                          Loading messages...
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          Please wait while we load your conversations
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 mx-auto mb-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                          Select a conversation or notification
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          Choose a chat or notification from the left panel
                        </p>
                      </>
                    )}
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
          fromMessagesPage={true}
        />
      )}
      
      {/* Delete Conversation Modal */}
      <DeleteConversationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConversationToDelete(null);
        }}
        onConfirm={confirmDeleteConversation}
        dark={dark}
        username={conversationToDelete?.other_user || "this user"}
      />
      
      {/* Delete Notification Modal */}
      <DeleteNotificationModal
        isOpen={showDeleteNotificationModal}
        onClose={() => {
          setShowDeleteNotificationModal(false);
          setNotificationToDelete(null);
        }}
        onConfirm={confirmDeleteNotification}
        dark={dark}
        notificationTitle={notificationToDelete?.title || "this notification"}
      />
      
      {/* Offer Modal */}
      <OfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSendOffer={sendOffer}
        listingPrice={selectedChat ? chats.find(c => c.id === selectedChat)?.listing_price_sat : undefined}
        dark={dark}
      />
    </div>
  );
}
