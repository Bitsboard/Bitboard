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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastMessage' | 'messageCount' | 'listingPrice'>('lastMessage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  const formatRelativeTime = (timestamp: number) => {
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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.listing_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.buyer_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.seller_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    switch (statusFilter) {
      case 'active': 
        matchesStatus = chat.last_message_at > Math.floor(Date.now() / 1000) - 86400; // Last 24 hours
        break;
      case 'recent': 
        matchesStatus = chat.last_message_at > Math.floor(Date.now() / 1000) - 604800; // Last week
        break;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = a.created_at;
        bValue = b.created_at;
        break;
      case 'lastMessage':
        aValue = a.last_message_at;
        bValue = b.last_message_at;
        break;
      case 'messageCount':
        aValue = a.messageCount;
        bValue = b.messageCount;
        break;
      case 'listingPrice':
        aValue = a.listing_price;
        bValue = b.listing_price;
        break;
      default:
        aValue = a.last_message_at;
        bValue = b.last_message_at;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Chat Management</h1>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">Monitor all chat conversations across the platform</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                ← Back to Admin
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">{chats.length}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Chats</div>
            </div>
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {chats.reduce((sum, chat) => sum + chat.messageCount, 0)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Messages</div>
            </div>
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 86400).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Today</div>
            </div>
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-xl">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 604800).length}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active This Week</div>
            </div>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 mb-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Search Chats
                </label>
                <input
                  type="text"
                  placeholder="Search listings, buyers, or sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
                >
                  <option value="all">All Chats</option>
                  <option value="active">Active Today</option>
                  <option value="recent">Recent Week</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy as any);
                    setSortOrder(newSortOrder as any);
                  }}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
                >
                  <option value="lastMessage-desc">Latest Message</option>
                  <option value="lastMessage-asc">Oldest Message</option>
                  <option value="createdAt-desc">Newest Chat</option>
                  <option value="createdAt-asc">Oldest Chat</option>
                  <option value="messageCount-desc">Most Messages</option>
                  <option value="listingPrice-desc">Highest Price</option>
                  <option value="listingPrice-asc">Lowest Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat List */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        All Chat Conversations
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Click on a chat to view details and messages
                      </p>
                    </div>
                    <button
                      onClick={loadChats}
                      disabled={chatsLoading}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md disabled:opacity-50"
                    >
                      {chatsLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>
                
                {chatsLoading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">Loading chats...</p>
                  </div>
                ) : sortedChats.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-neutral-500 dark:text-neutral-400 text-lg">No chats found</div>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200/50 dark:divide-neutral-700/50">
                    {sortedChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setSelectedChat(chat);
                          loadChatMessages(chat.id);
                        }}
                        className={cn(
                          "p-6 cursor-pointer transition-all duration-200 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50",
                          selectedChat?.id === chat.id && "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-r-4 border-orange-500"
                        )}
                      >
                        {/* Chat Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-neutral-900 dark:text-white text-lg mb-2">
                              {chat.listing_title}
                            </h3>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-3">
                              {formatSats(chat.listing_price)} sats
                            </div>
                          </div>
                          <div className="text-right text-sm text-neutral-500 space-y-1">
                            <div>📅 Created: {formatDate(chat.created_at)}</div>
                            <div>📍 Last: {formatRelativeTime(chat.last_message_at)}</div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-6 mb-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {chat.buyer_username?.charAt(0).toUpperCase() || 'B'}
                            </div>
                            <div>
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">👤 Buyer:</span>
                              <span className="font-medium ml-2">{chat.buyer_username || chat.buyer_id.slice(0, 8)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {chat.seller_username?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div>
                              <span className="text-green-600 dark:text-green-400 font-semibold">💬 Seller:</span>
                              <span className="font-medium ml-2">{chat.seller_username || chat.seller_id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Latest Message Preview */}
                        {chat.latestMessage && (
                          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-600">
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                              <span className="font-bold">
                                {chat.latestMessage.from_id === chat.buyer_id ? '👤 Buyer' : '💬 Seller'}:
                              </span>
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                              {chat.latestMessage.text}
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500">
                              <span>📨 {chat.messageCount} messages</span>
                              <span>⏰ {formatRelativeTime(chat.latestMessage.created_at)}</span>
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
                <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden sticky top-8 shadow-xl">
                  <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                      💬 Chat Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                        <div className="font-semibold text-neutral-900 dark:text-white mb-2">📋 Listing</div>
                        <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.listing_title}</div>
                        <div className="text-green-600 dark:text-green-400 font-bold">{formatSats(selectedChat.listing_price)} sats</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="font-semibold text-neutral-900 dark:text-white mb-2">👤 Buyer</div>
                        <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.buyer_username || selectedChat.buyer_id.slice(0, 8)}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="font-semibold text-neutral-900 dark:text-white mb-2">💬 Seller</div>
                        <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.seller_username || selectedChat.seller_id.slice(0, 8)}</div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
                        <div className="font-semibold text-neutral-900 dark:text-white mb-2">📊 Stats</div>
                        <div className="text-neutral-600 dark:text-neutral-400 space-y-1">
                          <div>📅 Created: {formatDate(selectedChat.created_at)}</div>
                          <div>📍 Last Activity: {formatDate(selectedChat.last_message_at)}</div>
                          <div>📨 Total Messages: {selectedChat.messageCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="font-bold text-neutral-900 dark:text-white mb-4">📝 Messages</h4>
                    
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <div className="text-neutral-600 dark:text-neutral-400">Loading messages...</div>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-neutral-500 dark:text-neutral-400">No messages found</div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "p-3 rounded-xl border-l-4",
                              message.from_id === selectedChat.buyer_id
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                                : "bg-green-50 dark:bg-green-900/20 border-green-500"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn(
                                "text-xs font-bold px-2 py-1 rounded-full",
                                message.from_id === selectedChat.buyer_id
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                              )}>
                                {message.from_id === selectedChat.buyer_id ? '👤 Buyer' : '💬 Seller'}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {formatRelativeTime(message.created_at)}
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
                <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-8 text-center shadow-xl">
                  <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
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
