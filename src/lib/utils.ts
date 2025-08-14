export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
export function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}
export function satsToFiat(sats: number, btcCad: number) {
  return (sats / 1e8) * btcCad;
}
export function formatFiat(n: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}
export function formatBTCFromSats(sats: number) {
  const btc = sats / 1e8;
  return btc.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
