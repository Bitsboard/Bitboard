"use client";

import { useEffect } from 'react';
import { useSettings } from '@/lib/settings';

interface SettingsProviderProps {
    children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const { initialize } = useSettings();

    // Initialize settings on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    return <>{children}</>;
}
