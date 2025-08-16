"use client";

import React from "react";
import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = 'edge';

const SearchClient = dynamic(() => import("./SearchClient"), { ssr: false });

export default function SearchPage() {
  return <SearchClient />;
}


