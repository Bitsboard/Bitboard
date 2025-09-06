export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  return new Response(JSON.stringify({
    hasCode: !!code,
    hasState: !!state,
    code: code,
    state: state,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
