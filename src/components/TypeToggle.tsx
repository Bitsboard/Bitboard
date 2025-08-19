"use client";

import React from "react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";

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
  const lang = useLang();
  return (
    <div className={cn("flex rounded-2xl border backdrop-blur-sm", dark ? "border-neutral-700/50 bg-neutral-900/30" : "border-neutral-300/50 bg-white/80")}>
      <button
        onClick={() => setAdType("all")}
        className={cn("px-4 py-3 text-sm border-r transition-all duration-200 hover:scale-105", dark ? "border-neutral-700/50" : "border-neutral-300/50", adType === "all" ? "text-orange-500 font-bold" : "opacity-70 hover:opacity-100")}
        title="All Types"
      >
        {t('all_listings', lang)}
      </button>
      <button
        onClick={() => setAdType("sell")}
        className={cn("px-4 py-3 text-sm border-r transition-all duration-200 hover:scale-105", dark ? "border-neutral-700/50" : "border-neutral-300/50", adType === "sell" ? "text-emerald-500 font-bold" : "opacity-70 hover:opacity-100")}
        title="Selling Only"
      >
        {t('selling', lang)}
      </button>
      <button
        onClick={() => setAdType("want")}
        className={cn("px-4 py-3 text-sm transition-all duration-200 hover:scale-105", adType === "want" ? "text-fuchsia-500 font-bold" : "opacity-70 hover:opacity-100")}
        title="Looking For Only"
      >
        {t('looking_for', lang)}
      </button>
    </div>
  );
}
