import { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';

export function useBtcRate() {
    const [btcCad, setBtcCad] = useState<number | null>(null);

    // Fetch BTC rate
    useEffect(() => {
        const loadBtcRate = async () => {
            try {
                const rate = await dataService.getBtcRate();
                setBtcCad(rate);
            } catch (error) {
                console.warn('Failed to load BTC rate:', error);
            }
        };

        loadBtcRate();
    }, []);

    return btcCad;
}
