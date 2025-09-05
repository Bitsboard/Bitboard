import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  dark: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, dark, disabled = false, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn(
      "flex items-end space-x-2 p-4 border-t",
      dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
    )}>
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500",
            dark
              ? "bg-neutral-700 text-white placeholder-neutral-400 border border-neutral-600"
              : "bg-neutral-50 text-neutral-900 placeholder-neutral-500 border border-neutral-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={cn(
          "flex-shrink-0 p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500",
          message.trim() && !disabled
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : dark
              ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}
