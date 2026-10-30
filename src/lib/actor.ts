import { authService } from '../services/authService';

/** Name recorded in audit trails: the signed-in staff member (never a PIN). */
export function actorLabel(fallback = 'Staff'): string {
  return authService.getCurrentUser()?.displayName || fallback;
}
