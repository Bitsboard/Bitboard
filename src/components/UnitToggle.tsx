"use client";

import React from "react";

type Unit = "sats" | "BTC";

interface UnitToggleProps {
  unit: Unit;
  setUnit: (u: Unit) => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function UnitToggle({ unit, setUnit }: UnitToggleProps) {
  return (
    <div className="inline-flex rounded-xl border overflow-hidden">
      <button onClick={() => setUnit("sats")} className={cn("px-3 py-1 text-xs", unit === "sats" ? "bg-orange-500 text-neutral-950" : "opacity-80")}>
        sats
      </button>
      <button onClick={() => setUnit("BTC")} className={cn("px-3 py-1 text-xs", unit === "BTC" ? "bg-orange-500 text-neutral-950" : "opacity-80")}>
        BTC
      </button>
    </div>
  );
}
