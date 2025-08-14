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
    <section id="tips" className="mx-auto mt-14 max-w-7xl">
      <div className={cn("rounded-2xl border p-6", dark ? "border-neutral-800 bg-neutral-950" : "border-neutral-300 bg-white")}>
        <h3 className="text-lg font-bold">Buyer & Seller Safety</h3>
        <ul className={cn("mt-3 list-disc space-y-2 pl-6 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
          <li>
            Meet in a <strong>very public</strong> place: malls, cafés, or police e-commerce zones.
          </li>
          <li>Bring a friend or tell someone your meeting place and time.</li>
          <li>
            Keep <strong>all correspondence in-app</strong>; off-app contact is against our guidelines.
          </li>
          <li>Inspect items in person; test devices and verify serial numbers.</li>
          <li>
            Prefer <strong>Lightning escrow</strong> over cash; confirm release only when satisfied.
          </li>
          <li>Trust your instincts — if something feels off, walk away and report the listing.</li>
        </ul>
      </div>
    </section>
  );
}
