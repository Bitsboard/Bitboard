"use client";

import React from "react";
import { useBtcRate } from "@/lib/contexts/BtcRateContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function EnPage() {
  const btcCad = useBtcRate();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const lang = useLang();

  return (
    <div className={cn(
      "min-h-screen",
      dark 
        ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 dark" 
        : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100"
    )}>
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <h1 className={cn(
            "text-4xl font-bold mb-6",
            dark ? "text-white" : "text-neutral-900"
          )}>
            {t('welcome', lang)} - English
          </h1>
          
          <div className={cn(
            "max-w-2xl mx-auto p-6 rounded-2xl border",
            dark ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"
          )}>
            <h2 className={cn(
              "text-2xl font-semibold mb-4",
              dark ? "text-white" : "text-neutral-900"
            )}>
              BTC Rate Information
            </h2>
            
            {btcCad ? (
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-xl",
                  dark ? "bg-neutral-800" : "bg-neutral-100"
                )}>
                  <p className={cn(
                    "text-lg font-medium",
                    dark ? "text-neutral-300" : "text-neutral-700"
                  )}>
                    Current BTC Rate: <span className="text-orange-500 font-bold">${btcCad.toFixed(2)} CAD</span>
                  </p>
                  <p className={cn(
                    "text-sm mt-2",
                    dark ? "text-neutral-400" : "text-neutral-600"
                  )}>
                    This rate is used to display dollar equivalents for all listings across the site.
                  </p>
                </div>
                
                <div className={cn(
                  "p-4 rounded-xl",
                  dark ? "bg-neutral-800" : "bg-neutral-100"
                )}>
                  <p className={cn(
                    "text-sm",
                    dark ? "text-neutral-400" : "text-neutral-600"
                  )}>
                    Example: 100,000 sats = ${((100000 / 100000000) * btcCad).toFixed(2)} CAD
                  </p>
                </div>
              </div>
            ) : (
              <div className={cn(
                "p-4 rounded-xl",
                dark ? "bg-neutral-800" : "bg-neutral-100"
              )}>
                <p className={cn(
                  "text-lg font-medium",
                  dark ? "text-neutral-300" : "text-neutral-700"
                )}>
                  Loading BTC rate...
                </p>
                <p className={cn(
                  "text-sm mt-2",
                  dark ? "text-neutral-400" : "text-neutral-600"
                )}>
                  Dollar equivalents will be displayed once the rate loads.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
