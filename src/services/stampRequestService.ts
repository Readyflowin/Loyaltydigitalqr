/**
 * Counter stamp-approval requests.
 *
 * When a returning customer scans the counter QR (or taps "Request a stamp" on
 * their live card), they create a pending request at
 *   businesses/{bizId}/stampRequests/{id}
 * The document id is unguessable, so the customer can watch their own request
 * without being able to list anyone else's. A signed-in staff member sees the
 * pending queue in the dashboard and approves it — which issues the stamp through
 * loyaltyService — or declines it.
 *
 * This collection is intentionally kept out of bizStore: the customer writes it
 * directly (unauthenticated) and the owner subscribes with a plain onSnapshot,
 * so bizStore's array write-back can never clobber a request created between
 * snapshots.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { newId } from '../lib/ids';
import { actorLabel } from '../lib/actor';
import type { StampRequest } from '../types/loyalty';
import { loyaltyService } from './loyaltyService';

/** Unguessable 32-char id, matching the pattern public tracking links rely on. */
function requestId(): string {
  return `${newId()}${newId()}`;
}

class StampRequestService {
  /**
   * Customer-side: create a pending stamp request. Runs unauthenticated, so it
   * writes directly to Firestore (the security rules validate it).
   */
  async createRequest(
    businessId: string,
    input: { memberId: string; customerName: string; source: StampRequest['source'] }
  ): Promise<{ success: true; request: StampRequest } | { success: false; error: string }> {
    const id = requestId();
    const request: StampRequest = {
      id,
      businessId,
      memberId: input.memberId,
      customerName: input.customerName,
      status: 'pending',
      source: input.source,
      requestedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'businesses', businessId, 'stampRequests', id), request);
      return { success: true, request };
    } catch {
      return { success: false, error: 'Could not reach the counter. Please show your card to staff.' };
    }
  }

  /** Customer-side: watch one request's status by its id. */
  watchRequest(
    businessId: string,
    id: string,
    cb: (request: StampRequest | null) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'businesses', businessId, 'stampRequests', id),
      (snap) => cb(snap.exists() ? (snap.data() as StampRequest) : null),
      () => cb(null)
    );
  }

  /**
   * Owner-side: live feed of pending requests. Sorted oldest-first in memory so
   * no composite index is needed.
   */
  subscribePending(businessId: string, cb: (requests: StampRequest[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'businesses', businessId, 'stampRequests'),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as StampRequest);
        rows.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
        cb(rows);
      },
      () => cb([])
    );
  }

  /**
   * Owner-side: approve a request. Issues one stamp through loyaltyService (which
   * handles reward unlocking and the audit trail), then stamps the request as
   * resolved so the customer's card shows the result live.
   */
  async approve(params: {
    businessId: string;
    request: StampRequest;
    locationId?: string;
    staffPin?: string;
  }): Promise<{ success: boolean; error?: string; rewardUnlocked?: boolean }> {
    const { businessId, request, locationId, staffPin } = params;
    const result = loyaltyService.issueStamp({
      businessId,
      locationId,
      customerId: request.memberId,
      staffPin,
      idempotencyKey: `req_${request.id}`,
    });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    try {
      await updateDoc(doc(db, 'businesses', businessId, 'stampRequests', request.id), {
        status: 'approved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: actorLabel('Counter Staff'),
        resultBalance: result.updatedBalance ?? null,
        rewardUnlocked: !!result.rewardUnlocked,
      });
    } catch {
      // The stamp was issued; the request doc just could not be updated. The
      // customer's card still reflects the new stamp via its memberCard snapshot.
    }
    return { success: true, rewardUnlocked: result.rewardUnlocked };
  }

  /** Owner-side: decline a request without issuing a stamp. */
  async decline(businessId: string, request: StampRequest): Promise<void> {
    try {
      await updateDoc(doc(db, 'businesses', businessId, 'stampRequests', request.id), {
        status: 'declined',
        resolvedAt: new Date().toISOString(),
        resolvedBy: actorLabel('Counter Staff'),
      });
    } catch {
      // ignore — the pending row simply stays until it can be resolved
    }
  }
}

export const stampRequestService = new StampRequestService();
