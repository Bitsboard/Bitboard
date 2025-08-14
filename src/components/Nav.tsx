"use client";

import React from "react";
import { LogoMinimal } from "./LogoMinimal";

type User = { id: string; email: string; handle: string };

interface NavProps {
  onPost: () => void;
  onToggleTheme: () => void;
  dark: boolean;
  user: User | null;
  onAuth: () => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Nav({ onPost, onToggleTheme, dark, user, onAuth }: NavProps) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-40 backdrop-blur",
        dark ? "border-b border-neutral-900 bg-neutral-950/80" : "border-b border-neutral-200 bg-white/80"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <LogoMinimal dark={dark} />
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">Bitboard</span>
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
          <button
            onClick={onToggleTheme}
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
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
            <button onClick={onAuth} className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-orange-400 hover:text-orange-600">
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
