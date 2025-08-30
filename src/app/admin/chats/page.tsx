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
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastMessage' | 'messageCount'>('lastMessage');
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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.listing_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.buyer_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.seller_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
      matchesStatus = chat.last_message_at >= oneDayAgo;
    } else if (statusFilter === 'recent') {
      const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      matchesStatus = chat.last_message_at >= oneWeekAgo;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt': aValue = a.created_at; bValue = b.created_at; break;
      case 'lastMessage': aValue = a.last_message_at; bValue = b.last_message_at; break;
      case 'messageCount': aValue = a.messageCount; bValue = b.messageCount; break;
      default: aValue = a.last_message_at; bValue = b.last_message_at;
    }
    
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const paginatedChats = sortedChats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
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

  const formatSats = (n: number) => new Intl.NumberFormat(undefined).format(n);

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Compact Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Chats Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total: {chats.length} | Active Today: {chats.filter(c => {
                  const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
                  return c.last_message_at >= oneDayAgo;
                }).length}
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
                      Date
                      {sortBy === 'createdAt' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Listing Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Lister</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Replier</th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('messageCount')}
                  >
                    <div className="flex items-center gap-1">
                      # Messages
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
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
                        <button
                          onClick={() => router.push(`/admin/listings?search=${chat.listing_title}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {chat.listing_title}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => router.push(`/admin/users?search=${chat.seller_username || chat.seller_id}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {chat.seller_username || chat.seller_id.slice(0, 8) + '...'}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => router.push(`/admin/users?search=${chat.buyer_username || chat.buyer_id}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {chat.buyer_username || chat.buyer_id.slice(0, 8) + '...'}
                        </button>
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
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Conversation
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

      {/* Minimal and Condensed Chat Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    Chat: {selectedChat.listing_title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {selectedChat.buyer_username || selectedChat.buyer_id.slice(0, 8)} ↔ {selectedChat.seller_username || selectedChat.seller_id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96">
              {messagesLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                  No messages found
                </div>
              ) : (
                chatMessages.map((message) => {
                  const isFromBuyer = message.from_id === selectedChat.buyer_id;
                  const username = isFromBuyer ? selectedChat.buyer_username : selectedChat.seller_username;
                  const userId = isFromBuyer ? selectedChat.buyer_id : selectedChat.seller_id;
                  
                  return (
                    <div key={message.id} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${isFromBuyer ? 'text-blue-600' : 'text-green-600'}`}>
                          {username || userId.slice(0, 8) + '...'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(message.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isFromBuyer 
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200' 
                          : 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>{chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}</span>
                <span>Created: {formatDate(selectedChat.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
