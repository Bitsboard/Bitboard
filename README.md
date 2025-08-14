# Bitboard — BTC-denominated local classifieds

This is a Next.js 14 + Prisma starter implementing the **Bitboard** concept we prototyped in canvas:
- Listings in **sats or BTC**, always showing a **CAD estimate** (via `/api/rate` CoinGecko).
- **Goods & Services** with Selling / Looking For types.
- In-app chat + **Lightning escrow** (hold invoice) — mocked adapter with clear TODOs.
- Dark mode, compact list/grid, minimal logo & tagline split line ("with **better money.**").

## Quickstart

```bash
pnpm i # or npm/yarn
cp .env.example .env
# set DATABASE_URL to a Postgres instance (Supabase/Neon/local)
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm dev
```

Open http://localhost:3000

## Tech choices

- **Next.js 14 (App Router)** + Tailwind
- **Prisma** (Postgres)
- API routes for listings, chat (stubs), BTC/CAD rate, and escrow proposal
- Theme via `next-themes`

## Escrow

`src/lib/escrow.ts` exposes `createHoldInvoice(amountSats, feeBps?)`.
It is **mocked** now. Wire one of:
- **LND**: use gRPC; create hold invoices and check settle/refund.
- **Core Lightning**: via cln-rest plugin.
- **LNbits**: create hold invoices via API.

Set `LN_BACKEND` and the associated env vars; replace the TODOs.

## Next steps

- Auth (magic link) + user handles
- Real chat (WebSocket/Pusher/Ably/Supabase Realtime)
- Listing creation & moderation, report/ban
- Escrow state machine + webhooks to mark FUNDED/RELEASED/REFUNDED
- Reputation events & dispute flow
- Saved searches & notifications
- Deploy (Vercel) + DB (Neon/Supabase) + Secrets
- Terms, privacy, and prohibited items policy pages
