"use client";

import React from "react";

interface TypePillProps {
  type: "sell" | "want";
}

export function TypePill({ type }: TypePillProps) {
  if (type === "want")
    return (
      <span className="inline-flex items-center rounded-full bg-fuchsia-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
        Looking For
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
      Selling
    </span>
  );
}
