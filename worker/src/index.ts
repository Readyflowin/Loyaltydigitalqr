/**
 * Authenticated image upload endpoint backed by Cloudflare R2.
 *
 * The browser never sees R2 credentials. Each request must carry a Firebase
 * ID token; the Worker verifies it and then asks Firestore (with the caller's
 * own token) for the business document. Firestore rules only return that
 * document to members, so a 200 proves the caller belongs to the business.
 *
 * POST /upload?businessId=<id>&kind=<menu-item|product|service|staff|logo>
 *   Authorization: Bearer <Firebase ID token>
 *   Content-Type: image/png | image/jpeg | image/webp | image/gif
 *   body: raw file bytes (max 5 MB)
 * -> 200 { url, key }
 *
 * DELETE /upload?businessId=<id>&key=<key returned by upload>
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

interface Env {
  BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  PUBLIC_BASE_URL: string;
  ALLOWED_ORIGINS: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_KINDS = new Set(['menu-item', 'product', 'service', 'staff', 'logo']);

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function verifyFirebaseToken(token: string, projectId: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload.sub) throw new Error('Token has no subject');
  return payload.sub;
}

/** Firestore rules only let members read the business document. */
async function isMember(token: string, projectId: string, businessId: string): Promise<boolean> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/businesses/${encodeURIComponent(businessId)}?mask.fieldPaths=name`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== '/upload') return json({ error: 'Not found' }, 404, cors);

    const origin = request.headers.get('Origin') || '';
    if (!env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, cors);
    }

    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Sign in required' }, 401, cors);

    try {
      await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    } catch {
      return json({ error: 'Invalid or expired session' }, 401, cors);
    }

    const businessId = url.searchParams.get('businessId') || '';
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(businessId)) return json({ error: 'Invalid business' }, 400, cors);
    if (!(await isMember(token, env.FIREBASE_PROJECT_ID, businessId))) {
      return json({ error: 'Not a member of this business' }, 403, cors);
    }

    if (request.method === 'DELETE') {
      const key = url.searchParams.get('key') || '';
      if (!key.startsWith(`businesses/${businessId}/`) || key.includes('..')) {
        return json({ error: 'Invalid key' }, 400, cors);
      }
      await env.BUCKET.delete(key);
      return json({ ok: true }, 200, cors);
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    const kind = url.searchParams.get('kind') || '';
    if (!ALLOWED_KINDS.has(kind)) return json({ error: 'Invalid upload kind' }, 400, cors);

    const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim();
    const ext = ALLOWED_TYPES[contentType];
    if (!ext) return json({ error: 'Only PNG, JPEG, WebP or GIF images are allowed' }, 415, cors);

    const declared = Number(request.headers.get('Content-Length') || '0');
    if (declared > MAX_BYTES) return json({ error: 'Image must be 5 MB or smaller' }, 413, cors);

    const body = await request.arrayBuffer();
    if (body.byteLength === 0) return json({ error: 'Empty file' }, 400, cors);
    if (body.byteLength > MAX_BYTES) return json({ error: 'Image must be 5 MB or smaller' }, 413, cors);

    const key = `businesses/${businessId}/${kind}/${crypto.randomUUID()}.${ext}`;
    await env.BUCKET.put(key, body, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
    });

    const base = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
    return json({ url: `${base}/${key}`, key }, 200, cors);
  },
};
