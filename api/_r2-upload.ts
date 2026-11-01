/**
 * Shared, framework-agnostic core for authenticated image uploads to Cloudflare
 * R2. Used by both the Vercel serverless function (api/upload.ts, production)
 * and the Vite dev-server middleware (vite.config.ts, local `npm run dev`).
 *
 * The R2 secret keys live only on the server (process.env / .env, never a
 * VITE_ prefix) so they are never shipped to the browser. Each request must
 * carry a Firebase ID token; we verify it, then confirm the caller belongs to
 * the business by asking Firestore (with the caller's own token) for the
 * business document — Firestore rules only return it to members, so a 200
 * proves membership. Only then is the file streamed to R2 via the S3 API.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AwsClient } from 'aws4fetch';

export interface R2Env {
  projectId: string;
  bucket: string;
  endpoint: string; // https://<accountid>.r2.cloudflarestorage.com
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

export interface UploadResult {
  status: number;
  body: Record<string, unknown>;
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

/** Reads the R2 + Firebase config from an env map, or null if anything is missing. */
export function readR2Env(src: Record<string, string | undefined>): R2Env | null {
  const projectId = src.FIREBASE_PROJECT_ID || src.VITE_FIREBASE_PROJECT_ID || '';
  const bucket = src.CLOUDFLARE_R2_BUCKET_NAME || '';
  const endpoint = src.CLOUDFLARE_R2_ENDPOINT || '';
  const accessKeyId = src.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
  const secretAccessKey = src.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
  const publicBaseUrl = src.CLOUDFLARE_R2_PUBLIC_BASE_URL || '';
  if (!projectId || !bucket || !endpoint || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return null;
  }
  return { projectId, bucket, endpoint, accessKeyId, secretAccessKey, publicBaseUrl };
}

async function verifyFirebaseToken(token: string, projectId: string): Promise<void> {
  await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
}

/** Firestore rules only let members read the business document. */
async function isMember(token: string, projectId: string, businessId: string): Promise<boolean> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/businesses/${encodeURIComponent(businessId)}?mask.fieldPaths=name`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export async function processUpload(input: {
  env: R2Env | null;
  authHeader: string;
  businessId: string;
  kind: string;
  contentType: string;
  body: Uint8Array;
}): Promise<UploadResult> {
  const { env } = input;
  if (!env) {
    return { status: 500, body: { error: 'Image storage is not configured on the server.' } };
  }

  const token = input.authHeader.startsWith('Bearer ') ? input.authHeader.slice(7) : '';
  if (!token) return { status: 401, body: { error: 'Sign in required' } };
  try {
    await verifyFirebaseToken(token, env.projectId);
  } catch {
    return { status: 401, body: { error: 'Invalid or expired session' } };
  }

  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(input.businessId)) {
    return { status: 400, body: { error: 'Invalid business' } };
  }
  if (!ALLOWED_KINDS.has(input.kind)) {
    return { status: 400, body: { error: 'Invalid upload kind' } };
  }

  const ext = ALLOWED_TYPES[input.contentType];
  if (!ext) return { status: 415, body: { error: 'Only PNG, JPEG, WebP or GIF images are allowed' } };
  if (input.body.byteLength === 0) return { status: 400, body: { error: 'Empty file' } };
  if (input.body.byteLength > MAX_BYTES) return { status: 413, body: { error: 'Image must be 5 MB or smaller' } };

  if (!(await isMember(token, env.projectId, input.businessId))) {
    return { status: 403, body: { error: 'Not a member of this business' } };
  }

  const key = `businesses/${input.businessId}/${input.kind}/${crypto.randomUUID()}.${ext}`;
  const aws = new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    region: 'auto',
    service: 's3',
  });
  const putUrl = `${env.endpoint.replace(/\/+$/, '')}/${env.bucket}/${key}`;
  const res = await aws.fetch(putUrl, {
    method: 'PUT',
    body: input.body,
    headers: {
      'Content-Type': input.contentType,
      'Content-Length': String(input.body.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
  if (!res.ok) {
    return { status: 502, body: { error: `R2 upload failed (${res.status}).` } };
  }

  const base = env.publicBaseUrl.replace(/\/+$/, '');
  return { status: 200, body: { url: `${base}/${key}`, key } };
}
