/// <reference types="@cloudflare/workers-types" />

declare global {
    interface CloudflareEnv {
        DB: D1Database;
    }
}

export { };

// Type shim for dynamic import of @cloudflare/next-on-pages in build-time type checking
declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): { env: Record<string, unknown> };
}
