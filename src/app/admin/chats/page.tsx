"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const router = useRouter();
  const lang = useLang();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadChats();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simple password check - same as main admin page
      if (password === "admin123") {
        setIsAuthenticated(true);
        setPassword("");
        // Save authentication state to localStorage
        localStorage.setItem('admin_authenticated', 'true');
        // Load chats immediately after login
        loadChats();
      } else {
        setError("Incorrect password");
      }
    } catch (error) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setChats([]);
    setSelectedChat(null);
    setChatMessages([]);
  };

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      const response = await fetch('/api/admin/chats');
      if (response.ok) {
        const data = await response.json() as { chats: Chat[] };
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      // For admin, we'll use a special endpoint that doesn't require user email
      const response = await fetch(`/api/admin/chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json() as { messages: any[] };
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(sats);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Admin Access
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Enter password to access chat management
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500",
                  "bg-white dark:bg-neutral-900",
                  "border-neutral-300 dark:border-neutral-700",
                  "text-neutral-900 dark:text-white",
                  "placeholder-neutral-500 dark:placeholder-neutral-400"
                )}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className={cn(
                "w-full py-3 rounded-xl font-semibold transition-all duration-200",
                password.trim() && !loading
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              )}
            >
              {loading ? "Checking..." : "Access Admin"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/admin')}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              ← Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Chat Management
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Monitor all chat conversations across the platform
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadChats}
                disabled={chatsLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {chatsLoading ? 'Refreshing...' : 'Refresh Chats'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Overview */}
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
                {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 86400).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Today</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 604800).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active This Week</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat List */}
            <div className="lg:col-span-2">
              <div className={cn(
                "rounded-2xl border overflow-hidden",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    All Chat Conversations
                  </h2>
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
                        onClick={() => {
                          setSelectedChat(chat);
                          loadChatMessages(chat.id);
                        }}
                        className={cn(
                          "p-6 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                          selectedChat?.id === chat.id && "bg-orange-50 dark:bg-orange-900/20 border-r-4 border-orange-500"
                        )}
                      >
                        {/* Chat Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                              {chat.listing_title}
                            </h3>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                              {formatSats(chat.listing_price)} sats
                            </div>
                          </div>
                          <div className="text-right text-sm text-neutral-500">
                            <div>Created: {formatDate(chat.created_at)}</div>
                            <div>Last: {formatDate(chat.last_message_at)}</div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">👤 Buyer:</span>
                            <span className="font-medium">{chat.buyer_username || chat.buyer_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 dark:text-green-400">💬 Seller:</span>
                            <span className="font-medium">{chat.seller_username || chat.seller_id}</span>
                          </div>
                        </div>

                        {/* Latest Message Preview */}
                        {chat.latestMessage && (
                          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                              <span className="font-medium">
                                {chat.latestMessage.from_id === chat.buyer_id ? 'Buyer' : 'Seller'}:
                              </span>
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                              {chat.latestMessage.text}
                            </div>
                            <div className="text-xs text-neutral-500 mt-2">
                              {formatDate(chat.latestMessage.created_at)} • {chat.messageCount} messages
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Details & Messages */}
            <div className="lg:col-span-1">
              {selectedChat ? (
                <div className={cn(
                  "rounded-2xl border overflow-hidden sticky top-8",
                  "bg-white dark:bg-neutral-900",
                  "border-neutral-200 dark:border-neutral-800"
                )}>
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                      Chat Details
                    </h3>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <div><strong>Listing:</strong> {selectedChat.listing_title}</div>
                      <div><strong>Price:</strong> {formatSats(selectedChat.listing_price)} sats</div>
                      <div><strong>Buyer:</strong> {selectedChat.buyer_username || selectedChat.buyer_id}</div>
                      <div><strong>Seller:</strong> {selectedChat.seller_username || selectedChat.seller_id}</div>
                      <div><strong>Created:</strong> {formatDate(selectedChat.created_at)}</div>
                      <div><strong>Last Activity:</strong> {formatDate(selectedChat.last_message_at)}</div>
                      <div><strong>Total Messages:</strong> {selectedChat.messageCount}</div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Messages</h4>
                    
                    {messagesLoading ? (
                      <div className="text-center py-4">
                        <div className="text-neutral-600 dark:text-neutral-400">Loading messages...</div>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-neutral-600 dark:text-neutral-400">No messages found</div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "p-3 rounded-lg",
                              message.from_id === selectedChat.buyer_id
                                ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                                : "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                "text-xs font-medium",
                                message.from_id === selectedChat.buyer_id
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-green-600 dark:text-green-400"
                              )}>
                                {message.from_id === selectedChat.buyer_id ? 'Buyer' : 'Seller'}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300">
                              {message.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "rounded-2xl border p-8 text-center",
                  "bg-white dark:bg-neutral-900",
                  "border-neutral-200 dark:border-neutral-800"
                )}>
                  <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Select a Chat
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Click on any chat from the list to view its details and messages
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
