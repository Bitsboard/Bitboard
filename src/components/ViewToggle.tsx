"use client";

import React from "react";

type Layout = "grid" | "list";

interface ViewToggleProps {
  layout: Layout;
  setLayout: (l: Layout) => void;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function ViewToggle({ layout, setLayout, dark }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      <button onClick={() => setLayout("grid")} className={cn("px-3 py-3 text-sm", layout === "grid" ? "text-orange-500" : "opacity-70")} title="Grid">
        ▦
      </button>
      <button onClick={() => setLayout("list")} className={cn("px-3 py-3 text-sm", layout === "list" ? "text-orange-500" : "opacity-70")} title="List">
        ≣
      </button>
    </div>
  );
}
