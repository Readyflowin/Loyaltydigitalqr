import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  RefreshCw,
  XCircle,
  Lock,
} from 'lucide-react';
import { carWashService } from '../../../services/carWashService';
import type {
  CarWashCustomerPass,
  CarWashVisitEvent,
} from '../../../types/carwash';

interface CarWashVisitsViewProps {
  businessId: string;
}

export const CarWashVisitsView: React.FC<CarWashVisitsViewProps> = ({ businessId }) => {
  const [passes, setPasses] = useState<CarWashCustomerPass[]>([]);
  const [visits, setVisits] = useState<CarWashVisitEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPass, setSelectedPass] = useState<CarWashCustomerPass | null>(null);
  const [staffPin, setStaffPin] = useState('8831');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    stamps?: boolean;
  } | null>(null);

  const loadData = () => {
    const p = carWashService.getPasses(businessId);
    const v = carWashService.getVisits(businessId);
    setPasses(p);
    setVisits(v);

    if (selectedPass) {
      const refreshed = p.find((x) => x.id === selectedPass.id) || null;
      setSelectedPass(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = carWashService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  const filteredPasses = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return passes.filter(
      (p) =>
        p.customerName.toLowerCase().includes(q) ||
        (p.vehiclePlate && p.vehiclePlate.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.includes(q)) ||
        p.bundleName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [passes, searchQuery]);

  const handleSelectPass = (pass: CarWashCustomerPass) => {
    setSelectedPass(pass);
    setMessage(null);
  };

  const handleConfirmWash = () => {
    if (!selectedPass) return;
    setSubmitting(true);
    setMessage(null);

    const result = carWashService.recordWashVisit(businessId, {
      passId: selectedPass.id,
      staffPin: staffPin.trim() || undefined,
      vehiclePlate: selectedPass.vehiclePlate,
    });

    setSubmitting(false);

    if (result.success && result.visit) {
      setMessage({
        type: 'success',
        text: `Wash recorded for ${result.visit.customerName} (${result.visit.serviceOrBundleName}).${
          result.remainingVisits !== undefined
            ? ` Remaining washes: ${result.remainingVisits}.`
            : ''
        }`,
        stamps: result.visit.loyaltyIssued,
      });
      loadData();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to record wash visit.',
      });
    }
  };

  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return visits.filter((v) => v.timestamp.startsWith(todayStr)).length;
  }, [visits]);

  return (
    <div className="space-y-6" data-testid="carwash-visits-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tunnel Check-In & Wash Redemption</h2>
          <p className="text-sm text-muted-foreground">
            Redeem prepaid wash passes, log wash bay entries, and issue customer loyalty stamps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-semibold">
            <Car className="w-4 h-4" />
            <span>Today's Washes: {todayCount}</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Verify Pass (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pass Search Bar */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-foreground">
              Search by License Plate, Customer Name, or Pass ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g., CA-7X9821, David Miller, pass_david..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/80 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                data-testid="wash-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="border border-border/60 rounded-lg max-h-52 overflow-y-auto divide-y divide-border/40 bg-background">
                {filteredPasses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No matching wash passes found.
                  </div>
                ) : (
                  filteredPasses.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPass(p)}
                      data-testid={`pass-search-result-${p.id}`}
                      className={`w-full text-left p-3 flex items-center justify-between hover:bg-muted/50 transition text-sm ${
                        selectedPass?.id === p.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{p.customerName}</span>
                          {p.vehiclePlate && (
                            <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-muted text-foreground border border-border/40">
                              {p.vehiclePlate}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.bundleName}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                            p.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : p.status === 'exhausted'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.remainingVisits !== undefined && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.remainingVisits} washes left
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Pass Details & Action */}
          {selectedPass ? (
            <div
              className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-5"
              data-testid="selected-pass-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Wash Pass Selected
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">
                    {selectedPass.customerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPass.vehiclePlate && (
                      <span className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-xs font-bold border border-border/60">
                        {selectedPass.vehiclePlate}
                      </span>
                    )}
                    {selectedPass.vehicleMakeModel && (
                      <span className="text-xs text-muted-foreground">
                        {selectedPass.vehicleMakeModel}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                    selectedPass.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : selectedPass.status === 'exhausted'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {selectedPass.status}
                </span>
              </div>

              {/* Status details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/40 border border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Package</span>
                  <span className="font-semibold text-foreground">{selectedPass.bundleName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Pass Type</span>
                  <span className="font-semibold text-foreground capitalize">
                    {selectedPass.bundleType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Remaining Washes</span>
                  <span className="font-semibold text-foreground">
                    {selectedPass.remainingVisits !== undefined
                      ? `${selectedPass.remainingVisits} / ${selectedPass.totalVisits || selectedPass.remainingVisits}`
                      : 'Unlimited'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valid Until</span>
                  <span className="font-semibold text-foreground">
                    {selectedPass.endDate || 'No Expiry'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Last Wash</span>
                  <span className="font-semibold text-foreground">
                    {selectedPass.lastRedeemedAt
                      ? new Date(selectedPass.lastRedeemedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Customer Phone</span>
                  <span className="font-semibold text-foreground">
                    {selectedPass.customerPhone || '—'}
                  </span>
                </div>
              </div>

              {/* Staff PIN & Action Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative w-full sm:w-36">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    maxLength={6}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="Staff PIN"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmWash}
                  data-testid="confirm-wash-btn"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Car className="w-4 h-4" />
                  )}
                  <span>Redeem & Record Wash</span>
                </button>
              </div>

              {/* Banner notifications */}
              {message && (
                <div
                  className={`p-3.5 rounded-lg border text-sm flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                  data-testid={message.type === 'success' ? 'wash-success-banner' : 'wash-error-banner'}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{message.text}</p>
                    {message.stamps && (
                      <p className="text-xs mt-1 flex items-center gap-1.5 text-primary">
                        <Award className="w-3.5 h-3.5" />
                        <span>Loyalty visit stamp issued to driver profile.</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-10 text-center bg-card/40">
              <Car className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Wash Pass Selected</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Search for an active pass by license plate or driver name above to authorize entry into the wash bay.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Today's Wash Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Today's Wash Activity</span>
              </h3>
              <span className="text-xs text-muted-foreground">{visits.length} recorded</span>
            </div>

            <div
              className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
              data-testid="recent-washes-list"
            >
              {visits.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No washes recorded yet today.
                </div>
              ) : (
                visits.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`wash-row-${item.id}`}
                    className="p-3 rounded-lg border border-border/60 bg-background hover:border-border transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {item.customerName}
                        </span>
                        {item.vehiclePlate && (
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-muted text-foreground border border-border/40">
                            {item.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.serviceOrBundleName}</span>
                      {item.loyaltyIssued && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Award className="w-3 h-3" />
                          <span>Stamp Issued</span>
                        </span>
                      )}
                    </div>

                    {item.remainingVisitsAfter !== undefined && (
                      <div className="text-[11px] text-muted-foreground font-medium pt-0.5">
                        {item.remainingVisitsAfter === 0 ? (
                          <span className="text-rose-500 font-semibold">
                            0 washes left (Pass exhausted)
                          </span>
                        ) : (
                          <span>{item.remainingVisitsAfter} washes remaining</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
