"use client";

import React from "react";
import NextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = 'edge';

const SearchClient = NextDynamic(() => import("./SearchClient"), { ssr: false });

export default function SearchPage() {
  return <SearchClient />;
}


