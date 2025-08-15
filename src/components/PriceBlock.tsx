"use client";

import React from "react";

type Unit = "sats" | "BTC";

interface PriceBlockProps {
  sats: number;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
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

function formatFiat(n: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function formatBTCFromSats(sats: number) {
  const btc = sats / 1e8;
  return btc.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function PriceBlock({ sats, unit, btcCad, dark }: PriceBlockProps) {
  const primary = unit === "sats" ? `${formatSats(sats)} sats` : `₿ ${formatBTCFromSats(sats)}`;
  const usd = btcCad ? formatFiat(satsToFiat(sats, btcCad), "USD") : "— USD";

  return (
    <div className="flex flex-col items-start">
      <span className="font-bold text-orange-500">{primary}</span>
      <span className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>~{usd}</span>
    </div>
  );
}
