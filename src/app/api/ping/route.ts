export const runtime = "edge";

export async function GET() {
  return new Response("pong", { headers: { "content-type": "text/plain" } });
}


