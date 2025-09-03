"use client";

import React from "react";

interface TermsSectionProps {
  dark: boolean;
}

import { cn } from "@/lib/utils";

export function TermsSection({ dark }: TermsSectionProps) {
  return (
    <section id="terms" className="mx-auto mt-10 max-w-7xl">
      <div className={cn("rounded-2xl border p-6", dark ? "border-neutral-800 bg-neutral-950" : "border-neutral-300 bg-white")}>
        <h3 className="text-lg font-bold">Terms & Conditions</h3>
        <div className={cn("mt-3 space-y-3 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
          <p>
            By using bitsbarter, you agree to keep all correspondence in-app for safety. Off-app contact may limit our ability to help in disputes.
          </p>
          <p>Listings must comply with local laws. You are responsible for ensuring legality and authenticity of items and services.</p>
          <p>Escrow is provided via Lightning hold invoices. Funds are released only when both parties confirm, or a mediator decides in good faith based on in-app evidence.</p>
          <p id="policy">
            <strong>Prohibited items</strong> include: weapons, illicit drugs, stolen goods, counterfeit items, recalled/unsafe goods, and anything illegal in your jurisdiction.
          </p>
          <p>We are a venue: transactions are between users. bitsbarter is not a bank and does not custody fiat. Bitcoin price estimates are informational only.</p>
          <p>Violations of these terms can result in deletion of content and/or account suspension.</p>
        </div>
      </div>
    </section>
  );
}
