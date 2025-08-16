import React, { Suspense } from "react";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm opacity-70">Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}


