// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
// Import dynamically to avoid top-level failures if adapter not present

export const runtime = "edge";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "@cloudflare/next-on-pages not available" }, { status: 500 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const res = await db.prepare("DELETE FROM listings WHERE id = ?").bind(id).run();
  const changes = (res as any).meta?.changes ?? 0;
  return NextResponse.json({ ok: changes > 0 });
}
