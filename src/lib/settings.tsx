"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type Unit = 'sats' | 'BTC';
export type Layout = 'grid' | 'list';

export interface UserSettings {
    theme: Theme;
    unit: Unit;
    layout: Layout;
}

type SettingsAction = 
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'SET_UNIT'; payload: Unit }
    | { type: 'SET_LAYOUT'; payload: Layout }
    | { type: 'INITIALIZE'; payload: UserSettings };

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

// Reducer function
function settingsReducer(state: UserSettings, action: SettingsAction): UserSettings {
    switch (action.type) {
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'SET_UNIT':
            return { ...state, unit: action.payload };
        case 'SET_LAYOUT':
            return { ...state, layout: action.payload };
        case 'INITIALIZE':
            return action.payload;
        default:
            return state;
    }
}

// Context
const SettingsContext = createContext<{
    state: UserSettings;
    dispatch: React.Dispatch<SettingsAction>;
} | null>(null);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

    // Initialize settings on mount
    useEffect(() => {
        try {
            const settings = getInitialSettings();
            dispatch({ type: 'INITIALIZE', payload: settings });
            
            // Apply theme
            if (typeof window !== 'undefined') {
                const isDark = settings.theme === 'dark';
                if (document && document.documentElement) {
                    document.documentElement.classList.toggle('dark', isDark);
                }
            }
        } catch (error) {
            console.warn('Settings initialization failed:', error);
        }
    }, []);

    // Apply theme when it changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        try {
            const isDark = state.theme === 'dark';
            if (document && document.documentElement) {
                document.documentElement.classList.toggle('dark', isDark);
                // Trigger resize event for any components that depend on it
                window.dispatchEvent(new Event('resize'));
            }
        } catch (error) {
            console.warn('Theme application failed:', error);
        }
    }, [state.theme]);

    return (
        <SettingsContext.Provider value={{ state, dispatch }}>
            {children}
        </SettingsContext.Provider>
    );
}

// Hook to use settings
export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }

    const { state, dispatch } = context;

    return {
        ...state,
        setTheme: (theme: Theme) => {
            dispatch({ type: 'SET_THEME', payload: theme });
            // Save to localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('theme', theme);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:theme', { detail: theme }));
                } catch { }
            }
        },
        setUnit: (unit: Unit) => {
            dispatch({ type: 'SET_UNIT', payload: unit });
            // Save to localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('priceUnit', unit);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:unit', { detail: unit }));
                } catch { }
            }
        },
        setLayout: (layout: Layout) => {
            dispatch({ type: 'SET_LAYOUT', payload: layout });
            // Save to localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('layoutPref', layout);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:layout', { detail: layout }));
                } catch { }
            }
        },
        toggleTheme: () => {
            const newTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';
            dispatch({ type: 'SET_THEME', payload: newTheme });
            // Save to localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('theme', newTheme);
                    // Dispatch legacy event for backward compatibility
                    window.dispatchEvent(new CustomEvent('bb:theme', { detail: newTheme }));
                } catch { }
            }
        },
    };
}

// Individual hooks for convenience
export const useTheme = () => {
    const { theme, setTheme, toggleTheme } = useSettings();
    return { theme, setTheme, toggleTheme };
};

export const useUnit = () => {
    const { unit, setUnit } = useSettings();
    return { unit, setUnit };
};

export const useLayout = () => {
    const { layout, setLayout } = useSettings();
    return { layout, setLayout };
};
