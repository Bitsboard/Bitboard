// Edge-compatible JWT utils using WebCrypto

export type JwtPayload = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  exp: number;
  uid?: string;
  username?: string | null;
  sso?: string;
};

function base64urlEncode(data: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    bytes = data;
  } else {
    bytes = new Uint8Array(data);
  }
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecodeToBytes(data: string): Uint8Array {
  const pad = data.length % 4 === 0 ? '' : '='.repeat(4 - (data.length % 4));
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signJwtHS256(payload: JwtPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = base64urlEncode(sig);
  return `${data}.${sigB64}`;
}

export async function verifyJwtHS256(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const key = await importHmacKey(secret);
  const sigBytes = base64urlDecodeToBytes(sigB64);
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes.buffer as ArrayBuffer, new TextEncoder().encode(data));
  if (!ok) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(base64urlDecodeToBytes(payloadB64))) as JwtPayload;
    if (typeof json.exp === 'number' && json.exp * 1000 < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '';
  if (!secret) throw new Error('Missing auth secret (NEXTAUTH_SECRET or AUTH_SECRET)');
  return secret;
}

export function createCookie(name: string, value: string, opts: { maxAgeSec?: number; httpOnly?: boolean; path?: string } = {}): string {
  const attrs = [
    `${name}=${value}`,
    `Path=${opts.path ?? '/'}`,
    'SameSite=Lax',
    'Secure',
  ];
  if (opts.httpOnly !== false) attrs.push('HttpOnly');
  if (opts.maxAgeSec) attrs.push(`Max-Age=${opts.maxAgeSec}`);
  return attrs.join('; ');
}

export function deleteCookie(name: string): string {
  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure; HttpOnly`;
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}

export function randomUrlSafeString(bytesLength = 32): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}


