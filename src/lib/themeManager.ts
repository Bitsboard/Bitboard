// Unified Theme Manager - Single source of truth for all theme operations
export type Theme = 'light' | 'dark';

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = 'dark';
  private listeners: Set<(theme: Theme) => void> = new Set();
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Initialize theme system - should be called once at app startup
  initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // Get theme from localStorage
      const savedTheme = localStorage.getItem('theme');
      
      // Only use saved theme if it's actually 'light' or 'dark'
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.currentTheme = savedTheme;
      } else {
        // No saved theme, default to dark but don't save it yet
        this.currentTheme = 'dark';
      }
      
      // Apply theme immediately to prevent flash
      this.applyTheme(this.currentTheme);
      
      // Set up theme change listener for localStorage changes
      window.addEventListener('storage', (e) => {
        if (e.key === 'theme' && e.newValue) {
          const newTheme = e.newValue as Theme;
          if (newTheme !== this.currentTheme) {
            this.setTheme(newTheme, false); // Don't save to localStorage again
          }
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Theme initialization failed:', error);
      // Fallback to dark mode
      this.currentTheme = 'dark';
      this.applyTheme('dark');
    }
  }

  // Get current theme
  getTheme(): Theme {
    return this.currentTheme;
  }

  // Set theme and optionally save to localStorage
  setTheme(theme: Theme, saveToStorage: boolean = true): void {
    if (theme === this.currentTheme) return;
    
    this.currentTheme = theme;
    
    // Apply theme to DOM
    this.applyTheme(theme);
    
    // Save to localStorage if requested
    if (saveToStorage) {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }
    }
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(theme));
  }

  // Toggle between light and dark
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // Subscribe to theme changes
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Apply theme to DOM elements
  private applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    
    try {
      const isDark = theme === 'dark';
      
      // Set classes on both html and body
      document.documentElement.className = theme;
      document.body.className = theme;
      
      // Set data attributes for additional CSS targeting
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      
      // Also set classList for Tailwind compatibility
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(theme);
      
    } catch (error) {
      console.error('Failed to apply theme to DOM:', error);
    }
  }

  // Check if theme is currently applied correctly
  isThemeApplied(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const htmlTheme = document.documentElement.className;
      const bodyTheme = document.body.className;
      
      return htmlTheme === this.currentTheme && bodyTheme === this.currentTheme;
    } catch {
      return false;
    }
  }

  // Check if theme system is initialized
  getInitializedStatus(): boolean {
    return this.isInitialized;
  }

  // Force reapply theme if it was overridden
  reapplyTheme(): void {
    this.applyTheme(this.currentTheme);
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Export convenience functions
export const getTheme = () => themeManager.getTheme();
export const setTheme = (theme: Theme) => themeManager.setTheme(theme);
export const toggleTheme = () => themeManager.toggleTheme();
export const subscribeToTheme = (listener: (theme: Theme) => void) => themeManager.subscribe(listener);
export const initializeTheme = () => themeManager.initialize();
export const isThemeApplied = () => themeManager.isThemeApplied();
export const reapplyTheme = () => themeManager.reapplyTheme();
export const isThemeInitialized = () => themeManager.getInitializedStatus();
