import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import type { CustomerRecord, LoyaltyProgramConfig } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';

interface StampIssuanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  locationId?: string;
  defaultStaffPin: string;
  program: LoyaltyProgramConfig;
  customers: CustomerRecord[];
  initialCustomerId?: string;
  onStampSuccess?: (customer: CustomerRecord) => void;
}

export const StampIssuanceModal: React.FC<StampIssuanceModalProps> = ({
  isOpen,
  onClose,
  businessId,
  locationId,
  defaultStaffPin,
  program,
  customers,
  initialCustomerId,
  onStampSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return initialCustomerId || (customers[0]?.id || '');
  });
  const [staffPin, setStaffPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state after issuance
  const [resultState, setResultState] = useState<{
    customerName: string;
    newBalance: number;
    rewardUnlocked: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleIssueStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (!staffPin || staffPin.trim().length < 4 || !/^\d{4,6}$/.test(staffPin.trim())) {
      setErrorMsg('Please provide a valid 4-digit staff PIN.');
      return;
    }

    // Strict staff PIN verification against configured location PIN
    if (staffPin.trim() !== defaultStaffPin.trim()) {
      setErrorMsg('Invalid staff validation PIN. Access denied.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Issue the stamp (PIN verified against the location PIN)
      const res = loyaltyService.issueStamp({
        businessId,
        locationId,
        customerId: selectedCustomerId,
        staffPin: staffPin.trim(),
        stampsCount: 1,
        idempotencyKey: `stamp_${selectedCustomerId}_${Date.now()}`,
      });

      if (res.success && res.updatedBalance !== undefined) {
        setResultState({
          customerName: activeCustomer?.name || 'Customer',
          newBalance: res.updatedBalance,
          rewardUnlocked: !!res.rewardUnlocked,
        });

        const refreshed = loyaltyService.getCustomer(businessId, selectedCustomerId);
        if (refreshed && onStampSuccess) {
          onStampSuccess(refreshed);
        }
      } else {
        setErrorMsg(res.error || 'Failed to issue stamp.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during stamping.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setResultState(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
              COUNTER STAMP TERMINAL
            </span>
            <h3 className="text-lg sm:text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              Record Customer Visit
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation State */}
        {resultState ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
                resultState.rewardUnlocked
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {resultState.rewardUnlocked ? (
                <Award className="w-9 h-9 stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#868A94] block">
                {resultState.rewardUnlocked ? 'MILESTONE REACHED' : 'VISIT RECORDED'}
              </span>
              <h4 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
                {resultState.customerName}
              </h4>
              <p className="text-sm font-semibold text-[#3027F5] dark:text-[#E4C174] mt-1">
                {resultState.rewardUnlocked
                  ? `Reward Unlocked: ${program.rewardDescription}`
                  : `Current Progress: ${resultState.newBalance} of ${program.stampsRequired} stamps`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-black/5 dark:border-white/5 text-xs text-[#60646C] dark:text-[#D0CBC1]">
              {resultState.rewardUnlocked ? (
                <span>A new reward voucher code has been added to their wallet pass and customer CRM profile.</span>
              ) : (
                <span>Customer wallet pass has been credited. Event logged with staff PIN.</span>
              )}
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetForNext}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-semibold text-[#111318] dark:text-[#F7F3EB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Stamp Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleIssueStamp} className="space-y-4">
            
            {/* Customer Selector */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Select Enrolled Member
              </label>
              {customers.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
                  No enrolled customers yet. Add a customer in CRM first.
                </p>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currentStamps}/{program.stampsRequired} visits) — {c.email || c.phoneNumber || 'No contact'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Active Customer Status Card */}
            {activeCustomer && (
              <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] flex items-center justify-between text-xs">
                <div>
                  <span className="font-heading font-bold text-[#111318] dark:text-[#F7F3EB] block">
                    {activeCustomer.name}
                  </span>
                  <span className="text-[#60646C] dark:text-[#AAA499] text-[11px]">
                    {activeCustomer.totalVisits} lifetime visits
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#3027F5] dark:text-[#E4C174]">
                    {activeCustomer.currentStamps} / {program.stampsRequired}
                  </span>
                  <span className="text-[10px] text-[#868A94] block uppercase">
                    Stamps Held
                  </span>
                </div>
              </div>
            )}

            {/* Staff PIN input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase">
                  Staff Validation PIN
                </label>
                <span className="text-[10px] font-mono text-[#868A94]">
                  Authorization Required
                </span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full font-mono text-center text-lg font-bold tracking-widest px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-2.5 rounded-xl bg-[#F0EEE6] dark:bg-[#1A1916] border border-[#DDD9CE] dark:border-[rgba(228,193,116,0.15)] flex items-start gap-2 text-[11px] text-[#60646C] dark:text-[#AAA499]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0 mt-0.5" />
              <span>
                Each stamp is recorded in the activity log with the staff member's name and time.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-semibold text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || customers.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Stamp...' : 'Confirm Stamp (+1)'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
