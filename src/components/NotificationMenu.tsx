"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

interface Notification {
  id: string;
  type: 'message' | 'update' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

interface NotificationMenuProps {
  dark: boolean;
}

export function NotificationMenu({ dark }: NotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const lang = useLang();

  // Mock notifications - in a real app, these would come from an API
  useEffect(() => {
    // Try to load notifications from localStorage first
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
        return;
      }
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
    }

    // Fallback to welcome notification for fresh accounts
    const mockNotifications: Notification[] = [
      {
        id: 'welcome',
        type: 'system',
        title: 'Welcome to bitsbarter!',
        message: 'Welcome to the Bitcoin trading platform. Check out our safety guidelines to get started.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        read: false,
        actionUrl: '/notifications'
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
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
    // Update unread count based on the new state
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      return newCount;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      // Persist to localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save notifications to localStorage:', error);
      }
      return updated;
    });
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
        aria-label="Notifications"
      >
                        <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('notifications', lang)}
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
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400">{t('no_notifications', lang)}</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
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
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-neutral-900 dark:text-white' 
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                          {notification.message}
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
              href="/notifications"
              className="block text-center text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
            >
              {t('view_all_notifications', lang)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
