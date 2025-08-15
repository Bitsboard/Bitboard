import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: Request) {
  const db = getRequestContext().env.DB as D1Database;
  const url = new URL(req.url);
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const { results } = await db
    .prepare(`SELECT id,
                     title,
                     price_sat AS priceSat,
                     created_at AS createdAt
              FROM listings
              ORDER BY id DESC
              LIMIT ? OFFSET ?`)
    .bind(limit, offset)
    .all();

  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM listings").all();
  const total = (totalRow.results?.[0] as any)?.c ?? 0;

  return NextResponse.json({ listings: results, total });
}

export async function POST(req: Request) {
  const db = getRequestContext().env.DB as D1Database;
  try {
    const body = (await req.json()) as { title?: unknown; price_sat?: unknown; priceSat?: unknown };
    const title = (body?.title ?? "").toString().trim();
    const priceSat = Number(body?.price_sat ?? body?.priceSat);

    if (!title || !Number.isFinite(priceSat) || priceSat < 0) {
      return NextResponse.json({ error: "title (string) and price_sat (number) required" }, { status: 400 });
    }

    const res = await db
      .prepare("INSERT INTO listings (title, price_sat) VALUES (?, ?)")
      .bind(title.slice(0, 120), Math.round(priceSat))
      .run();

    const id = (res as any).meta?.last_row_id ?? null;

    const row = await db
      .prepare(`SELECT id,
                       title,
                       price_sat AS priceSat,
                       created_at AS createdAt
                FROM listings WHERE id = ?`)
      .bind(id)
      .all();

    const listing = row.results?.[0] ?? null;
    return NextResponse.json({ listing, ok: true });
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
}
