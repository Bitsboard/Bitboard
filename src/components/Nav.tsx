"use client";

import React from "react";
import { LogoMinimal } from "./LogoMinimal";
import { UnitToggle } from "./UnitToggle";
import { ThemeToggle } from "./ThemeToggle";
import { ViewToggle } from "./ViewToggle";

type User = { id: string; email: string; handle: string };

interface NavProps {
  onPost: () => void;
  onToggleTheme: () => void;
  dark: boolean;
  user: User | null;
  onAuth: () => void;
  unit: "sats" | "BTC";
  setUnit: (unit: "sats" | "BTC") => void;
  layout: "grid" | "list";
  setLayout: (layout: "grid" | "list") => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Nav({ onPost, onToggleTheme, dark, user, onAuth, unit, setUnit, layout, setLayout }: NavProps) {
  const isStaging =
    process.env.NEXT_PUBLIC_BRANCH === "staging" ||
    process.env.NEXT_PUBLIC_ENV === "staging";

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 backdrop-blur relative",
        dark ? "border-b border-neutral-900 bg-neutral-950/80" : "border-b border-neutral-200 bg-white/80"
      )}
    >
      {isStaging && (
        <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          staging
        </span>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <LogoMinimal dark={dark} />
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-black")}>bitsbarter</span>
            <span
              className={cn(
                "hidden rounded-full px-2 py-0.5 text-xs sm:inline",
                dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600"
              )}
            >
              Toronto
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#how"
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            How it works
          </a>
          <a
            href="#pricing"
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            Pricing
          </a>
          {user ? (
            <button className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950 shadow shadow-orange-500/30 transition hover:bg-orange-400" onClick={onPost}>
              Post a listing
            </button>
          ) : (
            <button onClick={onAuth} className={cn("rounded-xl border px-4 py-2 text-sm font-semibold transition", dark ? "border-neutral-700 text-neutral-300 hover:border-orange-400 hover:text-orange-600" : "border-neutral-300 text-orange-600 hover:border-orange-400 hover:text-orange-700")}>
              Sign in
            </button>
          )}
          {/* Settings Dropdown */}
          <div className="relative group">
            <button className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}>
              ☰
            </button>
            <div className={cn("absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl backdrop-blur-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200", dark ? "border-neutral-700/50 bg-neutral-900/90" : "border-neutral-300/50 bg-white/95")}>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", dark ? "text-neutral-200" : "text-neutral-700")}>
                    Display prices in:
                  </span>
                  <UnitToggle unit={unit} setUnit={setUnit} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", dark ? "text-neutral-200" : "text-neutral-700")}>
                    Display Theme:
                  </span>
                  <ThemeToggle dark={dark} onToggle={onToggleTheme} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", dark ? "text-neutral-200" : "text-neutral-700")}>
                    Layout View:
                  </span>
                  <ViewToggle layout={layout} setLayout={setLayout} dark={dark} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
