"use client";

import React from "react";

type Unit = "sats" | "BTC";

interface PriceBlockProps {
  sats: number;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  size?: "sm" | "md" | "lg";
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

function satsToFiat(sats: number, btcFiat: number) {
  return (sats / 1e8) * btcFiat;
}

function formatFiat(n: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function formatBTCFromSats(sats: number) {
  const btc = sats / 1e8;
  return btc.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function PriceBlock({ sats, unit, btcCad, dark, size = "sm" }: PriceBlockProps) {
  const primary = unit === "sats" ? `${formatSats(sats)} sats` : `₿ ${formatBTCFromSats(sats)}`;
  const cad = btcCad ? formatFiat(satsToFiat(sats, btcCad), "CAD") : null;
  const mainSize = size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base";
  const subSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-col items-start">
      <span className={cn("font-bold text-orange-500", mainSize)}>{primary}</span>
      {cad && <span className={cn(subSize, dark ? "text-neutral-400" : "text-neutral-600")}>~{cad}</span>}
    </div>
  );
}
