const ALLOW = new Set([
  "https://bitsbarter.com",
  "https://www.bitsbarter.com",
  "https://YOUR-PAGES-SUBDOMAIN.pages.dev" // keep this during testing
]);

function cors(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOW.has(origin) ? origin : "https://bitsbarter.com";
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "vary": "Origin"
  };
}

export function onRequestOptions({ request }) {
  return new Response(null, { headers: cors(request) });
}

export async function onRequestGet({ env, request }) {
  const { results } = await env.DB.prepare(
    "SELECT id, title, price_sat, created_at FROM listings ORDER BY id DESC"
  ).all();
  return new Response(JSON.stringify(results), { headers: cors(request) });
}

export async function onRequestPost({ request, env }) {
  const headers = cors(request);
  try {
    const { title, price_sat } = await request.json();
    const t = (title ?? "").toString().trim();
    const p = Number(price_sat);
    if (!t || !Number.isFinite(p) || p < 0) {
      return new Response(JSON.stringify({ error: "title (string) and price_sat (number) required" }), { status: 400, headers });
    }
    const res = await env.DB.prepare(
      "INSERT INTO listings (title, price_sat) VALUES (?, ?)"
    ).bind(t.slice(0, 120), Math.round(p)).run();
    return new Response(JSON.stringify({ ok: true, id: res.meta?.last_row_id ?? null }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400, headers });
  }
}
