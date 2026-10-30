import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { CustomerRecord } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  customer?: CustomerRecord | null; // If null, creating new customer
  onSuccess?: (customer: CustomerRecord) => void;
}

const CustomerEditModalContent: React.FC<Omit<CustomerEditModalProps, 'isOpen'>> = ({
  onClose,
  businessId,
  customer,
  onSuccess,
}) => {
  const isEditing = !!customer;

  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(customer?.phoneNumber || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [status, setStatus] = useState<'active' | 'archived'>(customer?.status || 'active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }

    if (isEditing && customer) {
      const res = loyaltyService.updateCustomer(businessId, customer.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });

      if (res.success && res.customer) {
        if (onSuccess) onSuccess(res.customer);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to update customer record.');
      }
    } else {
      const res = loyaltyService.addCustomer(businessId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.customer) {
        if (onSuccess) onSuccess(res.customer);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to enroll new customer.');
      }
    }
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
              {isEditing ? 'UPDATE RECORD' : 'NEW ENROLLMENT'}
            </span>
            <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB] mt-0.5">
              {isEditing ? 'Edit Customer Profile' : 'Enroll New Member'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
              Customer Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Hayes"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
              Mobile Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'border border-[#E5E3DB] dark:border-white/10 text-[#60646C]'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('archived')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'archived'
                      ? 'bg-red-500/15 border border-red-500/30 text-red-800 dark:text-red-300'
                      : 'border border-[#E5E3DB] dark:border-white/10 text-[#60646C]'
                  }`}
                >
                  Archived / Inactive
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-[#111318] dark:text-[#F7F3EB] uppercase mb-1">
              Internal Staff Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular counter guest, favorite table or drink preferences"
              className="w-full px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#3027F5] dark:focus:ring-[#E4C174]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] text-xs font-semibold text-[#60646C] dark:text-[#AAA499] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all"
            >
              {isEditing ? 'Save Changes' : 'Enroll Customer'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export const CustomerEditModal: React.FC<CustomerEditModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <CustomerEditModalContent key={props.customer ? props.customer.id : 'new'} {...props} />;
};
