/**
 * Client for the R2 upload Worker (worker/src/index.ts).
 * R2 credentials never reach the browser; the Worker checks the caller's
 * Firebase session and business membership before storing the file.
 */

import { auth } from './firebase';

export type UploadKind = 'menu-item' | 'product' | 'service' | 'staff' | 'logo';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function isUploadConfigured(): boolean {
  return !!(import.meta.env.VITE_UPLOAD_API_URL || '').trim();
}

function endpoint(): string {
  return (import.meta.env.VITE_UPLOAD_API_URL || '').trim().replace(/\/+$/, '') + '/upload';
}

export async function uploadImage(
  businessId: string,
  kind: UploadKind,
  file: File
): Promise<{ url: string; key: string }> {
  if (!isUploadConfigured()) {
    throw new Error('Image uploads are not configured yet (VITE_UPLOAD_API_URL is empty).');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a PNG, JPEG, WebP or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again to upload images.');

  const token = await user.getIdToken();
  const params = new URLSearchParams({ businessId, kind });
  const res = await fetch(`${endpoint()}?${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type },
    body: file,
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; key?: string; error?: string };
  if (!res.ok || !body.url || !body.key) {
    throw new Error(body.error || `Upload failed (${res.status}).`);
  }
  return { url: body.url, key: body.key };
}
