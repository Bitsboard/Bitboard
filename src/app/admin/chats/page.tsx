"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ExternalLinkIcon from "@/components/ExternalLinkIcon";

interface Chat {
  id: string; // Now 10 alphanumeric characters
  listing_id: string; // Now 10 alphanumeric characters
  buyer_id: string; // Now 8 alphanumeric characters
  seller_id: string; // Now 8 alphanumeric characters
  created_at: number;
  last_message_at: number;
  listing_title?: string;
  buyer_username?: string;
  seller_username?: string;
  messageCount?: number; // Changed from message_count to match API response
}

interface Message {
  id: string; // Now 10 alphanumeric characters
  from_id: string; // Now 8 alphanumeric characters
  text: string;
  created_at: number;
  username?: string;
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
  const [itemsPerPage] = useState(20);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSearchingForChat, setIsSearchingForChat] = useState(false);
  
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

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [currentPage, isAuthenticated]);

  // Handle sorting changes
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1); // Reset to first page when sorting changes
      loadChats();
    }
  }, [sortBy, sortOrder]);

  // Check if we need to search for a specific chat (e.g., from activity feed or admin listings)
  useEffect(() => {
    if (!isAuthenticated || chats.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const chatIdParam = urlParams.get('chatId');
    
    if (searchParam || chatIdParam) {
      console.log('🔍 Chat admin: Found URL parameters - search:', searchParam, 'chatId:', chatIdParam);
      searchAndSelectChat(searchParam, chatIdParam);
    }
  }, [isAuthenticated, chats, searchTerm, statusFilter]);

  const searchAndSelectChat = async (searchTerm?: string | null, chatId?: string | null) => {
    if (!searchTerm && !chatId) return;
    
    setIsSearchingForChat(true);
    
    try {
      // First try to find by chat ID if provided - search entire database
      if (chatId) {
        const response = await fetch(`/api/admin/chats?limit=1000`);
        if (response.ok) {
          const data = await response.json() as { chats: Chat[]; total: number };
          if (data.chats) {
            const chat = data.chats.find(c => c.id === chatId);
            if (chat) {
              selectChat(chat);
              // Clear URL parameters
              window.history.pushState({}, '', '/admin/chats');
              return;
            }
          }
        }
      }
      
      // If no chat ID or not found, search by listing title in entire database
      if (searchTerm) {
        const response = await fetch(`/api/admin/chats?limit=1000`);
        if (response.ok) {
          const data = await response.json() as { chats: Chat[]; total: number };
          if (data.chats) {
            const chat = data.chats.find(c => 
              c.listing_title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (chat) {
              selectChat(chat);
              // Clear URL parameters
              window.history.pushState({}, '', '/admin/chats');
              return;
            }
          }
        }
      }
      
      // If still not found, try to search in all chats with a broader search
      if (searchTerm) {
        setSearchTerm(searchTerm);
        // The search will be applied when chats are filtered
      }
    } catch (error) {
      console.error('Error searching for chat:', error);
    } finally {
      setIsSearchingForChat(false);
    }
  };

  const loadChats = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading chats with limit:', itemsPerPage);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', offset.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/chats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json() as { chats: Chat[]; total: number; page: number; limit: number };
        console.log('🔍 Chats API response:', data);
        setChats(data.chats || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
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



  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
    loadChatMessages(chat.id);
  };

  // Remove client-side filtering and sorting since API handles it now
  // const filteredChats = chats.filter(chat => { ... });
  // const sortedChats = [...filteredChats].sort((a, b) => { ... });
  // const paginatedChats = sortedChats.slice(...);

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


      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Back to Dashboard Button and Filters Row */}
        <div className="flex gap-3 mb-3">
          {/* Back to Dashboard Button */}
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
          >
            ← Back to dashboard
          </button>

          {/* Condensed Filters */}
          <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-2 flex-1">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs"
              >
                <option value="all">All Chats</option>
                <option value="active">Active Today</option>
                <option value="recent">Recent Week</option>
              </select>
              <button
                onClick={loadChats}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Split Panel Layout */}
        <div className="flex gap-3">
          {/* Left Panel - Chats Table (70%) */}
          <div className="flex-[0.7]">
            {/* Enhanced Chats Table with Individual Stat Columns */}
            <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          
          
                    <div className="overflow-x-auto">
            <table className="w-full space-y-0 font-mono text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr className="h-6">
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
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
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Listing</th>
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Lister</th>
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Replier</th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('messageCount')}
                  >
                    <div className="flex items-center gap-1">
                      # Msgs
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
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
                </tr>
              </thead>
              <tbody className="space-y-0 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading chats...</p>
                    </td>
                  </tr>
                ) : chats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No chats found
                    </td>
                  </tr>
                ) : (
                  <>
                    {chats.map((chat) => (
                      <tr 
                        key={chat.id} 
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded px-1.5 -mx-1.5 transition-colors cursor-pointer ${
                          selectedChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 shadow-sm' : ''
                        }`}
                        onClick={() => selectChat(chat)}
                      >
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-600 dark:text-neutral-400">
                            {formatDate(chat.created_at)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/listings?title=${encodeURIComponent(chat.listing_title || '')}&id=${encodeURIComponent(chat.listing_id)}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors max-w-[200px]"
                          >
                            <span className="truncate">{chat.listing_title}</span>
                            <ExternalLinkIcon size="sm" className="flex-shrink-0" />
                          </button>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users?search=${chat.seller_username || chat.seller_id}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {chat.seller_username || chat.seller_id.slice(0, 8) + '...'}
                            <ExternalLinkIcon size="sm" />
                          </button>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users?search=${chat.buyer_username || chat.buyer_id}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {chat.buyer_username || chat.buyer_id.slice(0, 8) + '...'}
                            <ExternalLinkIcon size="sm" />
                          </button>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {chat.messageCount?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {formatRelativeTime(chat.last_message_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Fill remaining rows to maintain 20 row height */}
                    {Array.from({ length: Math.max(0, 20 - chats.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-6">
                        <td colSpan={6} className="px-1.5 py-0.5">
                          <div className="h-6"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination */}
          <div className="flex justify-between items-center py-2 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
            <div className="text-xs text-neutral-600">
              {chats.length} chats • Page {currentPage} of {totalPages}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            )}
          </div>
            </div>
          </div>

          {/* Right Panel - Conversation Preview (30%) */}
          <div className="flex-[0.3] min-w-0">
            <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[600px]">

              
              {selectedChat ? (
                <div className="p-2 flex flex-col h-full">
                  {/* Chat Header - Compact Layout */}
                  <div className="mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <button
                        onClick={() => router.push(`/admin/listings?title=${encodeURIComponent(selectedChat.listing_title || '')}&id=${encodeURIComponent(selectedChat.listing_id)}`)}
                        className="inline-flex items-center gap-1 px-1 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex-1 max-w-[180px]"
                      >
                        <span className="truncate text-xs">{selectedChat.listing_title}</span>
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </button>
                      <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                        {chatMessages.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-neutral-600 dark:text-neutral-400 truncate">
                          {selectedChat.seller_username || selectedChat.seller_id.slice(0, 8) + '...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-neutral-600 dark:text-neutral-400 truncate">
                          {selectedChat.buyer_username || selectedChat.buyer_id.slice(0, 8) + '...'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Messages - Condensed */}
                  <div className="space-y-2 flex-1 overflow-y-auto min-h-0 max-h-[400px] pr-2 py-1 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500">
                    {messagesLoading ? (
                      <div className="text-center py-3">
                        <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5"></div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-xs">Loading...</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                        No messages
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const isFromBuyer = message.from_id === selectedChat.buyer_id;
                        const username = isFromBuyer ? selectedChat.buyer_username : selectedChat.seller_username;
                        const userId = isFromBuyer ? selectedChat.buyer_id : selectedChat.seller_id;
                        
                        return (
                          <div key={message.id} className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-medium ${isFromBuyer ? 'text-blue-600' : 'text-green-600'}`}>
                                {username || userId.slice(0, 8) + '...'}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {new Date(message.created_at * 1000).toLocaleDateString()} {new Date(message.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div className={`max-w-full rounded px-1.5 py-1 text-xs ${
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

                  {/* Footer - Condensed */}
                  <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      Last: {formatRelativeTime(selectedChat.last_message_at)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center flex flex-col justify-center h-full">
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Select a chat to view conversation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
