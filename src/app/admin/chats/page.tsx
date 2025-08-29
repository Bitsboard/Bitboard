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
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastMessage' | 'messageCount' | 'listingPrice'>('lastMessage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(100);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  
  const router = useRouter();
  const lang = useLang();

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadChats();
    } else {
      router.push('/admin');
    }
  }, [router]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading chats with limit:', itemsPerPage);
      const response = await fetch(`/api/admin/chats?limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json() as { chats: Chat[] };
        console.log('🔍 Chats API response:', data);
        setChats(data.chats || []);
        setTotalPages(Math.ceil((data.chats?.length || 0) / itemsPerPage));
      } else {
        console.error('🔍 Chats API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
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

  const openChatModal = (chat: Chat) => {
    setSelectedChat(chat);
    setShowChatModal(true);
    loadChatMessages(chat.id);
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
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

  const paginatedChats = sortedChats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field as any);
      setSortOrder('asc');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking authentication...</p>
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total: {chats.length} | Messages: {chats.reduce((sum, chat) => sum + chat.messageCount, 0)} | 
                  Active Today: {chats.filter(chat => chat.last_message_at > Math.floor(Date.now() / 1000) - 86400).length}
                </p>
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
              <button
                onClick={loadChats}
                disabled={isLoading}
                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Enhanced Chats Table with Individual Stat Columns */}
          <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Table Summary */}
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Total Chats:</span> {chats.length} of {Math.ceil((chats.length / itemsPerPage) * itemsPerPage)} 
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Showing {itemsPerPage} chats per page
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-700">
                  <tr>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {sortBy === 'createdAt' && (
                          <span className="text-orange-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Listing</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Users</th>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                      onClick={() => handleSort('listingPrice')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortBy === 'listingPrice' && (
                          <span className="text-orange-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                      onClick={() => handleSort('messageCount')}
                    >
                      <div className="flex items-center gap-1">
                        Messages
                        {sortBy === 'messageCount' && (
                          <span className="text-orange-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                      onClick={() => handleSort('lastMessage')}
                    >
                      <div className="flex items-center gap-1">
                        Last Activity
                        {sortBy === 'lastMessage' && (
                          <span className="text-orange-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-neutral-600 dark:text-neutral-400">Loading chats...</p>
                      </td>
                    </tr>
                  ) : paginatedChats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                        No chats found
                      </td>
                    </tr>
                  ) : (
                    paginatedChats.map((chat) => (
                      <tr key={chat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <td className="px-3 py-2">
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {formatDate(chat.created_at)}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="max-w-xs">
                            <div className="font-medium text-neutral-900 dark:text-white text-sm">{chat.listing_title}</div>
                            <div className="text-xs text-neutral-500 font-mono">
                              ID: {chat.listing_id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Buyer:</span>
                              <span className="ml-1 text-neutral-900 dark:text-white">
                                {chat.buyer_username || chat.buyer_id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">Seller:</span>
                              <span className="ml-1 text-neutral-900 dark:text-white">
                                {chat.seller_username || chat.seller_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-bold text-green-600">
                            {formatSats(chat.listing_price)} sats
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-neutral-900 dark:text-white">
                            {chat.messageCount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-neutral-900 dark:text-white">
                            {formatRelativeTime(chat.last_message_at)}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => openChatModal(chat)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center py-3 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
                <div className="text-xs text-neutral-600">
                  Page {currentPage} of {totalPages} | {filteredChats.length} chats
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Modal */}
        {showChatModal && selectedChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Chat Details</h3>
                  <button
                    onClick={() => setShowChatModal(false)}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Chat Info */}
                  <div className="space-y-3">
                    <div className="bg-neutral-50 dark:bg-neutral-700 rounded p-3">
                      <div className="font-medium mb-2">Listing</div>
                      <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.listing_title}</div>
                      <div className="text-green-600 font-bold">{formatSats(selectedChat.listing_price)} sats</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                      <div className="font-medium mb-2">Buyer</div>
                      <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.buyer_username || selectedChat.buyer_id.slice(0, 8)}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                      <div className="font-medium mb-2">Seller</div>
                      <div className="text-neutral-600 dark:text-neutral-400">{selectedChat.seller_username || selectedChat.seller_id.slice(0, 8)}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="bg-neutral-50 dark:bg-neutral-700 rounded p-3">
                      <div className="font-medium mb-2">Stats</div>
                      <div className="text-neutral-600 dark:text-neutral-400 space-y-1">
                        <div>Created: {formatDate(selectedChat.created_at)}</div>
                        <div>Last Activity: {formatDate(selectedChat.last_message_at)}</div>
                        <div>Total Messages: {selectedChat.messageCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div>
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
                            "p-3 rounded border-l-4",
                            message.from_id === selectedChat.buyer_id
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                              : "bg-green-50 dark:bg-green-900/20 border-green-500"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
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
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
