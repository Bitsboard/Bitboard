import React from 'react';
import { cn } from '@/lib/utils';

interface DeleteConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dark?: boolean;
  username?: string;
}

export default function DeleteConversationModal({
  isOpen,
  onClose,
  onConfirm,
  dark = false,
  username = "this user"
}: DeleteConversationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "animate-in fade-in duration-200"
      )}>
        <div 
          className={cn(
            "w-full max-w-md rounded-2xl shadow-xl border",
            dark 
              ? "bg-neutral-900 border-neutral-700" 
              : "bg-white border-neutral-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b",
            dark ? "border-neutral-700" : "border-neutral-200"
          )}>
            <h3 className={cn(
              "text-lg font-semibold",
              dark ? "text-white" : "text-neutral-900"
            )}>
              Delete Conversation
            </h3>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            <p className={cn(
              "text-sm leading-relaxed",
              dark ? "text-neutral-300" : "text-neutral-600"
            )}>
              Are you sure you wish to delete your conversation with <strong>{username}</strong>? They will still be able to view the conversation.
            </p>
          </div>
          
          {/* Actions */}
          <div className={cn(
            "px-6 py-4 border-t flex gap-3 justify-end",
            dark ? "border-neutral-700" : "border-neutral-200"
          )}>
            <button
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                dark
                  ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
              )}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
