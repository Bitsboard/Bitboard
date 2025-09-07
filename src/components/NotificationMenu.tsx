"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/settings";

interface Notification {
  id: string;
  type: 'message' | 'update' | 'system' | 'chat';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // Chat-specific fields
  other_user?: string;
  listing_title?: string;
  unread_count?: number;
}

interface NotificationMenuProps {
  dark: boolean;
}

export function NotificationMenu({ dark }: NotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const lang = useLang();
  const { user } = useUser();

  // Load notifications and chats from API
  const loadNotifications = async () => {
    if (!user?.email) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      // Load both notifications and chats in parallel
      const [notificationsResponse, chatsResponse] = await Promise.all([
        fetch(`/api/notifications?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`)
      ]);

      const allItems: Notification[] = [];

      // Process system notifications
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json() as { success: boolean; notifications: any[] };
        if (notificationsData.success && notificationsData.notifications.length > 0) {
          const transformedNotifications: Notification[] = notificationsData.notifications.map(notification => ({
            id: notification.user_notification_id || notification.notification_id,
            type: 'system' as const,
            title: notification.title,
            message: notification.message,
            timestamp: notification.received_at * 1000, // Convert from seconds to milliseconds
            read: !!notification.read_at,
            actionUrl: notification.action_url || '/messages',
            icon: notification.icon,
            priority: notification.priority || 'normal'
          }));
          allItems.push(...transformedNotifications);
        }
      }

      // Process chat conversations
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json() as { success: boolean; chats: any[] };
        if (chatsData.success && chatsData.chats.length > 0) {
          const transformedChats: Notification[] = chatsData.chats.map(chat => ({
            id: chat.id,
            type: 'chat' as const,
            title: chat.listing_title || 'Chat',
            message: chat.last_message || 'No messages yet',
            timestamp: chat.last_message_time * 1000, // Convert from seconds to milliseconds
            read: chat.unread_count === 0,
            actionUrl: '/messages',
            icon: 'system' as const,
            other_user: chat.other_user,
            listing_title: chat.listing_title,
            unread_count: chat.unread_count
          }));
          allItems.push(...transformedChats);
        }
      }

      // Sort by timestamp (newest first) and set state
      allItems.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(allItems);

      // Calculate unread count
      const unread = allItems.filter(item => 
        item.type === 'system' ? !item.read : (item.unread_count || 0) > 0
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error loading notifications and chats:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.email]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefresh = () => {
      loadNotifications();
    };

    const handleStateChange = (event: CustomEvent) => {
      // Reload notifications when state changes in other components
      loadNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    window.addEventListener('notificationStateChanged', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefresh);
      window.removeEventListener('notificationStateChanged', handleStateChange as EventListener);
    };
  }, [user?.email]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setUnreadCount(unreadCount);
  }, [notifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    // Find the notification to check its type
    const notification = notifications.find(n => n.id === notificationId);
    
    // Only mark system notifications as read via API
    if (notification && notification.type !== 'chat') {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: notificationId,
            action: 'mark_read'
          })
        });

        if (response.ok) {
          // Update local state after successful server update
          setNotifications(prev => {
            const updated = prev.map(n => 
              n.id === notificationId ? { ...n, read: true } : n
            );
            return updated;
          });
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('notificationStateChanged', {
            detail: { action: 'mark_read', notificationId }
          }));
        } else {
          console.error('Failed to mark notification as read');
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    } else {
      // For chat conversations, just update local state (they're marked as read when viewed)
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        return updated;
      });
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('notificationStateChanged', {
        detail: { action: 'mark_read', notificationId }
      }));
    }
  };

  const markAllAsRead = async () => {
    // Mark all as read on server first
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      });

      if (response.ok) {
        // Update local state after successful server update
        setNotifications(prev => {
          const updated = prev.map(n => ({ ...n, read: true }));
          return updated;
        });
        setUnreadCount(0);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('notificationStateChanged', {
          detail: { action: 'mark_all_read' }
        }));
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const icon = notification.icon || 'system';
    const type = notification.type;
    
    // Use specific icon if provided, otherwise fall back to type-based icons
    if (icon === 'info') {
      return (
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else if (icon === 'success') {
      return (
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else if (icon === 'warning') {
      return (
        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      );
    } else if (icon === 'error') {
      return (
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else {
      // Default system icon
      return (
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-2 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center"
        aria-label="Messages"
      >
        <svg 
          className={cn(
            "w-6 h-6 transition-all duration-300",
            unreadCount > 0 
              ? "text-orange-500" 
              : "text-neutral-600 dark:text-neutral-400"
          )} 
          fill="currentColor" 
          viewBox="0 0 1792 1792"
        >
          <defs>
            {unreadCount > 0 && (
              <linearGradient id="envelopeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316">
                  <animate attributeName="offset" values="-1;2" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ef4444">
                  <animate attributeName="offset" values="-0.5;2.5" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#f97316">
                  <animate attributeName="offset" values="0;3" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            )}
          </defs>
          <path 
            d="M1792 710v794q0 66-47 113t-113 47h-1472q-66 0-113-47t-47-113v-794q44 49 101 87 362 246 497 345 57 42 92.5 65.5t94.5 48 110 24.5h2q51 0 110-24.5t94.5-48 92.5-65.5q170-123 498-345 57-39 100-87zm0-294q0 79-49 151t-122 123q-376 261-468 325-10 7-42.5 30.5t-54 38-52 32.5-57.5 27-50 9h-2q-23 0-50-9t-57.5-27-52-32.5-54-38-42.5-30.5q-91-64-262-182.5t-205-142.5q-62-42-117-115.5t-55-136.5q0-78 41.5-130t118.5-52h1472q65 0 112.5 47t47.5 113z"
            fill={unreadCount > 0 ? "url(#envelopeGradient)" : "currentColor"}
          />
        </svg>
        
        {/* Small red circle indicator when there are notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 rounded-full h-2 w-2 flex items-center justify-center animate-pulse ring-1 ring-white">
            {/* No number, just the red circle */}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('messages', lang)}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
              >
                {t('mark_all_as_read', lang)}
              </button>
            )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-neutral-500 dark:text-neutral-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400">{t('no_messages', lang)}</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 cursor-pointer ${
                      !notification.read ? (() => {
                        if (notification.type === 'chat') {
                          return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/50 dark:to-blue-700/60 border-l-4 border-blue-500';
                        } else {
                          const priority = notification.priority || 'normal';
                          switch (priority) {
                            case 'urgent':
                              return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800/50 dark:to-red-700/60 border-l-4 border-red-500';
                            case 'high':
                              return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800/50 dark:to-orange-700/60 border-l-4 border-orange-500';
                            case 'normal':
                              return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/50 dark:to-blue-700/60 border-l-4 border-blue-500';
                            case 'low':
                              return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/60 border-l-4 border-gray-500';
                            default:
                              return 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-800/50 dark:to-violet-700/60 border-l-4 border-purple-500';
                          }
                        }
                      })() : ''
                    }`}
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {notification.type === 'chat' ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      ) : (
                        getNotificationIcon(notification)
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-neutral-900 dark:text-white' 
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {notification.type === 'chat' 
                              ? `${notification.other_user} - ${notification.listing_title}`
                              : notification.title
                            }
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                          {(() => {
                            // Strip Markdown formatting for header display
                            let text = notification.message || '';
                            text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
                            text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
                            text = text.replace(/`([^`]+)`/g, '$1'); // Remove code markers
                            text = text.replace(/^#+\s*/gm, ''); // Remove heading markers
                            text = text.replace(/^>\s*/gm, ''); // Remove quote markers
                            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // Remove link markers, keep text
                            return text;
                          })()}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
            <a
              href="/messages"
              className="block text-center text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
            >
              View all messages
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
