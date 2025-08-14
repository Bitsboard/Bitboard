import { NextResponse } from "next/server";
import { createHoldInvoice } from "@/lib/escrow";

export async function POST(req: Request) {
  const { amountSats } = await req.json();
  if (!amountSats || amountSats <= 0) return NextResponse.json({ error: "amountSats required" }, { status: 400 });
  const hold = await createHoldInvoice(amountSats);
  return NextResponse.json(hold);
}
