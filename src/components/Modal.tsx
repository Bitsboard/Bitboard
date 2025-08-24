"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    dark?: boolean;
    size?: ModalSize;
    className?: string;
    overlayClassName?: string;
    panelClassName?: string;
    closeOnOverlay?: boolean;
    ariaLabel?: string;
    maxHeightVh?: number;
    zIndex?: number;
    children: React.ReactNode;
}

export function Modal({
    open,
    onClose,
    dark,
    size = "md",
    className,
    overlayClassName,
    panelClassName,
    closeOnOverlay = true,
    ariaLabel,
    maxHeightVh = 90,
    zIndex = 50,
    children,
}: ModalProps) {
    const overlayRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            className={cn(
                "fixed inset-0 flex items-center justify-center p-4",
                "bg-black/60",
                overlayClassName
            )}
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            onMouseDown={(e) => {
                if (closeOnOverlay && e.target === overlayRef.current) onClose();
            }}
        >
            <div
                className={cn(
                    "w-full overflow-hidden rounded-2xl border",
                    dark
                        ? "border-neutral-800 bg-neutral-950 text-neutral-100"
                        : "border-neutral-200 bg-white text-neutral-900",
                    SIZE_CLASSES[size],
                    panelClassName,
                    className
                )}
                style={{ maxHeight: `${maxHeightVh}vh` }}
            >
                {children}
            </div>
        </div>
    );
}

export function ModalHeader({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
    return (
        <div className={cn("flex items-center justify-between border-b px-6 py-4", dark ? "border-neutral-900" : "border-neutral-200")}>{children}</div>
    );
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-lg font-bold">{children}</h2>;
}

export function ModalBody({ children, maxHeightSubtract = 120, className }: { children: React.ReactNode; maxHeightSubtract?: number; className?: string }) {
    return (
        <div className={cn("px-6 py-4 overflow-auto", className)} style={{ maxHeight: `calc(90vh - ${maxHeightSubtract}px)` }}>
            {children}
        </div>
    );
}

export function ModalFooter({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
    return (
        <div className={cn("flex items-center justify-end gap-3 px-6 py-4 border-t", dark ? "border-neutral-900" : "border-neutral-200")}>
            {children}
        </div>
    );
}

export function ModalCloseButton({ onClose, dark, label = "✕" }: { onClose: () => void; dark?: boolean; label?: string }) {
    return (
        <button 
            onClick={onClose} 
            className={cn(
                "rounded-lg px-3 py-1 text-lg font-bold transition-colors",
                dark 
                    ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
            )}
            aria-label="Close modal"
        >
            {label}
        </button>
    );
}


