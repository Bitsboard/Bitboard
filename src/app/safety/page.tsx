"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLang, t } from "@/lib/i18n";

export default function SafetyPage() {
  const lang = useLang();
  const dark = true;
  const homeHref = `/${lang}`;
  return (
    <main className={cn("min-h-screen", dark ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900")}> 
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">{t('safety_tips', lang)}</h1>
        <p className={cn("mb-6", dark ? "text-neutral-300" : "text-neutral-700")}>{t('listing_warning', lang)}</p>
        <ol className={cn("list-decimal space-y-3 pl-6", dark ? "text-neutral-300" : "text-neutral-800")}> 
          <li>Use in‑app chat to coordinate; avoid sharing personal contact info.</li>
          <li>Meet in public places when possible; bring a friend for high‑value trades.</li>
          <li>Inspect items carefully before exchanging funds.</li>
          <li>Prefer Lightning escrow in chat; release only after you receive goods/services.</li>
          <li>Trust your instincts. If something feels off, walk away and report the listing.</li>
        </ol>
        <div className="mt-8">
          <a href={homeHref} className="text-orange-400 font-semibold">← Back to home</a>
        </div>
      </div>
    </main>
  );
}


