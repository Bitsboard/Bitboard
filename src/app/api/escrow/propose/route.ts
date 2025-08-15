import { NextResponse } from "next/server";
import { createLightningBackend, calculateEscrowFee, calculateTotalAmount } from "@/lib/escrow";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { amountSats } = (await req.json()) as { amountSats?: number };

    if (!amountSats || amountSats <= 0) {
      return NextResponse.json({ error: "amountSats required" }, { status: 400 });
    }

    // Create Lightning backend (defaults to mock for now)
    const lightningBackend = createLightningBackend("mock", {});

    // Calculate fees and total
    const feeSats = calculateEscrowFee(amountSats);
    const totalSats = calculateTotalAmount(amountSats);

    // Create hold invoice
    const holdInvoice = await lightningBackend.createHoldInvoice(
      totalSats,
      `Escrow proposal for ${amountSats} sats`
    );

    return NextResponse.json({
      success: true,
      data: {
        amountSats,
        feeSats,
        totalSats,
        holdInvoice,
      }
    });
  } catch (error) {
    console.error("Escrow proposal error:", error);
    return NextResponse.json(
      { error: "Failed to create escrow proposal" },
      { status: 500 }
    );
  }
}
