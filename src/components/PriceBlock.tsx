"use client";

import React from "react";
import { formatNumber, formatBTCFromSats, formatCurrency, satsToFiat } from "@/lib/utils";
import type { Unit } from "@/lib/types";

interface PriceBlockProps {
  sats: number;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  size?: "sm" | "md" | "lg";
  compactFiat?: boolean;
}

export function PriceBlock({ sats, unit, btcCad, dark, size = "sm", compactFiat = false }: PriceBlockProps) {
  // Handle "make offer" case
  if (sats === -1) {
    const mainSize = size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base";
    return (
      <div className="flex flex-col items-start">
        <span className={`font-bold text-orange-500 ${mainSize}`}>Make an offer</span>
      </div>
    );
  }

  const primary = unit === "sats" ? `${formatNumber(sats)} sats` : `₿ ${formatBTCFromSats(sats)}`;
  const cad = btcCad ? formatCurrency(satsToFiat(sats, btcCad), "CAD") : null;
  const mainSize = size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base";
  const subSize = compactFiat ? "text-xs" : (size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs");

  return (
    <div className="flex flex-col items-start">
      <span className={`font-bold text-orange-500 ${mainSize}`}>{primary}</span>
      {cad && <span className={`${subSize} ${dark ? "text-neutral-400" : "text-neutral-600"}`}>~{cad}</span>}
    </div>
  );
}
