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
      if (password === "admin123") {
        setIsAuthenticated(true);
        setPassword("");
        localStorage.setItem('admin_authenticated', 'true');
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

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();
  const formatSats = (sats: number) => new Intl.NumberFormat().format(sats);
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
        matchesStatus = chat.last_message_at > Math.floor(Date.now() / 1000) - 86400;
        break;
      case 'recent': 
        matchesStatus = chat.last_message_at > Math.floor(Date.now() / 1000) - 604800;
        break;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt': aValue = a.created_at; bValue = b.created_at; break;
      case 'lastMessage': aValue = a.last_message_at; bValue = b.last_message_at; break;
      case 'messageCount': aValue = a.messageCount; bValue = b.messageCount; break;
      case 'listingPrice': aValue = a.listing_price; bValue = b.listing_price; break;
      default: aValue = a.last_message_at; bValue = b.last_message_at;
    }
    
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Admin Access</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Enter password to access chat management</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* Compact Header */}
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Chat Management</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Chats: {chats.length} | Messages: {chats.reduce((sum, chat) => sum + chat.messageCount, 0)} | Active Today: {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 86400).length}</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
              >
                ← Admin
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Compact Filters */}
          <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-3 mb-4">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
              >
                <option value="all">All Chats</option>
                <option value="active">Active Today</option>
                <option value="recent">Recent Week</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
              >
                <option value="lastMessage-desc">Latest Message</option>
                <option value="lastMessage-asc">Oldest Message</option>
                <option value="createdAt-desc">Newest Chat</option>
                <option value="messageCount-desc">Most Messages</option>
                <option value="listingPrice-desc">Highest Price</option>
              </select>
              <button
                onClick={loadChats}
                disabled={chatsLoading}
                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {chatsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">All Chat Conversations</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Click on a chat to view details and messages</p>
                </div>
                
                {chatsLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-neutral-600 dark:text-neutral-400">Loading chats...</p>
                  </div>
                ) : sortedChats.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500 dark:text-neutral-400">No chats found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {sortedChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setSelectedChat(chat);
                          loadChatMessages(chat.id);
                        }}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-700",
                          selectedChat?.id === chat.id && "bg-orange-50 dark:bg-orange-900/20 border-r-4 border-orange-500"
                        )}
                      >
                        {/* Chat Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{chat.listing_title}</h3>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">{formatSats(chat.listing_price)} sats</div>
                          </div>
                          <div className="text-right text-xs text-neutral-500 space-y-1">
                            <div>Created: {formatDate(chat.created_at)}</div>
                            <div>Last: {formatRelativeTime(chat.last_message_at)}</div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Buyer:</span>
                            <span>{chat.buyer_username || chat.buyer_id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 dark:text-green-400 font-medium">Seller:</span>
                            <span>{chat.seller_username || chat.seller_id.slice(0, 8)}</span>
                          </div>
                        </div>

                        {/* Latest Message Preview */}
                        {chat.latestMessage && (
                          <div className="bg-neutral-50 dark:bg-neutral-800 rounded p-2 border border-neutral-200 dark:border-neutral-600">
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                              <span className="font-medium">
                                {chat.latestMessage.from_id === chat.buyer_id ? 'Buyer' : 'Seller'}:
                              </span>
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-1">
                              {chat.latestMessage.text}
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500">
                              <span>{chat.messageCount} messages</span>
                              <span>{formatRelativeTime(chat.latestMessage.created_at)}</span>
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
                <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden sticky top-8">
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Chat Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="bg-neutral-50 dark:bg-neutral-700 rounded p-2">
                        <div className="font-medium mb-1">Listing</div>
                        <div className="text-neutral-600">{selectedChat.listing_title}</div>
                        <div className="text-green-600 font-bold">{formatSats(selectedChat.listing_price)} sats</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                        <div className="font-medium mb-1">Buyer</div>
                        <div className="text-neutral-600">{selectedChat.buyer_username || selectedChat.buyer_id.slice(0, 8)}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                        <div className="font-medium mb-1">Seller</div>
                        <div className="text-neutral-600">{selectedChat.seller_username || selectedChat.seller_id.slice(0, 8)}</div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-700 rounded p-2">
                        <div className="font-medium mb-1">Stats</div>
                        <div className="text-neutral-600 space-y-1">
                          <div>Created: {formatDate(selectedChat.created_at)}</div>
                          <div>Last Activity: {formatDate(selectedChat.last_message_at)}</div>
                          <div>Total Messages: {selectedChat.messageCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Messages</h4>
                    
                    {messagesLoading ? (
                      <div className="text-center py-4">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-neutral-600 dark:text-neutral-400">Loading messages...</div>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-neutral-500 dark:text-neutral-400">No messages found</div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "p-2 rounded border-l-4",
                              message.from_id === selectedChat.buyer_id
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                                : "bg-green-50 dark:bg-green-900/20 border-green-500"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded",
                                message.from_id === selectedChat.buyer_id
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                              )}>
                                {message.from_id === selectedChat.buyer_id ? 'Buyer' : 'Seller'}
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
                <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                  <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Select a Chat</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Click on any chat from the list to view its details and messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
