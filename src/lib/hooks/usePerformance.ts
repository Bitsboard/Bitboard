import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { debounce, throttle, memoize, createVirtualScroller } from '@/lib/utils';

/**
 * Hook for debounced function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): T {
    const funcRef = useRef(func);
    funcRef.current = func;

    const debouncedFunc = useMemo(
        () => debounce((...args: Parameters<T>) => funcRef.current(...args), delay),
        [delay]
    );

    return debouncedFunc as T;
}

/**
 * Hook for throttled function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
    func: T,
    interval: number
): T {
    const funcRef = useRef(func);
    funcRef.current = func;

    const throttledFunc = useMemo(
        () => throttle((...args: Parameters<T>) => funcRef.current(...args), interval),
        [interval]
    );

    return throttledFunc as T;
}

/**
 * Hook for memoized expensive calculations
 */
export function useMemoized<T>(
    factory: () => T,
    deps: React.DependencyList,
    maxSize: number = 100
): T {
    const memoizedFactory = useMemo(
        () => memoize(factory, maxSize),
        [maxSize]
    );

    return useMemo(memoizedFactory, deps);
}

/**
 * Hook for intersection observer with cleanup
 */
export function useIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
) {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(callback, {
            rootMargin: '50px',
            threshold: 0.1,
            ...options,
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [callback, options]);

    const observe = useCallback((element: Element | null) => {
        if (observerRef.current && element) {
            observerRef.current.observe(element);
        }
    }, []);

    const unobserve = useCallback((element: Element | null) => {
        if (observerRef.current && element) {
            observerRef.current.unobserve(element);
        }
    }, []);

    return { observe, unobserve };
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScrolling<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
) {
    const [scrollTop, setScrollTop] = useState(0);

    const virtualScroller = useMemo(
        () => createVirtualScroller(items, itemHeight, containerHeight, overscan),
        [items, itemHeight, containerHeight, overscan]
    );

    const visibleRange = useMemo(
        () => virtualScroller.getVisibleRange(scrollTop),
        [virtualScroller, scrollTop]
    );

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(event.currentTarget.scrollTop);
    }, []);

    return {
        visibleRange,
        handleScroll,
        totalHeight: virtualScroller.getTotalHeight(),
        itemHeight: virtualScroller.getItemHeight(),
    };
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string, placeholder?: string) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholder || src);

    useEffect(() => {
        if (src === currentSrc) return;

        setIsLoaded(false);
        setCurrentSrc(placeholder || src);

        const img = new Image();
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
        img.src = src;
    }, [src, placeholder, currentSrc]);

    return { src: currentSrc, isLoaded };
}

/**
 * Hook for preventing unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback((...args: Parameters<T>) => {
        return callbackRef.current(...args);
    }, []) as T;
}
