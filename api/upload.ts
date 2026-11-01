/**
 * Vercel serverless function: POST /api/upload?businessId=<id>&kind=<kind>
 *   Authorization: Bearer <Firebase ID token>
 *   Content-Type: image/png | image/jpeg | image/webp | image/gif
 *   body: raw image bytes (max 5 MB)
 * -> 200 { url, key }
 *
 * The R2 credentials and Firebase project id come from the Vercel project's
 * environment variables (CLOUDFLARE_R2_* and VITE_FIREBASE_PROJECT_ID /
 * FIREBASE_PROJECT_ID). See api/_r2-upload.ts for the shared logic.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { processUpload, readR2Env } from './_r2-upload';

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: IncomingMessage & { method?: string; url?: string },
  res: ServerResponse
): Promise<void> {
  const send = (status: number, body: Record<string, unknown>) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };

  if (req.method !== 'POST') {
    send(405, { error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url || '', 'http://localhost');
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);

  const result = await processUpload({
    env: readR2Env(process.env as Record<string, string | undefined>),
    authHeader: (req.headers['authorization'] as string) || '',
    businessId: url.searchParams.get('businessId') || '',
    kind: url.searchParams.get('kind') || '',
    contentType: ((req.headers['content-type'] as string) || '').split(';')[0].trim(),
    body: new Uint8Array(Buffer.concat(chunks)),
  });

  send(result.status, result.body);
}
