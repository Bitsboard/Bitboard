// Performance optimization utilities

/**
 * Debounce function calls - only execute after delay has passed without new calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function calls - execute at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    interval: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= interval) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * Memoize function results with LRU cache
 */
export function memoize<T extends (...args: any[]) => any>(
    func: T,
    maxSize: number = 100
): T {
    const cache = new Map<string, any>();
    const keys: string[] = [];

    return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            // Move to end (most recently used)
            const index = keys.indexOf(key);
            keys.splice(index, 1);
            keys.push(key);
            return cache.get(key);
        }

        const result = func(...args);
        cache.set(key, result);
        keys.push(key);

        // Remove oldest if cache is full
        if (keys.length > maxSize) {
            const oldestKey = keys.shift()!;
            cache.delete(oldestKey);
        }

        return result;
    }) as T;
}

/**
 * Batch multiple function calls into a single execution
 */
export function batch<T extends (...args: any[]) => any>(
    func: T,
    batchSize: number = 10,
    delay: number = 100
): (...args: Parameters<T>) => void {
    let batch: Parameters<T>[] = [];
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        batch.push(args);

        if (batch.length >= batchSize) {
            clearTimeout(timeoutId);
            func(...batch.flat());
            batch = [];
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (batch.length > 0) {
                    func(...batch.flat());
                    batch = [];
                }
            }, delay);
        }
    };
}

/**
 * Intersection Observer utility for lazy loading
 */
export function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
): IntersectionObserver {
    return new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
    });
}

/**
 * Virtual scrolling utility for large lists
 */
export function createVirtualScroller<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
) {
    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    return {
        getVisibleRange(scrollTop: number) {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(
                startIndex + visibleCount + overscan,
                items.length
            );

            return {
                startIndex: Math.max(0, startIndex - overscan),
                endIndex,
                items: items.slice(
                    Math.max(0, startIndex - overscan),
                    endIndex
                ),
                offsetY: Math.max(0, startIndex - overscan) * itemHeight,
            };
        },

        getTotalHeight: () => totalHeight,
        getItemHeight: () => itemHeight,
    };
}
