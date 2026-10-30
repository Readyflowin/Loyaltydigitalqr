import React, { useState, useEffect } from 'react';
import {
  Plus,
  Award,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { mockGenericService } from '../../../services/mockGenericService';
import type {
  GenericServiceJobEvent,
  GenericServiceItem,
} from '../../../types/serviceBusiness';
import { mockLoyaltyService } from '../../../services/mockLoyaltyService';
import { mockBusinessService } from '../../../services/mockBusinessService';

interface GenericVisitViewProps {
  businessId: string;
}

export const GenericVisitView: React.FC<GenericVisitViewProps> = ({ businessId }) => {
  const [jobs, setJobs] = useState<GenericServiceJobEvent[]>([]);
  const [services, setServices] = useState<GenericServiceItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress'>('completed');
  const [staffPin] = useState('8831');
  const [error, setError] = useState<string | null>(null);

  const business = mockBusinessService.getBusinessById(businessId);
  const currencySymbol = business?.currency === 'INR' ? '₹' : '$';
  const customers = mockLoyaltyService.getCustomers(businessId);

  const loadData = () => {
    setJobs(mockGenericService.getJobs(businessId));
    setServices(mockGenericService.getServices(businessId));
  };

  useEffect(() => {
    loadData();
    const unsub = mockGenericService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [businessId]);

  const handleSelectService = (sId: string) => {
    setSelectedServiceId(sId);
    const svc = services.find((s) => s.id === sId);
    if (svc) {
      setAmountMajor((svc.price / 100).toFixed(2));
    }
  };

  const handleRecordJob = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) {
      setError('Please select a customer profile.');
      return;
    }

    const priceCents = Math.round(parseFloat(amountMajor) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setError('Please enter a valid amount charged.');
      return;
    }

    const res = mockGenericService.recordJob({
      businessId,
      serviceId: selectedServiceId,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phoneNumber,
      amountCharged: priceCents,
      notes,
      status,
      staffPin,
    });

    if (res.success) {
      setShowModal(false);
      setSelectedCustomerId('');
      setSelectedServiceId('');
      setAmountMajor('');
      setNotes('');
      loadData();
    } else {
      setError(res.error || 'Failed to record service job.');
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      j.customerName.toLowerCase().includes(q) ||
      j.serviceName.toLowerCase().includes(q) ||
      (j.notes && j.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" data-testid="generic-visits-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Service Activity & Job Terminal</h2>
          <p className="text-sm text-muted-foreground">
            Log completed repairs, consultations, or maintenance jobs and issue customer loyalty stamps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (services.length > 0) handleSelectService(services[0].id);
            setShowModal(true);
          }}
          data-testid="record-service-job-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Record Service Job</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by client or service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="service-jobs-table">
              <thead className="bg-muted/40 border-b border-border/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Service Performed</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Loyalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      No service jobs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      data-testid={`job-row-${job.id}`}
                      className="hover:bg-muted/30 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground">{job.customerName}</div>
                        {job.customerPhone && (
                          <div className="text-[11px] text-muted-foreground">
                            {job.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{job.serviceName}</div>
                        {job.notes && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {job.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        {currencySymbol}{(job.amountCharged / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(job.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {job.loyaltyIssued ? (
                          <span className="flex items-center gap-1 text-primary font-semibold text-[11px]">
                            <Award className="w-3.5 h-3.5" />
                            <span>Stamp Issued</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Job Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="record-job-modal"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-bold text-foreground">Record Service Job</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer Profile *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="job-customer-select"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phoneNumber || c.email || 'No contact'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Service Offering *
                </label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => handleSelectService(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="job-service-select"
                >
                  <option value="">-- Select Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {currencySymbol}{(s.price / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Amount Charged ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amountMajor}
                    onChange={(e) => setAmountMajor(e.target.value)}
                    placeholder="50.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="job-amount-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Job Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'completed' | 'in_progress')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Work Notes / Serial Number
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on replacement parts, diagnostic findings, warranty..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="job-notes-input"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-border/80 text-foreground text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCustomerId || !selectedServiceId}
                  data-testid="submit-job-btn"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  Record Job & Stamp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
