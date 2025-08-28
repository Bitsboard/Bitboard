"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface Chat {
  id: string;
  listing_title: string;
  other_user: string;
  last_message: string;
  last_message_time: number;
  unread_count: number;
  listing_id: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'system' | 'listing' | 'chat';
}

interface Message {
  id: string;
  content: string;
  timestamp: number;
  is_from_current_user: boolean;
  sender_name: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { isDark: dark } = useTheme();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'notifications'>('chats');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp: number) => {
    // Convert to milliseconds if timestamp is in seconds (Unix timestamp)
    const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    const now = Date.now();
    const diff = now - timestampMs;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestampMs).toLocaleDateString();
  };

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/list');
      if (response.ok) {
        const data = await response.json() as { chats: any[] };
        const transformedChats = data.chats.map((chat: any) => ({
          id: chat.chat_id,
          listing_title: chat.listing_title,
          other_user: chat.other_user,
          last_message: chat.last_message,
          last_message_time: chat.last_message_time,
          unread_count: chat.unread_count || 0,
          listing_id: chat.listing_id
        }));
        setChats(transformedChats);
        
        // Auto-select the most recent chat
        if (transformedChats.length > 0 && !selectedChat) {
          setSelectedChat(transformedChats[0].id);
          loadMessages(transformedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (response.ok) {
        const data = await response.json() as { messages: any[]; current_user_id: string };
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          is_from_current_user: msg.from_id === data.current_user_id,
          sender_name: msg.sender_name
        }));
        setMessages(transformedMessages);
        setSelectedChat(chatId);
        setSelectedNotification(null);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChat,
          content: newMessage.trim()
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        // Reload messages to show the new one
        await loadMessages(selectedChat);
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

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const combinedItems = [
    ...chats.map(chat => ({ ...chat, type: 'chat' as const })),
    ...notifications.map(notif => ({ ...notif, type: 'notification' as const }))
  ];

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col overflow-hidden">
      {/* Main Container - Fixed Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversations & Notifications */}
        <div className="w-80 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col rounded-r-3xl shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 flex-shrink-0 rounded-tr-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">
                Messages & Notifications
              </h1>
              <button
                onClick={loadChats}
                disabled={isLoading}
                className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Tab Toggle */}
            <div className="flex bg-white/20 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'chats'
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Chats ({chats.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'notifications'
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Notifications ({notifications.length})
              </button>
            </div>
          </div>
          
          {/* Content List */}
          <div className="flex-1 overflow-y-auto rounded-br-3xl p-3">
            {isLoading ? (
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
                  {activeTab === 'chats' ? 'No conversations yet' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {combinedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'chat') {
                        loadMessages(item.id);
                      } else {
                        setSelectedNotification(item.id);
                        setSelectedChat(null);
                      }
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      (item.type === 'chat' && selectedChat === item.id) ||
                      (item.type === 'notification' && selectedNotification === item.id)
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg ring-2 ring-orange-300'
                        : 'bg-white/60 dark:bg-neutral-800/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 border border-neutral-200/50 dark:border-neutral-700/50'
                    }`}
                  >
                    {item.type === 'chat' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm truncate">
                            {item.listing_title}
                          </h3>
                          <span className="text-xs opacity-80">
                            {formatTimestamp(item.last_message_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs opacity-80 truncate">
                            {item.other_user}
                          </p>
                          {item.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                              {item.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-70 truncate">
                          {item.last_message}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm truncate">
                            {item.title}
                          </h3>
                          <span className="text-xs opacity-80">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs opacity-70 truncate">
                          {item.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Messages */}
        <div className="flex-1 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-sm flex flex-col rounded-l-3xl shadow-xl">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0 rounded-tl-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {chats.find(c => c.id === selectedChat)?.listing_title}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Chat with {chats.find(c => c.id === selectedChat)?.other_user}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_current_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        message.is_from_current_user
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.is_from_current_user ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-800/50 rounded-bl-3xl">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
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
              {/* Notification View */}
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {notifications.find(n => n.id === selectedNotification)?.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    {notifications.find(n => n.id === selectedNotification)?.message}
                  </p>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Select a conversation
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Choose a chat from the left panel to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
