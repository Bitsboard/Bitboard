"use client";

import React from "react";

type AdType = "all" | "sell" | "want";

interface TypeToggleProps {
  adType: AdType;
  setAdType: (t: AdType) => void;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function TypeToggle({ adType, setAdType, dark }: TypeToggleProps) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      <button onClick={() => setAdType("all")} className={cn("px-3 py-3 text-sm", adType === "all" ? "text-orange-500" : "opacity-70")} title="All">
        ◎
      </button>
      <button onClick={() => setAdType("sell")} className={cn("px-3 py-3 text-sm", adType === "sell" ? "text-emerald-500" : "opacity-70")} title="Selling">
        ●
      </button>
      <button onClick={() => setAdType("want")} className={cn("px-3 py-3 text-sm", adType === "want" ? "text-fuchsia-500" : "opacity-70")} title="Looking For">
        ○
      </button>
    </div>
  );
}
