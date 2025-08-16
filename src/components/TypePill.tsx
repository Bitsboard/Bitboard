"use client";

import React from "react";

interface TypePillProps {
  type: "sell" | "want";
}

export function TypePill({ type }: TypePillProps) {
  if (type === "want")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-400 ring-1 ring-fuchsia-500/20 backdrop-blur">
        <span aria-hidden>🔎</span>
        Looking For
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20 backdrop-blur">
      <span aria-hidden>💼</span>
      Selling
    </span>
  );
}
