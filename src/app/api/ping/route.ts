export const runtime = "edge";

export async function GET() {
  return new Response(JSON.stringify({ ok: true, msg: "pong" }), {
    headers: { "content-type": "application/json" },
  });
}


