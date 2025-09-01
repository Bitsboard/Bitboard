// Provide a local shim for async_hooks under edge bundling
import '@/shims/async_hooks';
import { NextResponse } from "next/server";
// Avoid hard crashing if the adapter isn't available; import dynamically inside handler

export const runtime = "edge";

export async function GET() {
  try {
    // Dynamically import to prevent top-level import errors in non-adapted envs
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ ok: false, error: "adapter_missing", hint: "@cloudflare/next-on-pages not available" }, { status: 200 });
    }
    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    const branch = process.env.NEXT_PUBLIC_BRANCH || null;
    const envName = process.env.NEXT_PUBLIC_ENV || null;

    if (!db) return NextResponse.json({ ok: false, hasDb: false, branch, env: envName, error: "no_db_binding" }, { status: 200 });

    let count: number | null = null;
    let queryOk = false;
    try {
      const res = await db.prepare("SELECT COUNT(*) AS c FROM listings").all();
      count = (res.results?.[0] as any)?.c ?? 0;
      queryOk = true;
    } catch (e: any) {
      return NextResponse.json({ ok: false, hasDb: true, branch, env: envName, error: e?.message || String(e) }, { status: 200 });
    }

    return NextResponse.json({ ok: true, hasDb: true, branch, env: envName, count, queryOk });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 200 });
  }
}


