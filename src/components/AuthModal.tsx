"use client";

import React, { useState } from "react";

type User = { id: string; email: string; handle: string };

interface AuthModalProps {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function AuthModal({ onClose, onAuthed, dark }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className={cn("w-full max-w-md overflow-hidden rounded-2xl", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b p-4", dark ? "border-neutral-900" : "border-neutral-200")}>
          <h2 className="text-lg font-bold">Sign in to bitsbarter</h2>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <label className="block space-y-2">
            <span className="text-sm">Email (magic link)</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="you@example.com" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm">Handle (shown publicly)</span>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="@satoshi" />
          </label>
          <button
            onClick={() => onAuthed({ id: "u1", email, handle: handle || "@you" })}
            disabled={!email}
            className={cn("w-full rounded-xl px-4 py-3 font-semibold", email ? "bg-orange-500 text-neutral-950" : dark ? "bg-neutral-800 text-neutral-600" : "bg-neutral-200 text-neutral-500")}
          >
            Send magic link (simulated)
          </button>
          <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>Demo only — no emails are sent. Clicking signs you in.</div>
        </div>
      </div>
    </div>
  );
}
