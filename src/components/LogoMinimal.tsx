"use client";

import React from "react";

interface LogoMinimalProps {
  dark: boolean;
}

export function LogoMinimal({ dark }: LogoMinimalProps) {
  const primary = dark ? "#f97316" : "#ea580c";
  const bgCoin = dark ? "#0a0a0a" : "#ffffff";
  
  return (
    <div className="grid h-8 w-8 place-items-center">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-label="Bitboard logo">
        <circle cx="14" cy="14" r="12" fill={bgCoin} stroke={primary} strokeWidth="2" />
        <circle cx="18" cy="10" r="2" fill={primary} />
      </svg>
    </div>
  );
}
