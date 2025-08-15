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
    <div className="relative inline-flex rounded-2xl bg-neutral-200/50 p-1 shadow-lg border border-neutral-300/50 backdrop-blur-sm">
      <div
        className={cn(
          "absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out",
          unit === "sats" ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => setUnit("sats")}
        className={cn(
          "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
          unit === "sats"
            ? "text-orange-700 font-extrabold"
            : "text-neutral-600 hover:text-neutral-700"
        )}
      >
        sats
      </button>
      <button
        onClick={() => setUnit("BTC")}
        className={cn(
          "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
          unit === "BTC"
            ? "text-orange-700 font-extrabold"
            : "text-neutral-600 hover:text-neutral-800"
        )}
      >
        BTC
      </button>
    </div>
  );
}
