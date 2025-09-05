import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Message, User } from '@/lib/types';

interface ChatMessagesProps {
  messages: Message[];
  currentUser: User | null;
  dark: boolean;
  isLoading: boolean;
}

export function ChatMessages({ messages, currentUser, dark, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowTimestamp = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;
    
    const currentTime = currentMessage.created_at * 1000;
    const previousTime = previousMessage.created_at * 1000;
    const timeDiff = currentTime - previousTime;
    
    const FIVE_MINUTES = 5 * 60 * 1000;
    return timeDiff > FIVE_MINUTES;
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center p-4",
        dark ? "bg-neutral-900" : "bg-neutral-50"
      )}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className={cn(
            "text-sm",
            dark ? "text-neutral-400" : "text-neutral-500"
          )}>
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center p-4",
        dark ? "bg-neutral-900" : "bg-neutral-50"
      )}>
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            dark ? "bg-neutral-800" : "bg-neutral-200"
          )}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className={cn(
            "text-sm",
            dark ? "text-neutral-400" : "text-neutral-500"
          )}>
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-4 space-y-4",
      dark ? "bg-neutral-900" : "bg-neutral-50"
    )}>
      {messages.map((message, index) => {
        const isCurrentUser = currentUser && message.from_id === currentUser.id;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showTimestamp = shouldShowTimestamp(message, previousMessage);

        return (
          <div key={message.id} className="space-y-2">
            {showTimestamp && (
              <div className="text-center">
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  dark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-200 text-neutral-500"
                )}>
                  {formatTimestamp(message.created_at)}
                </span>
              </div>
            )}
            
            <div className={cn(
              "flex",
              isCurrentUser ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                isCurrentUser
                  ? dark
                    ? "bg-orange-500 text-white"
                    : "bg-orange-500 text-white"
                  : dark
                    ? "bg-neutral-700 text-white"
                    : "bg-white text-neutral-900 border border-neutral-200"
              )}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
