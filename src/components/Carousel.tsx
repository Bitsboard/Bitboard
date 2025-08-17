"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface CarouselProps {
    images: string[];
    alt: string;
    dark: boolean;
    className?: string;
    showDots?: boolean;
    showArrows?: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

export function Carousel({ images, alt, dark, className, showDots = true, showArrows = true }: CarouselProps) {
    const validImages = images && images.length > 0 ? images : [
        "https://images.unsplash.com/photo-1555617117-08d3a8fef16c?w=1200&q=80&auto=format&fit=crop",
    ];
    const [index, setIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const touchStartX = useRef<number | null>(null);
    const touchDeltaX = useRef<number>(0);

    const clampIndex = useCallback((i: number) => {
        if (i < 0) return 0;
        if (i >= validImages.length) return validImages.length - 1;
        return i;
    }, [validImages.length]);

    const goTo = useCallback((i: number) => setIndex((prev) => clampIndex(i)), [clampIndex]);
    const next = useCallback(() => goTo(index + 1), [goTo, index]);
    const prev = useCallback(() => goTo(index - 1), [goTo, index]);

    // Keyboard navigation when focused
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        el.addEventListener("keydown", onKey);
        return () => el.removeEventListener("keydown", onKey);
    }, [next, prev]);

    // Touch/swipe support
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };
    const onTouchEnd = () => {
        const dx = touchDeltaX.current;
        touchStartX.current = null;
        touchDeltaX.current = 0;
        const threshold = 40;
        if (dx > threshold) prev();
        else if (dx < -threshold) next();
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative select-none outline-none", className)}
            tabIndex={0}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            aria-roledescription="carousel"
        >
            <div className="relative h-full w-full overflow-hidden rounded-xl">
                <div
                    className="flex h-full w-full transition-transform duration-300"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {validImages.map((src, i) => (
                        <div key={i} className="relative h-full w-full shrink-0 grow-0 basis-full">
                            <img
                                src={src}
                                alt={alt}
                                className="h-full w-full object-cover"
                                loading={i === 0 ? "eager" : "lazy"}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>

                {/* Arrows */}
                {showArrows && validImages.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className={cn(
                                "absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-4 text-xl shadow-xl transition",
                                dark ? "bg-white/90 text-neutral-900 hover:bg-white" : "bg-neutral-900/90 text-white hover:bg-neutral-900"
                            )}
                            aria-label="Previous image"
                        >
                            ‹
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-4 text-xl shadow-xl transition",
                                dark ? "bg-white/90 text-neutral-900 hover:bg-white" : "bg-neutral-900/90 text-white hover:bg-neutral-900"
                            )}
                            aria-label="Next image"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Dots */}
                {showDots && validImages.length > 1 && (
                    <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
                        {validImages.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all",
                                    i === index ? (dark ? "bg-white" : "bg-neutral-900") : (dark ? "bg-white/50" : "bg-neutral-900/50")
                                )}
                            />)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


