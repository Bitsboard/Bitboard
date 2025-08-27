"use client";

import React, { useState, useEffect, useRef } from "react";
import { PriceBlock } from "./PriceBlock";
import { Modal } from "./Modal";
import { generateProfilePicture, getInitials, cn } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";
import Link from "next/link";

interface ChatModalProps {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number | null;
  unit: Unit;
  onBackToListing?: () => void;
  user?: { email: string; username?: string };
}

interface Message {
  id: string;
  from_id: string;
  text: string;
  created_at: number;
  read_at?: number;
}

interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: number;
  last_message_at: number;
}



export function ChatModal({ listing, onClose, dark, btcCad, unit, onBackToListing, user }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [sellerImageError, setSellerImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Ref for the chat container to enable auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat messages when component mounts
  useEffect(() => {
    if (user?.email) {
      loadChat();
    }
  }, [user?.email]);

  // Poll for new messages every 5 seconds if chat is active
  useEffect(() => {
    if (!chat?.id) return;
    
    const interval = setInterval(() => {
      loadMessages(chat.id);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [chat?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChat = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      
      // First, try to find existing chat
      const chatResponse = await fetch('/api/chat/list');
      if (chatResponse.ok) {
        const chatData = await chatResponse.json() as { chats?: any[] };
        const existingChat = chatData.chats?.find((c: any) => 
          c.listing_id === listing.id && 
          (c.buyer_id === user.email || c.seller_id === user.email)
        );
        
        if (existingChat) {
          setChat(existingChat);
          await loadMessages(existingChat.id);
          return;
        }
      }
      
      // No existing chat found, messages will be empty
      setMessages([]);
      setChat(null);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (response.ok) {
        const data = await response.json() as { messages?: Message[] };
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !user?.email || isSending) return;
    
    try {
      setIsSending(true);
      
              const messageData = {
          text: text.trim(),
          listingId: listing.id,
          otherUserId: listing.postedBy || listing.seller.name,
          ...(chat && { chatId: chat.id })
        };
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        const result = await response.json() as { messageId?: string; chatId?: string };
        
        // Add message to local state
        const newMessage: Message = {
          id: result.messageId || Math.random().toString(),
          from_id: user.email,
          text: text.trim(),
          created_at: Math.floor(Date.now() / 1000)
        };
        
        setMessages(prev => [...prev, newMessage]);
        setText("");
        
        // Update chat if this was a new chat
        if (!chat && result.chatId) {
          setChat({
            id: result.chatId,
            listing_id: listing.id,
            buyer_id: user.email,
            seller_id: listing.postedBy || listing.seller.name,
            created_at: Math.floor(Date.now() / 1000),
            last_message_at: Math.floor(Date.now() / 1000)
          });
        }
      } else {
        console.error('Failed to send message');
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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => message.from_id === user?.email;

  return (
    <Modal
      open={true}
      onClose={onClose}
      dark={dark}
      size="md"
      ariaLabel={`Chat about ${listing.title}`}
      panelClassName={cn("flex w-full flex-col h-[95vh]")}
      maxHeightVh={95}
    >
      {/* Header with listing details and back button */}
      <div className={cn("relative flex items-center justify-between border-b px-6 py-4", dark ? "border-neutral-900" : "border-neutral-200")}>
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button 
            onClick={onBackToListing || onClose}
            className={cn("flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:from-orange-600 hover:to-red-600")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {/* Listing title - now with truncation */}
          <h2 className={cn("text-lg font-semibold truncate max-w-sm", dark ? "text-white" : "text-neutral-900")}>
            {listing.title}
          </h2>
        </div>
        
        {/* Action buttons - positioned absolutely at the very top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Refresh button */}
          {chat?.id && (
            <button
              onClick={() => loadMessages(chat.id)}
              disabled={isLoading}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                dark 
                  ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" 
                  : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              title="Refresh messages"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
              dark 
                ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" 
                : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800"
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat content - now scrollable as one unit */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable chat container that includes listing info */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
        >
          {/* Listing details box - now mimics list-view card */}
          <div 
            className={cn(
              "m-4 p-4 rounded-xl border",
              dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
            )}
          >
            <div className="flex items-start gap-4">
              {/* Listing image */}
              <div className="flex-shrink-0">
                <img 
                  src={listing.images[0] || `/placeholder-${listing.category}.png`} 
                  alt={listing.title}
                  className="w-20 h-20 rounded-lg object-cover"
                  onError={() => setSellerImageError(true)}
                />
              </div>
              
              {/* Listing details */}
              <div className="flex-1 min-w-0">
                <h3 className={cn("text-lg font-semibold mb-2", dark ? "text-white" : "text-neutral-900")}>
                  {listing.title}
                </h3>
                <div className="mb-2">
                  <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="sm" />
                </div>
                <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                  📍 {listing.location}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                Loading chat...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center p-8">
              <div className={cn("text-center", dark ? "text-neutral-400" : "text-neutral-600")}>
                <div className="text-4xl mb-2">💬</div>
                <div className="text-sm">Start the conversation about this listing</div>
              </div>
            </div>
          ) : (
            <div className="px-4 space-y-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isMyMessage(message) ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                      isMyMessage(message)
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                        : dark
                        ? "bg-neutral-800 text-white"
                        : "bg-neutral-100 text-neutral-900"
                    )}
                  >
                    <div className="text-sm">{message.text}</div>
                    <div className={cn(
                      "text-xs mt-1",
                      isMyMessage(message) ? "text-orange-100" : "text-neutral-500"
                    )}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message input */}
        <div className={cn("border-t p-4", dark ? "border-neutral-800" : "border-neutral-200")}>
          <div className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={cn(
                "flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500",
                dark 
                  ? "bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400" 
                  : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500"
              )}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || isSending}
              className={cn(
                "px-6 py-2 rounded-xl font-medium transition-all duration-200",
                text.trim() && !isSending
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              )}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
