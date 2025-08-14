"use client";

import React from "react";

interface TypePillProps {
  type: "sell" | "want";
}

export function TypePill({ type }: TypePillProps) {
  if (type === "want")
    return (
      <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-400">
        Looking For
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      Selling
    </span>
  );
}
