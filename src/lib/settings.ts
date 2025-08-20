import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

        return {
            theme: (theme === 'light' || theme === 'dark') ? theme : DEFAULT_SETTINGS.theme,
            unit: (unit === 'sats' || unit === 'BTC') ? unit : DEFAULT_SETTINGS.unit,
            layout: (layout === 'grid' || layout === 'list') ? layout : DEFAULT_SETTINGS.layout,
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export const useSettings = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...getInitialSettings(),

            setTheme: (theme: Theme) => {
                set({ theme });
                get().applyTheme();

                // Dispatch legacy event for backward compatibility
                if (typeof window !== 'undefined') {
                    try {
                        window.dispatchEvent(new CustomEvent('bb:theme', { detail: theme }));
                    } catch { }
                }
            },

            setUnit: (unit: Unit) => {
                set({ unit });

                // Dispatch legacy event for backward compatibility
                if (typeof window !== 'undefined') {
                    try {
                        window.dispatchEvent(new CustomEvent('bb:unit', { detail: unit }));
                    } catch { }
                }
            },

            setLayout: (layout: Layout) => {
                set({ layout });

                // Dispatch legacy event for backward compatibility
                if (typeof window !== 'undefined') {
                    try {
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
                const settings = getInitialSettings();
                set(settings);
                get().applyTheme();
            },

            applyTheme: () => {
                if (typeof window === 'undefined') return;

                try {
                    const { theme } = get();
                    const isDark = theme === 'dark';
                    document.documentElement.classList.toggle('dark', isDark);

                    // Trigger resize event for any components that depend on it
                    window.dispatchEvent(new Event('resize'));
                } catch { }
            },
        }),
        {
            name: 'bitsbarter-settings',
        }
    )
);

// Export individual hooks for convenience
export const useTheme = () => useSettings((state) => ({ theme: state.theme, setTheme: state.setTheme, toggleTheme: state.toggleTheme }));
export const useUnit = () => useSettings((state) => ({ unit: state.unit, setUnit: state.setUnit }));
export const useLayout = () => useSettings((state) => ({ layout: state.layout, setLayout: state.setLayout }));

// Initialize settings on import
if (typeof window !== 'undefined') {
    useSettings.getState().initialize();
}
