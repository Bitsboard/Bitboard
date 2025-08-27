"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Session } from "@/lib/types";

interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: number;
  last_message_at: number;
  listing_title: string;
  listing_price: number;
  listing_image: string;
  listing_created_at: number;
  buyer_username: string;
  seller_username: string;
  messageCount: number;
  latestMessage: {
    id: string;
    from_id: string;
    text: string;
    created_at: number;
  } | null;
}

export default function AdminChatsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const router = useRouter();
  const lang = useLang();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json() as { session?: Session | null };
          const userSession = data?.session;
          if (userSession) {
            setSession(userSession);

            if (userSession.user?.email) {
              // Check if user is admin
              const adminResponse = await fetch('/api/admin/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userSession.user.email })
              });

              if (adminResponse.ok) {
                const adminData = await adminResponse.json() as { isAdmin: boolean };
                setIsAdmin(adminData.isAdmin);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/');
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (!loading && session && !isAdmin) {
      router.push('/');
    }
  }, [loading, session, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadChats();
    }
  }, [isAdmin]);

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      const response = await fetch('/api/admin/chats');
      if (response.ok) {
        const data = await response.json() as { chats: Chat[] };
        setChats(data.chats || []);
      } else {
        console.error('Failed to load chats');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatPrice = (sats: number) => {
    return new Intl.NumberFormat().format(sats);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                Chat Management
              </h1>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Monitor and manage user conversations across the platform
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{chats.length}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Chats</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {chats.reduce((sum, chat) => sum + chat.messageCount, 0)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Messages</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {chats.filter(chat => chat.latestMessage).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Chats</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {chats.filter(chat => !chat.latestMessage).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Empty Chats</div>
            </div>
          </div>

          {/* Chats List */}
          <div className={cn(
            "rounded-2xl border",
            "bg-white dark:bg-neutral-900",
            "border-neutral-200 dark:border-neutral-800"
          )}>
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">All Conversations</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Click on a chat to view details and messages
              </p>
            </div>

            {chatsLoading ? (
              <div className="p-8 text-center">
                <div className="text-neutral-600 dark:text-neutral-400">Loading chats...</div>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-neutral-600 dark:text-neutral-400">No chats found</div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Implement chat detail view
                      console.log('Viewing chat:', chat.id);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Listing Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={chat.listing_image || `/placeholder-Electronics.png`}
                          alt={chat.listing_title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                            {chat.listing_title}
                          </h3>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formatPrice(chat.listing_price)} sats
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          <span>👤 {chat.buyer_username || chat.buyer_id}</span>
                          <span>💬 {chat.seller_username || chat.seller_id}</span>
                          <span>📅 {formatTime(chat.created_at)}</span>
                        </div>

                        {chat.latestMessage ? (
                          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                            <div className="text-sm text-neutral-900 dark:text-white mb-1">
                              Latest message from {chat.latestMessage.from_id === chat.buyer_id ? chat.buyer_username || chat.buyer_id : chat.seller_username || chat.seller_id}:
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              "{chat.latestMessage.text}"
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              {formatTime(chat.latestMessage.created_at)} • {chat.messageCount} messages
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-500 italic">
                            No messages yet
                          </div>
                        )}
                      </div>

                      {/* Status Indicators */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          chat.latestMessage 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}>
                          {chat.latestMessage ? 'Active' : 'Empty'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          ID: {chat.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
