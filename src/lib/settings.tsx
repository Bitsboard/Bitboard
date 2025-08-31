"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Unit, Layout, UserSettings } from './types';

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'dark',
    unit: 'sats',
    layout: 'grid',
};

interface SettingsStore extends UserSettings {
    // Settings
    setTheme: (theme: Theme) => void;
    setUnit: (unit: Unit) => void;
    setLayout: (layout: Layout) => void;
    toggleTheme: () => void;
    reset: () => void;

    // User state
    user: any | null;
    setUser: (user: any | null) => void;

    // Modal states
    modals: {
        active: any | null;
        chatFor: any | null;
        showNew: boolean;
        showAuth: boolean;
        showLocationModal: boolean;
        showUsernameChange: boolean;
    };
    setModal: (key: keyof SettingsStore['modals'], value: any) => void;
    closeAllModals: () => void;

    // Search state
    search: {
        query: string;
        category: string;
        adType: string;
    };
    setSearch: (key: keyof SettingsStore['search'], value: string) => void;
    resetSearch: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,

            // User state
            user: null,
            setUser: (user) => set({ user }),

            // Modal states
            modals: {
                active: null,
                chatFor: null,
                showNew: false,
                showAuth: false,
                showLocationModal: false,
                showUsernameChange: false,
            },
            setModal: (key, value) => set((state) => ({
                modals: { ...state.modals, [key]: value }
            })),
            closeAllModals: () => set((state) => ({
                modals: {
                    active: null,
                    chatFor: null,
                    showNew: false,
                    showAuth: false,
                    showLocationModal: false,
                    showUsernameChange: false,
                }
            })),

            // Search state
            search: {
                query: "",
                category: "Featured",
                adType: "all",
            },
            setSearch: (key, value) => set((state) => ({
                search: { ...state.search, [key]: value }
            })),
            resetSearch: () => set((state) => ({
                search: {
                    query: "",
                    category: "Featured",
                    adType: "all",
                }
            })),

            // Settings methods
            setTheme: (theme) => {
                set({ theme });
                // Theme is now handled by the unified ThemeContext
            },

            setUnit: (unit) => {
                set({ unit });
            },

            setLayout: (layout) => {
                set({ layout });
                // Dispatch custom event for components that need to sync with layout changes
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('bb:layout', { detail: layout }));
                }
            },

            toggleTheme: () => {
                // Theme toggle is now handled by the unified ThemeContext
                // This is kept for compatibility but doesn't actually toggle
            },

            reset: () => {
                set(DEFAULT_SETTINGS);
                // Theme is now handled by the unified ThemeContext
            },
        }),
        {
            name: 'bitsbarter-settings',
            partialize: (state) => ({
                theme: state.theme,
                unit: state.unit,
                layout: state.layout,
                search: state.search,
                user: state.user,
            }),
            onRehydrateStorage: () => (state) => {
                // Theme is now handled by the unified ThemeContext
            },
        }
    )
);

// Hook to use settings
export function useSettings() {
    const store = useSettingsStore();
    
    // Debug: Log user state

    
    return store;
}

// Individual hooks for convenience
// Note: useTheme is now provided by ThemeContext, not settings

// Re-export the new unified theme hook


export const useUnit = () => {
    const { unit, setUnit } = useSettingsStore();
    return { unit, setUnit };
};

export const useLayout = () => {
    const { layout, setLayout } = useSettingsStore();
    return { layout, setLayout };
};

export const useUser = () => {
    const { user, setUser } = useSettingsStore();
    return { user, setUser };
};

export const useModals = () => {
    const { modals, setModal, closeAllModals } = useSettingsStore();
    return { modals, setModal, closeAllModals };
};

export const useSearch = () => {
    const { search, setSearch, resetSearch } = useSettingsStore();
    return { search, setSearch, resetSearch };
};

// Legacy compatibility - remove after migration
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
