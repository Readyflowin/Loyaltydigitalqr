import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  RefreshCw,
  XCircle,
  Lock,
} from 'lucide-react';
import { gymService } from '../../../services/gymService';
import type {
  GymMemberRecord,
  GymCheckInEvent,
} from '../../../types/gym';

interface GymCheckInViewProps {
  businessId: string;
}

export const GymCheckInView: React.FC<GymCheckInViewProps> = ({ businessId }) => {
  const [members, setMembers] = useState<GymMemberRecord[]>([]);
  const [checkIns, setCheckIns] = useState<GymCheckInEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<GymMemberRecord | null>(null);
  const [staffPin, setStaffPin] = useState('8831');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; stamps?: boolean } | null>(null);

  const loadData = () => {
    const mems = gymService.getMembers(businessId);
    const logs = gymService.getCheckIns(businessId);
    setMembers(mems);
    setCheckIns(logs);

    if (selectedMember) {
      const refreshed = mems.find((m) => m.id === selectedMember.id) || null;
      setSelectedMember(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = gymService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  // Search filtering
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.customerName.toLowerCase().includes(q) ||
        (m.customerPhone && m.customerPhone.includes(q)) ||
        (m.customerEmail && m.customerEmail.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q) ||
        m.planName.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // Handle select member
  const handleSelectMember = (member: GymMemberRecord) => {
    setSelectedMember(member);
    setMessage(null);
  };

  // Perform check-in
  const handleCheckIn = () => {
    if (!selectedMember) return;
    setSubmitting(true);
    setMessage(null);

    const result = gymService.recordCheckIn(businessId, {
      businessId,
      memberId: selectedMember.id,
      staffPin: staffPin.trim() || undefined,
      checkInSource: 'front_desk',
    });

    setSubmitting(false);

    if (result.success && result.checkIn) {
      setMessage({
        type: 'success',
        text: `Check-in recorded for ${result.checkIn.memberName} (${result.checkIn.planName}).${
          result.remainingVisits !== undefined ? ` Remaining visits: ${result.remainingVisits}.` : ''
        }`,
        stamps: result.checkIn.loyaltyIssued,
      });
      loadData();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to complete check-in.',
      });
    }
  };

  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return checkIns.filter((c) => c.timestamp.startsWith(todayStr)).length;
  }, [checkIns]);

  return (
    <div className="space-y-6" data-testid="gym-checkin-view">
      {/* Top Header & Fast Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Member Visit Terminal</h2>
          <p className="text-sm text-muted-foreground">
            Fast member check-ins, remaining visit tracking, duplicate entry protection and loyalty stamp issuance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-semibold">
            <UserCheck className="w-4 h-4" />
            <span>Today's Check-ins: {todayCount}</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Verify (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Member Search Bar */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-foreground">
              Search Member by Name, Phone or ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g., Sarah Miller, +1 555-0192, mem_sarah..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/80 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                data-testid="checkin-search-input"
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

            {/* Quick Filter Search Results dropdown/list */}
            {searchQuery.trim().length > 0 && (
              <div className="border border-border/60 rounded-lg max-h-52 overflow-y-auto divide-y divide-border/40 bg-background">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No matching members found.
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMember(m)}
                      data-testid={`member-search-result-${m.id}`}
                      className={`w-full text-left p-3 flex items-center justify-between hover:bg-muted/50 transition text-sm ${
                        selectedMember?.id === m.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{m.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.planName} • {m.customerPhone || m.customerEmail || 'No contact'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                            m.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : m.status === 'expired'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {m.status}
                        </span>
                        {m.remainingVisits !== undefined && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {m.remainingVisits} visits left
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Member Detail & Action Card */}
          {selectedMember ? (
            <div
              className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-5"
              data-testid="selected-member-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Selected Member
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">
                    {selectedMember.customerName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Member ID: <span className="font-mono">{selectedMember.id}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                    selectedMember.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : selectedMember.status === 'expired'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {selectedMember.status}
                </span>
              </div>

              {/* Status details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/40 border border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Plan</span>
                  <span className="font-semibold text-foreground">{selectedMember.planName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Plan Type</span>
                  <span className="font-semibold text-foreground capitalize">
                    {selectedMember.planType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Visits Remaining</span>
                  <span className="font-semibold text-foreground">
                    {selectedMember.remainingVisits !== undefined
                      ? `${selectedMember.remainingVisits} / ${selectedMember.totalVisitsAllowed || selectedMember.remainingVisits}`
                      : 'Unlimited'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valid Until</span>
                  <span className="font-semibold text-foreground">
                    {selectedMember.endDate || 'Ongoing / No Expiry'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Last Check-In</span>
                  <span className="font-semibold text-foreground">
                    {selectedMember.lastCheckInAt
                      ? new Date(selectedMember.lastCheckInAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Contact</span>
                  <span className="font-semibold text-foreground truncate">
                    {selectedMember.customerPhone || selectedMember.customerEmail || '—'}
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
                  onClick={handleCheckIn}
                  data-testid="confirm-checkin-btn"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Confirm Check-In</span>
                </button>
              </div>

              {/* Status Message / Banner */}
              {message && (
                <div
                  className={`p-3.5 rounded-lg border text-sm flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                  data-testid={message.type === 'success' ? 'checkin-success-banner' : 'checkin-error-banner'}
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
                        <span>Loyalty visit stamp issued to customer profile.</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-10 text-center bg-card/40">
              <UserCheck className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Member Selected</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Search for an active member using the search bar above or pick an active member from the roster to check them in.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Check-in Feed & Terminal Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Today's Check-in Log</span>
              </h3>
              <span className="text-xs text-muted-foreground">{checkIns.length} recorded</span>
            </div>

            <div
              className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
              data-testid="recent-checkins-list"
            >
              {checkIns.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No check-ins recorded yet today.
                </div>
              ) : (
                checkIns.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`checkin-row-${item.id}`}
                    className="p-3 rounded-lg border border-border/60 bg-background hover:border-border transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">
                        {item.memberName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.planName}</span>
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
                          <span className="text-rose-500 font-semibold">0 visits left (Pass expired)</span>
                        ) : (
                          <span>{item.remainingVisitsAfter} visits remaining</span>
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
