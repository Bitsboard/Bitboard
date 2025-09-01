// Provide shim for async_hooks when bundling at the edge
import '@/shims/async_hooks';
export const runtime = "edge";

export async function GET() {
  return new Response("pong", { headers: { "content-type": "text/plain" } });
}


