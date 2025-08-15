"use client";

import React from "react";

interface SafetyTipsSectionProps {
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function SafetyTipsSection({ dark }: SafetyTipsSectionProps) {
  return (
    <section id="tips" className="mx-auto mt-20 max-w-7xl">
      <div className={cn("rounded-3xl border-2 border-dashed p-8 backdrop-blur-sm", dark ? "border-neutral-700/50 bg-neutral-900/30" : "border-neutral-300/50 bg-white/80")}>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl">🛡️</div>
          <h3 className={cn("text-2xl font-bold", dark ? "text-white" : "text-neutral-900")}>Buyer & Seller Safety</h3>
        </div>
        <ul className={cn("grid gap-4 md:grid-cols-2 text-base", dark ? "text-neutral-300" : "text-neutral-700")}>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Meet in a <strong>very public</strong> place: malls, cafés, or police e-commerce zones.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Bring a friend or tell someone your meeting place and time.</span>
          </li>
          <li className="flex items-start gap-3">
            <span>Keep <strong>all correspondence in-app</strong>; off-app contact is against our guidelines.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Inspect items in person; test devices and verify serial numbers.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Prefer <strong>Lightning escrow</strong> over cash; confirm release only when satisfied.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Trust your instincts — if something feels off, walk away and report the listing.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
