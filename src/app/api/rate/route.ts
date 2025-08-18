import '../../../shims/async_hooks';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET() {
  try {
    // Try multiple providers to improve reliability on edge runtimes
    // 1) CoinGecko
    const cgUrl = process.env.COINGECKO_URL ?? "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cad";
    try {
      const r = await fetch(cgUrl, { next: { revalidate: 15 } });
      if (r.ok) {
        const j = (await r.json()) as { bitcoin?: { cad?: number } };
        const cad = j?.bitcoin?.cad ?? null;
        if (cad && Number.isFinite(cad)) return NextResponse.json({ cad });
      }
    } catch {}

    // 2) Coinbase
    try {
      const r2 = await fetch("https://api.coinbase.com/v2/prices/BTC-CAD/spot", { headers: { 'Accept': 'application/json' }, next: { revalidate: 15 } });
      if (r2.ok) {
        const j2 = (await r2.json()) as { data?: { amount?: string } };
        const cad2 = j2?.data?.amount ? Number(j2.data.amount) : null;
        if (cad2 && Number.isFinite(cad2)) return NextResponse.json({ cad: cad2 });
      }
    } catch {}

    // 3) Coindesk
    try {
      const r3 = await fetch("https://api.coindesk.com/v1/bpi/currentprice/CAD.json", { headers: { 'Accept': 'application/json' }, next: { revalidate: 15 } });
      if (r3.ok) {
        const j3 = (await r3.json()) as { bpi?: { CAD?: { rate_float?: number } } };
        const cad3 = j3?.bpi?.CAD?.rate_float ?? null;
        if (cad3 && Number.isFinite(cad3)) return NextResponse.json({ cad: cad3 });
      }
    } catch {}

    return NextResponse.json({ cad: null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ cad: null }, { status: 200 });
  }
}
