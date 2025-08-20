import { create } from 'zustand';

export type Theme = 'light' | 'dark';
export type Unit = 'sats' | 'BTC';
export type Layout = 'grid' | 'list';

export interface UserSettings {
    theme: Theme;
    unit: Unit;
    layout: Layout;
}

interface SettingsStore extends UserSettings {
    // Actions
    setTheme: (theme: Theme) => void;
    setUnit: (unit: Unit) => void;
    setLayout: (layout: Layout) => void;
    toggleTheme: () => void;

    // Initialize from localStorage on mount
    initialize: () => void;

    // Apply settings to DOM
    applyTheme: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'dark',
    unit: 'sats',
    layout: 'grid',
};

// Helper to safely get initial values from localStorage
function getInitialSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const theme = localStorage.getItem('theme') as Theme;
    const unit = localStorage.getItem('priceUnit') as Unit;
    const layout = localStorage.getItem('layoutPref') as Layout;
    
    // Validate and return settings, fall back to defaults if invalid
    return {
      theme: (theme === 'light' || theme === 'dark') ? theme : DEFAULT_SETTINGS.theme,
      unit: (unit === 'sats' || unit === 'BTC') ? unit : DEFAULT_SETTINGS.unit,
      layout: (layout === 'grid' || layout === 'list') ? layout : DEFAULT_SETTINGS.layout,
    };
  } catch (error) {
    console.warn('Failed to read settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

export const useSettings = create<SettingsStore>()(
    (set, get) => ({
        // Start with defaults, don't call getInitialSettings during store creation
        ...DEFAULT_SETTINGS,

        setTheme: (theme: Theme) => {
            set({ theme });
            get().applyTheme();

            // Save to localStorage directly
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('theme', theme);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:theme', { detail: theme }));
                } catch { }
            }
        },

        setUnit: (unit: Unit) => {
            set({ unit });

            // Save to localStorage directly
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('priceUnit', unit);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:unit', { detail: unit }));
                } catch { }
            }
        },

        setLayout: (layout: Layout) => {
            set({ layout });

            // Save to localStorage directly
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('layoutPref', layout);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:layout', { detail: layout }));
                } catch { }
            }
        },

        toggleTheme: () => {
            const current = get().theme;
            const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
            get().setTheme(newTheme);
        },

        initialize: () => {
            try {
                const settings = getInitialSettings();
                set(settings);
                // Only apply theme in browser environment
                if (typeof window !== 'undefined') {
                    get().applyTheme();
                }
            } catch (error) {
                console.warn('Settings initialization failed:', error);
                // Fall back to defaults if initialization fails
                set(DEFAULT_SETTINGS);
            }
        },

        applyTheme: () => {
            if (typeof window === 'undefined') return;
            
            try {
                const { theme } = get();
                const isDark = theme === 'dark';
                
                // Safely manipulate DOM
                if (document && document.documentElement) {
                    document.documentElement.classList.toggle('dark', isDark);
                    
                    // Trigger resize event for any components that depend on it
                    window.dispatchEvent(new Event('resize'));
                }
            } catch (error) {
                console.warn('Theme application failed:', error);
                // Don't crash if theme application fails
            }
        },
    })
);

// Export individual hooks for convenience
export const useTheme = () => useSettings((state) => ({ theme: state.theme, setTheme: state.setTheme, toggleTheme: state.toggleTheme }));
export const useUnit = () => useSettings((state) => ({ unit: state.unit, setUnit: state.setUnit }));
export const useLayout = () => useSettings((state) => ({ layout: state.layout, setLayout: state.setLayout }));

// Don't auto-initialize on import - let the SettingsProvider handle it
// This prevents issues in SSR and edge runtime environments
