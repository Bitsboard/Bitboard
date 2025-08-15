// Force adapter to include async_hooks shim under Workers by referencing it explicitly
// This is harmless under nodejs_compat and helps avoid missing module errors in preview
import 'node:async_hooks';
export const runtime = "edge";

export async function GET() {
  return new Response("pong", { headers: { "content-type": "text/plain" } });
}


