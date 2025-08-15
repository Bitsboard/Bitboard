// Provide shim for async_hooks when bundling at the edge
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../../shims/async_hooks';
export const runtime = "edge";

export async function GET() {
  return new Response("pong", { headers: { "content-type": "text/plain" } });
}


