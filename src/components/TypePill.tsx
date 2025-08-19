"use client";

import React from "react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";

interface TypePillProps {
  type: "sell" | "want";
}

export function TypePill({ type }: TypePillProps) {
  const lang = useLang();
  if (type === "want")
    return (
      <span className="inline-flex items-center rounded-full bg-fuchsia-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
        {t('looking_for', lang)}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
      {t('selling', lang)}
    </span>
  );
}
