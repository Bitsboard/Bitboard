"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { OfferModal } from "../OfferModal";
import { OfferMessage } from "../OfferMessage";
import { PriceBlock } from "../PriceBlock";
import { PrimaryButton } from "../ui/Button";
import { cn } from "@/lib/utils";
import type { Listing, User, Message, Chat, Unit } from "@/lib/types";

interface ChatModalRefactoredProps {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number | null;
  unit: Unit;
  onBackToListing?: () => void;
  user: User | null;
}

export function ChatModalRefactored({
  listing,
  onClose,
  dark,
  btcCad,
  unit,
  onBackToListing,
  user
}: ChatModalRefactoredProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);

  // Load chat and messages
  useEffect(() => {
    loadChat();
  }, [listing.id]);

  const loadChat = async () => {
    try {
      setIsLoading(true);
      
      // Load chat
      const chatResponse = await fetch(`/api/chat/${listing.id}`);
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChat(chatData.data.chat);
        setMessages(chatData.data.messages || []);
        setOtherUser(chatData.data.otherUser);
      }
      
      // Load offers
      const offersResponse = await fetch(`/api/offers/check?listing_id=${listing.id}`);
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setOffers(offersData.data || []);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!chat || !content.trim()) return;

    try {
      setIsSending(true);
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          content: content.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: string) => {
    try {
      const response = await fetch('/api/offers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, action })
      });

      if (response.ok) {
        await loadChat(); // Reload to get updated offers
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  if (!chat || !otherUser) {
    return (
      <Modal onClose={onClose} dark={dark}>
        <div className={cn(
          "w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl",
          "max-h-[90vh] flex flex-col"
        )}>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className={cn(
                "text-sm",
                dark ? "text-neutral-400" : "text-neutral-500"
              )}>
                Loading chat...
              </p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal onClose={onClose} dark={dark}>
        <div className={cn(
          "w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl",
          "max-h-[90vh] flex flex-col"
        )}>
          <ChatHeader
            listing={listing}
            otherUser={otherUser}
            onClose={onClose}
            dark={dark}
            btcCad={btcCad || 0}
            unit={unit}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <ChatMessages
              messages={messages}
              currentUser={user}
              dark={dark}
              isLoading={isLoading}
            />

            {/* Offers section */}
            {offers.length > 0 && (
              <div className={cn(
                "border-t p-4",
                dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"
              )}>
                <h4 className={cn(
                  "text-sm font-semibold mb-3",
                  dark ? "text-white" : "text-neutral-900"
                )}>
                  Offers
                </h4>
                <div className="space-y-2">
                  {offers.map((offer) => (
                    <OfferMessage
                      key={offer.id}
                      offer={offer}
                      isCurrentUser={user?.id === offer.from_user_id}
                      onAction={handleOfferAction}
                      dark={dark}
                      btcCad={btcCad}
                      unit={unit}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Price and actions */}
            <div className={cn(
              "border-t p-4",
              dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
            )}>
              <div className="flex items-center justify-between mb-4">
                <PriceBlock
                  priceSats={listing.priceSats}
                  btcCad={btcCad}
                  unit={unit}
                  pricingType={listing.pricingType}
                />
                {listing.pricingType === 'make_offer' && (
                  <PrimaryButton
                    onClick={() => setShowOfferModal(true)}
                    className="px-4 py-2"
                  >
                    Make Offer
                  </PrimaryButton>
                )}
              </div>
            </div>

            <ChatInput
              onSendMessage={sendMessage}
              dark={dark}
              disabled={isSending}
              placeholder="Type a message..."
            />
          </div>
        </div>
      </Modal>

      {showOfferModal && (
        <OfferModal
          listing={listing}
          onClose={() => setShowOfferModal(false)}
          onOfferSent={() => {
            setShowOfferModal(false);
            loadChat();
          }}
          dark={dark}
          btcCad={btcCad}
          unit={unit}
        />
      )}
    </>
  );
}
