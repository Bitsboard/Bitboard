"use client";

import React, { useState, useEffect, useRef } from "react";
import { PriceBlock } from "./PriceBlock";
import { Modal } from "./Modal";
import OfferModal from "./OfferModal";
import OfferMessage from "./OfferMessage";
import { generateProfilePicture, getInitials, cn } from "@/lib/utils";
import type { Listing, Category, Unit, Seller, Message, Chat } from "@/lib/types";
import Link from "next/link";
import { useLang } from "@/lib/i18n-client";
import { PrimaryButton } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { useModalOrchestrator } from "./modal-orchestrator";

interface ChatModalProps {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number | null;
  unit: Unit;
  onBackToListing?: () => void;
  user?: { id: string; email: string; username?: string };
}

export function ChatModal({ listing, onClose, dark, btcCad, unit, onBackToListing, user }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const [sellerImageError, setSellerImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSearchingForChat, setIsSearchingForChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [existingOffer, setExistingOffer] = useState<any>(null);
  
  // Get orchestrator functions
  const { openOffer, isOfferOpen, isDesktop } = useModalOrchestrator();
  
  // Debug logging
  console.log('🎯 ChatModal: orchestrator state:', { isOfferOpen, isDesktop });
  

  
  const lang = useLang();
  
  // Ref for the chat container to enable auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // iMessage-style timestamp logic
  const shouldShowTimestamp = (currentMessage: any, previousMessage: any | null) => {
    if (!previousMessage) return true; // First message always shows timestamp
    
    const currentTime = currentMessage.created_at * 1000; // Convert to milliseconds
    const previousTime = previousMessage.created_at * 1000;
    const timeDiff = currentTime - previousTime;
    
    // Show timestamp if more than 5 minutes have passed
    const FIVE_MINUTES = 5 * 60 * 1000;
    return timeDiff > FIVE_MINUTES;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // If message is from today, show time only
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If message is from this week (within 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (messageDate.getTime() > weekAgo.getTime()) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    // For older messages, show full date and time
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Load chat messages when component mounts
  useEffect(() => {
    if (user?.email) {
      loadChat();
    }
  }, [user?.email, listing.id]); // Add listing.id as dependency to ensure reload when listing changes

  // Also load chat when the modal opens (additional safety)
  useEffect(() => {
    if (user?.email && listing.id) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        loadChat();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.email, listing.id]);

  // Poll for new messages every 30 seconds if chat is active (reduced from 5s for performance)
  useEffect(() => {
    if (!chat?.id) return;
    
    const interval = setInterval(() => {
      loadMessages(chat.id);
    }, 30000); // Changed from 5000 to 30000 (30 seconds)
    
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
      const chatResponse = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
      if (chatResponse.ok) {
        const chatData = await chatResponse.json() as { chats?: any[]; userId?: string };



        
        // Store the user ID for message identification
        if (chatData.userId) {
          setCurrentUserId(chatData.userId);
        }
        
        // Look for chat that matches this listing AND involves the current user
        const existingChat = chatData.chats?.find((c: any) => {

          
          
          
          
          // Check both listing ID and user involvement
          const listingMatches = c.listing?.id === listing.id;
          const userInvolved = c.buyer_id === chatData.userId || c.seller_id === chatData.userId;
          

  
  
  
          
          return listingMatches;
        });
        
        if (existingChat) {
          // Transform API response to match Chat type
          const transformedChat = {
            id: existingChat.id,
            listing_id: existingChat.listing?.id || '',
            buyer_id: '', // We don't have this info from the API
            seller_id: '', // We don't have this info from the API
            created_at: existingChat.createdAt / 1000, // Convert from milliseconds to seconds
            last_message_at: existingChat.lastMessageAt / 1000, // Convert from milliseconds to seconds
            messages: [] // Will be loaded separately
          };
          
          setChat(transformedChat);
          await loadMessages(existingChat.id);
          return;
        }
      }
      
      // No existing chat found, messages will be empty
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // Add timeout to prevent UI from getting stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message loading timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = fetch(`/api/chat/${chatId}?userEmail=${encodeURIComponent(user?.email || '')}`);
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; messages?: Message[]; userId?: string };

        
        if (data.success && data.messages) {
          setMessages(data.messages);
  
          
          // Store user ID if provided in the response
          if (data.userId && !currentUserId) {
            setCurrentUserId(data.userId);
          }
        } else {
          setMessages([]);
        }
      } else {
        console.error('🔍 ChatModal: Failed to load messages, status:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('🔍 ChatModal: Error loading messages:', error);
      setMessages([]);
    } finally {
      // Always clear loading state
      setIsLoading(false);

    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !user?.email || isSending) return;
    
    const messageText = text.trim();
    
    try {
      setIsSending(true);
      
      // Get the user ID from the chat API response
      let userId: string | undefined = user.id;
      if (!userId) {
        const chatResponse = await fetch(`/api/chat/list?userEmail=${encodeURIComponent(user.email)}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json() as { userId?: string };
          userId = chatData.userId;
        }
      }
      
      if (!userId) {
        console.error('Could not determine user ID');
        setIsSending(false);
        return;
      }
      
      // Create optimistic message that appears instantly
      // Use UTC timestamp to match server's strftime('%s','now')
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chat?.id || 'temp',
        from_id: userId,
        text: messageText,
        created_at: Math.floor(Date.now() / 1000) // This will be replaced by server timestamp
      };
      

      
      // Add message to UI immediately (optimistic update)
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input immediately for better UX
      setText('');
      
      // Send message to server in background
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageText,
          listingId: listing.id,
          otherUserId: listing.postedBy || listing.seller.name,
          chatId: chat?.id,
          userEmail: user.email
        })
      });
      
      if (response.ok) {
        const data = await response.json() as { messageId?: string; chatId?: string; message?: Message };
        
        if (data.message) {
          // Replace optimistic message with real one from server (includes correct timestamp)
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id ? data.message! : msg
          ));
        }
        
        // Update chat if this is a new chat
        if (data.chatId && !chat && userId) {
          setChat({
            id: data.chatId,
            listing_id: listing.id,
            buyer_id: userId,
            seller_id: listing.postedBy || listing.seller.name,
            created_at: Math.floor(Date.now() / 1000),
            last_message_at: Math.floor(Date.now() / 1000),
            messages: []
          });
        }
      } else {
        // If sending failed, remove optimistic message and show error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        // Restore the message text so user can try again
        setText(messageText);
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      
      // Restore the message text so user can try again
      setText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const sendOffer = async (amount: number, expiresAt: number) => {
    if (!user?.email) {
      return;
    }
    
    let chatId = chat?.id;
    
    // If no chat exists, we'll let the sendOffer API handle chat creation
    // The /api/offers/send endpoint will create a chat if needed

    try {
      const requestBody = {
        chatId: chatId,
        listingId: listing.id,
        amountSat: amount,
        expiresAt
      };
      
      const response = await fetch('/api/offers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json() as { success?: boolean; offerId?: string; message?: string; newChatId?: string };
        
        // Reload messages to show the new offer
        const chatIdToUse = responseData.newChatId || chatId;
        if (chatIdToUse) {
          await loadMessages(chatIdToUse);
        }
      } else {
        const error = await response.json() as { error?: string };
        console.error('🎯 ChatModal: Offer send failed:', response.status, error);
        alert(error.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('❌ ChatModal: Error sending offer:', error);
      alert('Failed to send offer');
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'decline' | 'revoke' | 'abort') => {
    try {
      const response = await fetch('/api/offers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          action
        })
      });

      if (response.ok) {
        // Reload messages to show the updated offer status
        await loadMessages(chat?.id || '');
      } else {
        const error = await response.json() as { error?: string };
        console.error('Failed to process offer action:', error);
        alert(error.error || 'Failed to process offer action');
      }
    } catch (error) {
      console.error('Error processing offer action:', error);
      alert('Failed to process offer action');
    }
  };

  // Auto-scroll to bottom when modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
          <PrimaryButton 
            onClick={onBackToListing || onClose}
            className="flex items-center gap-2 px-3 py-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </PrimaryButton>
          
          {/* Listing title - now with truncation */}
          <h2 className={cn("text-lg font-semibold truncate max-w-sm", dark ? "text-white" : "text-neutral-900")}>
            {listing.title}
          </h2>
        </div>
        
        {/* Close button - positioned absolutely at the very top right */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
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
              "m-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative",
              dark ? "bg-neutral-900 border-neutral-700 hover:border-orange-500/50" : "bg-neutral-100 border-neutral-200 hover:border-orange-500/50"
            )}
            onClick={() => {
              if (onBackToListing) {
                onBackToListing();
              } else {
                onClose();
              }
            }}
          >
            <div className="flex items-start gap-4">
              {/* Listing image - now even larger */}
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Listing details - reorganized for better hierarchy */}
              <div className="flex flex-col flex-1 min-h-0 justify-between h-32">
                {/* Top section: Type pill and Location */}
                <div className="flex items-center justify-between mb-3">
                  {/* Type pill */}
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold",
                    listing.type === 'sell' 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {listing.type === 'sell' ? 'Selling' : 'Looking for'}
                  </span>
                  
                  {/* Location pill - now more prominent */}
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5",
                    dark ? "bg-neutral-800 text-neutral-300 border border-neutral-700" : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  )}>
                    <span className="text-red-500">📍</span>
                    {listing.location}
                  </span>
                </div>
                
                {/* Middle section: Title and Price - now better balanced */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Title - now larger and more prominent */}
                  <h3 className={cn("font-bold text-base mb-3 leading-tight", dark ? "text-white" : "text-neutral-900")}>
                    {listing.title}
                  </h3>
                  
                  {/* Price - now more prominent with better spacing */}
                  <div className="mb-3">
                    <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="md" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom section: User info and reputation - now positioned at bottom right */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              {/* Username pill - now more compact */}
              <Link
                href={`/profile/${listing.seller.name}`}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer relative",
                  "bg-white/10 dark:bg-neutral-800/50 hover:bg-white/20 dark:hover:bg-neutral-700/50",
                  "border border-neutral-300/60 dark:border-neutral-700/50",
                  "hover:scale-105 hover:shadow-md"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(); // Close the modal when clicking username
                }}
              >
                {/* Profile Icon */}
                <div className="flex-shrink-0 -ml-1 mr-2">
                  {!sellerImageError ? (
                    <img
                      src={generateProfilePicture(listing.seller.name)}
                      alt={`${listing.seller.name}'s profile picture`}
                      className="w-4 h-4 rounded-full object-cover"
                      onError={() => setSellerImageError(true)}
                    />
                  ) : (
                    <Avatar size="sm">
                      {getInitials(listing.seller.name)}
                    </Avatar>
                  )}
                </div>
                
                {/* Username */}
                <span className={cn("text-xs", dark ? "text-white" : "text-neutral-700")}>{listing.seller.name}</span>
                
                {/* Verified badge */}
                {(listing.seller.verifications?.email || listing.seller.verifications?.phone || listing.seller.verifications?.lnurl) && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white font-bold shadow-md"
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                    }}
                    aria-label="Verified"
                    title="User has verified their identity"
                  >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </Link>
              
              {/* User reputation - now simple text without pill styling */}
              <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.thumbsUp} 👍</span>
            </div>
          </div>

          {showTips && (
            <div className="mx-4 rounded-xl p-3 text-xs bg-red-600 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="mr-2">Safety tips:</strong>
                  stay safe and meet in a very public place, like a mall, café, or a police e-commerce zone. Keep all chats in-app, and report any suspicious activity.{' '}
                  <Link 
                    href="/safety" 
                    className="underline hover:text-red-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more
                  </Link>
                </div>
                <button onClick={() => setShowTips(false)} className="rounded px-2 py-1 hover:bg-red-700 transition-colors">
                  Hide
                </button>
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center text-neutral-500 dark:text-neutral-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-neutral-500 dark:text-neutral-400">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((item, index) => {
                const isOptimistic = item.id.startsWith('temp-');
                const isOwnMessage = (item as any).is_from_current_user || item.from_id === currentUserId;
                const previousItem = index > 0 ? messages[index - 1] : null;
                const showTimestamp = shouldShowTimestamp(item, previousItem);
                
                return (
                  <div key={item.id}>
                    {/* Timestamp header - only show when needed */}
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          dark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-200 text-neutral-600"
                        )}>
                          {isOptimistic ? 'Sending...' : formatTimestamp(item.created_at)}
                        </div>
                      </div>
                    )}
                    
                    {/* Render offer or message */}
                    {item.type === 'offer' ? (
                      <OfferMessage
                        offer={item}
                        currentUserId={currentUserId || ''}
                        dark={dark}
                        unit={unit}
                        onAction={handleOfferAction}
                      />
                    ) : (
                      /* Message bubble */
                      <div
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words relative transition-all duration-200",
                          isOwnMessage
                            ? isOptimistic 
                              ? "bg-orange-400 text-white opacity-80" // Optimistic message styling
                              : "bg-orange-500 text-white"
                            : dark ? "bg-neutral-900" : "bg-neutral-100"
                        )}>
                          <div className="mb-1 flex items-center gap-2">
                            {item.text}
                            {isOptimistic && (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                          {/* Remove individual message timestamps - now handled by timestamp headers */}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Message Input */}
        <div className={cn("flex items-center gap-2 border-t p-4", dark ? "border-neutral-900" : "border-neutral-200")}>

          
          <button
            onClick={async () => {
              console.log('🎯 ChatModal: Offer button clicked!');
              console.log('🎯 ChatModal: openOffer function:', openOffer);
              console.log('🎯 ChatModal: chat?.id:', chat?.id);
              
              // If no chat exists, just open the modal - the sendOffer function will handle chat creation
              if (!chat?.id) {
                console.log('🎯 ChatModal: No chat ID, calling openOffer()');
                openOffer();
                return;
              }
              
              // Check for existing offers before opening modal
              try {
                const response = await fetch(`/api/offers/check?listingId=${encodeURIComponent(listing.id)}&chatId=${encodeURIComponent(chat.id)}`);
                if (response.ok) {
                  const data = await response.json() as { 
                    canMakeOffer?: boolean; 
                    hasExistingOffer?: boolean;
                    existingOffer?: { 
                      status?: string; 
                      id?: string; 
                      from_user_id?: string; 
                      to_user_id?: string; 
                      created_at?: number;
                      amount_sat?: number;
                      expires_at?: number;
                    } 
                  };
                  
                  if (data.hasExistingOffer && data.existingOffer) {
                    // Set the existing offer and show the modal to display it
                    console.log('🎯 ChatModal: Has existing offer, calling openOffer()');
                    setExistingOffer(data.existingOffer);
                    openOffer();
                    return;
                  }
                }
                console.log('🎯 ChatModal: No existing offer, calling openOffer()');
                openOffer();
              } catch (error) {
                // Allow modal to open if check fails
                console.log('🎯 ChatModal: Error checking offers, calling openOffer()');
                openOffer();
              }
            }}
            disabled={false}
            className={cn(
              "rounded-xl p-2 transition-all duration-200",
              dark 
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white" 
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800"
            )}
            title="Make an offer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage} 
            disabled={!text.trim() || isSending}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
              text.trim() && !isSending
                ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer" 
                : "bg-neutral-400 text-neutral-600 cursor-not-allowed"
            )}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {/* Escrow Panel */}
        {showEscrow && (
          <div className={cn("border-t", dark ? "border-neutral-900" : "border-neutral-200")}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="font-semibold">Escrow proposal</div>
              <button onClick={() => setShowEscrow(false)} className={cn("rounded px-2 py-1 text-xs", dark ? "hover:bg-neutral-900" : "hover:bg-neutral-200")}>
                Hide
              </button>
            </div>
            <div className="px-4 pb-4">
              <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
              <div className={cn("mt-1 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                Funds are locked via Lightning hold invoice until both parties confirm release.
              </div>
            </div>
            <EscrowFlow listing={listing} onClose={() => setShowEscrow(false)} dark={dark} />
          </div>
        )}
      </div>
      
      {/* Offer Modal */}
      <OfferModal
        isOpen={true} // Always render, orchestrator controls visibility
        onClose={() => {
          setExistingOffer(null);
        }}
        onSendOffer={sendOffer}
        onAbortOffer={(offerId: string) => handleOfferAction(offerId, 'abort')}
        listingPrice={listing.priceSats > 0 ? listing.priceSats : undefined}
        dark={dark}
        unit={unit}
        existingOffer={existingOffer}
      />
    </Modal>
  );
}

function EscrowFlow({ listing, onClose, dark }: { listing: Listing; onClose: () => void; dark: boolean }) {
  const [step, setStep] = useState(1);
  const feeBps = 100; // 1%
  const fee = Math.ceil((listing.priceSats * feeBps) / 10000);
  const total = listing.priceSats + fee;
  const [invoice, setInvoice] = useState(() => `lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`);

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className={cn("rounded-xl p-3 text-sm", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
        <div>
          Send <span className="font-bold text-orange-500">{formatSats(total)} sats</span> to lock funds:
        </div>
        <div className={cn("mt-3 rounded-lg p-3 text-xs", dark ? "bg-neutral-800" : "bg-neutral-100")}>{invoice}</div>
        <div className={cn("mt-2 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>Includes escrow fee {formatSats(fee)} sats (1%).</div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setStep(2)} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-orange-500/30">
            I&apos;ve deposited
          </button>
          <button
            onClick={() => setInvoice(`lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`)}
            className={cn("rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}
          >
            Regenerate
          </button>
          <button onClick={onClose} className={cn("ml-auto rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}>
            Close
          </button>
        </div>
      </div>
      <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
        Step {step}/3 — Meet in a very public place; if all good, both confirm release. Otherwise request refund; mediator can arbitrate.
      </div>
    </div>
  );
}

function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}
