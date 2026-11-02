/**
 * Vercel serverless function: POST /api/admin
 *   body: { action: 'login' | 'businesses' | 'setSubscription' | 'getSiteConfig' | 'setSiteConfig', ... }
 *   Authorization: Bearer <admin session token>   (every action except 'login')
 *
 * All admin secrets (ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_JWT_SECRET) and the
 * Firebase service account (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY /
 * FIREBASE_PROJECT_ID) come from the Vercel project's environment variables and
 * are never exposed to the browser. See api/_admin-core.ts for the logic.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminRequest, readAdminEnv } from './_admin-core';

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: IncomingMessage & { method?: string },
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

  const env = readAdminEnv(process.env as Record<string, string | undefined>);
  if (!env) {
    send(500, { error: 'Admin API is not configured (ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_JWT_SECRET).' });
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  let payload: Record<string, unknown> = {};
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    send(400, { error: 'Invalid JSON body' });
    return;
  }

  try {
    const result = await handleAdminRequest({
      env,
      action: typeof payload.action === 'string' ? payload.action : '',
      body: payload,
      authHeader: (req.headers['authorization'] as string) || '',
    });
    send(result.status, result.body);
  } catch (err) {
    send(500, { error: err instanceof Error ? err.message : 'Admin request failed' });
  }
}
