import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const env = getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    const branch = process.env.NEXT_PUBLIC_BRANCH || null;
    const envName = process.env.NEXT_PUBLIC_ENV || null;

    if (!db) {
      return NextResponse.json({ ok: false, hasDb: false, branch, env: envName, error: "No D1 binding named 'DB'" });
    }

    let count: number | null = null;
    let queryOk = false;
    try {
      const res = await db.prepare("SELECT COUNT(*) AS c FROM listings").all();
      count = (res.results?.[0] as any)?.c ?? 0;
      queryOk = true;
    } catch (e: any) {
      return NextResponse.json({ ok: false, hasDb: true, branch, env: envName, error: e?.message || String(e) });
    }

    return NextResponse.json({ ok: true, hasDb: true, branch, env: envName, count, queryOk });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}


