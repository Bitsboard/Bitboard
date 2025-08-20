"use client";

import React, { useState } from "react";
import { LogoMinimal } from "@/components";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n-client";

export default function PrivacyPage() {
  const [dark, setDark] = useState(true);
  const lang = useLang();
  const homeHref = `/${lang}`;

  return (
    <div className={cn("min-h-screen", dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900") }>
      {/* Header via layout */}

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>

          <div className={cn("rounded-2xl border p-8", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white") }>
            <div className="space-y-6 text-base">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
                <p>We collect the minimum necessary information to operate the marketplace and keep users safe.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">2. Data we store</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Authentication data: your Google sign-in identifier (for internal use), username you choose, and profile photo.</li>
                  <li>Content: listings and messages you create.</li>
                  <li>Technical: basic logs for reliability and security.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">3. How we use data</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Operate features like chat, listings, and escrow.</li>
                  <li>Moderation and fraud prevention.</li>
                  <li>Legal compliance.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">4. Your choices</h2>
                <p>You can sign out anytime. For account/data requests, contact us in-app. Keep correspondence in-app for safety.</p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer via layout */}
    </div>
  );
}


