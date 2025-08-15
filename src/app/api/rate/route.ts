import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = process.env.COINGECKO_URL ?? "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cad";
    const r = await fetch(url, { next: { revalidate: 10 } });
    const j = (await r.json()) as { bitcoin?: { cad?: number } };
    const cad = j?.bitcoin?.cad ?? null;
    return NextResponse.json({ cad });
  } catch (e) {
    return NextResponse.json({ cad: null }, { status: 200 });
  }
}
