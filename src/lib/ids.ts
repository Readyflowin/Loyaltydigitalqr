/**
 * Collision-resistant, unguessable identifiers.
 * Used for every Firestore document id. Public tracking links rely on
 * these being unguessable, so never replace with Date.now()/Math.random().
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function randomString(length = 16, alphabet = ALPHABET): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** 16 chars of base36 (~82 bits of entropy). */
export function newId(): string {
  return randomString(16);
}

/** Short human-readable code for counter staff, e.g. "K7Q2" (no 0/O/1/I). */
export function shortCode(length = 4): string {
  return randomString(length, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
}
