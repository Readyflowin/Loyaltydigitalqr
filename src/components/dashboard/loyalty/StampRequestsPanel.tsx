import React, { useEffect, useState } from 'react';
import { Check, X, BellRing, Loader2 } from 'lucide-react';
import type { StampRequest } from '../../../types/loyalty';
import { stampRequestService } from '../../../services/stampRequestService';

interface StampRequestsPanelProps {
  businessId: string;
  locationId?: string;
  /** Called after a stamp is issued, so the parent can refresh its derived data. */
  onApproved?: () => void;
}

/**
 * Live queue of customers asking for a stamp at the counter. Staff approve
 * (which issues the stamp) or decline. Hidden entirely when nothing is pending.
 */
export const StampRequestsPanel: React.FC<StampRequestsPanelProps> = ({ businessId, locationId, onApproved }) => {
  const [requests, setRequests] = useState<StampRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = stampRequestService.subscribePending(businessId, setRequests);
    return unsub;
  }, [businessId]);

  if (requests.length === 0) return null;

  const handleApprove = async (request: StampRequest) => {
    setBusyId(request.id);
    const res = await stampRequestService.approve({ businessId, request, locationId });
    setBusyId(null);
    if (res.success) onApproved?.();
    else if (res.error) window.alert(res.error);
  };

  const handleDecline = async (request: StampRequest) => {
    setBusyId(request.id);
    await stampRequestService.decline(businessId, request);
    setBusyId(null);
  };

  return (
    <div
      data-testid="stamp-requests-panel"
      className="rounded-3xl bg-card border-2 border-[#3027F5] dark:border-[#E4C174] shadow-md overflow-hidden animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#3027F5]/10 dark:bg-[#E4C174]/15 border-b border-[#3027F5]/20 dark:border-[#E4C174]/20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#3027F5] dark:bg-[#E4C174] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3027F5] dark:bg-[#E4C174]" />
          </span>
          <BellRing className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174]" />
          <h3 className="font-heading font-black text-sm text-foreground">
            Stamp requests waiting ({requests.length})
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:block">Customers at your counter</span>
      </div>

      <div className="divide-y divide-black/5 dark:divide-white/5">
        {requests.map((req) => {
          const busy = busyId === req.id;
          const mins = Math.max(0, Math.round((new Date().getTime() - new Date(req.requestedAt).getTime()) / 60000));
          return (
            <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <div className="font-heading font-bold text-sm text-foreground truncate">{req.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  {req.source === 'qr_scan' ? 'Scanned counter QR' : 'Tapped request'} ·{' '}
                  {mins === 0 ? 'just now' : `${mins} min ago`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  data-testid={`decline-request-${req.id}`}
                  onClick={() => handleDecline(req)}
                  disabled={busy}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer disabled:opacity-50"
                  title="Decline"
                  aria-label={`Decline stamp for ${req.customerName}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid={`approve-request-${req.id}`}
                  onClick={() => handleApprove(req)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Approve +1</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
