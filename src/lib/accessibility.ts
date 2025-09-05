// Accessibility utilities and helpers

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'role'?: string;
  'tabIndex'?: number;
}

export function createAccessibilityProps(props: Partial<AccessibilityProps>): AccessibilityProps {
  return {
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': props['aria-describedby'],
    'aria-expanded': props['aria-expanded'],
    'aria-hidden': props['aria-hidden'],
    'aria-live': props['aria-live'],
    'aria-atomic': props['aria-atomic'],
    'role': props['role'],
    'tabIndex': props['tabIndex'],
  };
}

export function getButtonAccessibilityProps(
  label: string,
  options: {
    expanded?: boolean;
    describedBy?: string;
    hidden?: boolean;
  } = {}
): AccessibilityProps {
  return createAccessibilityProps({
    'aria-label': label,
    'aria-expanded': options.expanded,
    'aria-describedby': options.describedBy,
    'aria-hidden': options.hidden,
    'role': 'button',
    'tabIndex': 0,
  });
}

export function getInputAccessibilityProps(
  label: string,
  options: {
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
  } = {}
): AccessibilityProps {
  return createAccessibilityProps({
    'aria-label': label,
    'aria-required': options.required,
    'aria-invalid': options.invalid,
    'aria-describedby': options.describedBy,
  });
}

export function getModalAccessibilityProps(
  label: string,
  options: {
    describedBy?: string;
  } = {}
): AccessibilityProps {
  return createAccessibilityProps({
    'aria-label': label,
    'aria-describedby': options.describedBy,
    'role': 'dialog',
    'aria-modal': true,
  });
}

export function getListAccessibilityProps(
  label: string,
  options: {
    expanded?: boolean;
  } = {}
): AccessibilityProps {
  return createAccessibilityProps({
    'aria-label': label,
    'aria-expanded': options.expanded,
    'role': 'list',
  });
}

export function getListItemAccessibilityProps(
  label: string,
  options: {
    selected?: boolean;
  } = {}
): AccessibilityProps {
  return createAccessibilityProps({
    'aria-label': label,
    'aria-selected': options.selected,
    'role': 'listitem',
  });
}

// Screen reader utilities
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  firstElement?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// Keyboard navigation helpers
export function handleKeyNavigation(
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onEnter?.();
      break;
    case 'Escape':
      event.preventDefault();
      onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      onArrowDown?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      onArrowLeft?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      onArrowRight?.();
      break;
  }
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want to use a proper color library
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isHighContrast(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 4.5;
}
