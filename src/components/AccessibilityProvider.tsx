import React, { createContext, useContext, useEffect, useState } from 'react';
import { APP_CONFIG } from '@/lib/config';

interface AccessibilityContextType {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  toggleKeyboardNavigation: () => void;
  toggleScreenReaderSupport: () => void;
  announceToScreenReader: (message: string) => void;
  focusVisibleClass: string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [enableKeyboardNavigation, setEnableKeyboardNavigation] = useState(
    APP_CONFIG.ENABLE_KEYBOARD_NAVIGATION
  );
  const [enableScreenReaderSupport, setEnableScreenReaderSupport] = useState(
    APP_CONFIG.ENABLE_SCREEN_READER_SUPPORT
  );

  // Load accessibility preferences from localStorage
  useEffect(() => {
    const savedKeyboardNav = localStorage.getItem('accessibility_keyboard_navigation');
    const savedScreenReader = localStorage.getItem('accessibility_screen_reader');
    
    if (savedKeyboardNav !== null) {
      setEnableKeyboardNavigation(savedKeyboardNav === 'true');
    }
    if (savedScreenReader !== null) {
      setEnableScreenReaderSupport(savedScreenReader === 'true');
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility_keyboard_navigation', enableKeyboardNavigation.toString());
  }, [enableKeyboardNavigation]);

  useEffect(() => {
    localStorage.setItem('accessibility_screen_reader', enableScreenReaderSupport.toString());
  }, [enableScreenReaderSupport]);

  // Add focus-visible class to body when keyboard navigation is enabled
  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.body.classList.add(APP_CONFIG.FOCUS_VISIBLE_CLASS);
    } else {
      document.body.classList.remove(APP_CONFIG.FOCUS_VISIBLE_CLASS);
    }
  }, [enableKeyboardNavigation]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key) {
        case 'Tab':
          // Ensure focus is visible when using Tab
          document.body.classList.add(APP_CONFIG.FOCUS_VISIBLE_CLASS);
          break;
        case 'Escape':
          // Close modals or return to previous state
          const activeModal = document.querySelector('[data-modal="active"]');
          if (activeModal) {
            const closeButton = activeModal.querySelector('[data-close-modal]') as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          }
          break;
        case 'Enter':
        case ' ':
          // Handle Enter and Space for interactive elements
          if (event.target instanceof HTMLElement && event.target.getAttribute('role') === 'button') {
            event.preventDefault();
            event.target.click();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation]);

  const toggleKeyboardNavigation = () => {
    setEnableKeyboardNavigation(prev => !prev);
  };

  const toggleScreenReaderSupport = () => {
    setEnableScreenReaderSupport(prev => !prev);
  };

  const announceToScreenReader = (message: string) => {
    if (!enableScreenReaderSupport) return;

    // Create a live region for screen reader announcements
    let liveRegion = document.getElementById('screen-reader-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only'; // Screen reader only
      document.body.appendChild(liveRegion);
    }

    // Update the live region to trigger announcement
    liveRegion.textContent = message;
    
    // Clear after a short delay
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  };

  const value: AccessibilityContextType = {
    enableKeyboardNavigation,
    enableScreenReaderSupport,
    toggleKeyboardNavigation,
    toggleScreenReaderSupport,
    announceToScreenReader,
    focusVisibleClass: APP_CONFIG.FOCUS_VISIBLE_CLASS,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
