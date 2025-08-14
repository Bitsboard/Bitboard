export type HoldInvoice = { invoice: string, amountSats: number, feeSats: number };
export async function createHoldInvoice(amountSats: number, feeBps = 100): Promise<HoldInvoice> {
  const feeSats = Math.ceil((amountSats * feeBps) / 10000);
  const total = amountSats + feeSats;
  if (process.env.LN_BACKEND === "mock" || !process.env.LN_BACKEND) {
    return { invoice: `lnbchold${total}n1p${Math.random().toString(36).slice(2,10)}...`, amountSats, feeSats };
  }
  // TODO: implement adapters for lnd, cln, lnbits based on env vars.
  return { invoice: `lnbchold${total}n1p${Math.random().toString(36).slice(2,10)}...`, amountSats, feeSats };
}
