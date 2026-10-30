import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  Sun,
  Moon,
  Bell,
  XCircle,
  Scissors,
} from 'lucide-react';
import { useRouter } from '../router';
import { mockSalonService } from '../services/mockSalonService';
import { formatMinorUnits } from '../types/cafe';
import type { ThemeMode } from '../types';
import type { AppointmentStatus } from '../types/salon';
import { APPOINTMENT_STATUS_LABELS } from '../types/salon';

interface PublicAppointmentTrackingPageProps {
  theme: ThemeMode;
  onThemeToggle: (theme: ThemeMode) => void;
}

const STAGES: { status: AppointmentStatus; label: string; desc: string }[] = [
  { status: 'requested', label: 'Requested', desc: 'Booking submitted to salon' },
  { status: 'confirmed', label: 'Confirmed', desc: 'Stylist confirmed your chair' },
  { status: 'checked_in', label: 'Checked In', desc: 'Arrived at salon lobby' },
  { status: 'in_service', label: 'In Service', desc: 'Hair & styling in progress' },
  { status: 'completed', label: 'Completed', desc: 'Finished & looking sharp' },
];

export const PublicAppointmentTrackingPage: React.FC<PublicAppointmentTrackingPageProps> = ({
  theme,
  onThemeToggle,
}) => {
  const { currentPath, navigate } = useRouter();

  // Extract booking token from /appointment/:token
  const token = currentPath.replace(/^\/appointment\/?/, '').split('/')[0] || '';

  // Reactive subscription to live appointment updates
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = mockSalonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // State for customer cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const appointment = mockSalonService.getAppointmentByToken(token);

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Appointment Not Found
          </h2>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] leading-relaxed">
            We couldn't locate a booking matching code "<strong>{token}</strong>". The link may have expired or was typed incorrectly.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = appointment.status === 'cancelled';
  const isNoShow = appointment.status === 'no_show';
  const isCompleted = appointment.status === 'completed';

  // Determine stage index
  const stageOrder: AppointmentStatus[] = ['requested', 'confirmed', 'checked_in', 'in_service', 'completed'];
  const currentStageIndex = stageOrder.indexOf(appointment.status);

  // Format date and time
  const startDate = new Date(appointment.startIso);
  const endDate = new Date(appointment.endIso);
  const dateFormatted = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const handleCustomerCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }
    const result = mockSalonService.updateAppointmentStatus(
      appointment.id,
      'cancelled',
      'Customer',
      cancelReason.trim()
    );
    if (!result.success) {
      setCancelError(result.error || 'Failed to cancel appointment.');
      return;
    }
    setShowCancelModal(false);
    setCancelReason('');
    setCancelError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#090909] text-[#111318] dark:text-[#F7F3EB] pb-16 transition-colors duration-200">
      {/* 1. Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141412]/95 backdrop-blur-md border-b border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="back-to-booking-btn"
            onClick={() => navigate(`/book/${appointment.businessSlug}`)}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Book Another</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase">
              APPOINTMENT TRACKER
            </span>
            <span
              data-testid="tracking-appointment-number"
              className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB]"
            >
              {appointment.appointmentNumber}
            </span>
          </div>

          <button
            type="button"
            data-testid="theme-toggle-tracking"
            onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-[#60646C] hover:text-[#111318] dark:text-[#D0CBC1] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Tracking Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Salon & Status Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
                  {appointment.businessName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#60646C] dark:text-[#D0CBC1]">
                <MapPin className="w-3.5 h-3.5 text-[#868A94]" />
                <span>{appointment.locationName} &bull; {appointment.locationAddress}</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/20 text-[#3027F5] dark:text-[#E4C174] text-xs font-bold text-center flex items-center gap-1.5 whitespace-nowrap">
              <Scissors className="w-3.5 h-3.5" />
              <span>{appointment.staffName}</span>
            </div>
          </div>

          {/* Cancelled Banner if cancelled or no-show */}
          {isCancelled || isNoShow ? (
            <div
              data-testid="appointment-cancelled-banner"
              className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 space-y-1"
            >
              <div className="flex items-center gap-2 font-heading font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>
                  {isCancelled ? 'Appointment Cancelled' : 'Appointment Marked as No-Show'}
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Reason: {appointment.cancellationReason || 'Appointment was cancelled.'}
              </p>
            </div>
          ) : (
            /* Active Progress Timeline */
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-[#3027F5] dark:bg-[#E4C174] animate-pulse'
                    }`}
                  />
                  <span
                    data-testid="tracking-status-badge"
                    className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]"
                  >
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </span>
                </div>

                <span className="text-xs text-[#868A94] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{appointment.serviceSnapshot.durationMinutes} min</span>
                </span>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {STAGES.map((stg, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={stg.status} className="space-y-1.5 text-center">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isDone
                            ? 'bg-[#3027F5] dark:bg-[#E4C174]'
                            : 'bg-[#E5E3DB] dark:bg-[#201F1B]'
                        } ${isCurrent ? 'ring-2 ring-[#3027F5]/30 dark:ring-[#E4C174]/40' : ''}`}
                      />
                      <span
                        className={`text-[10px] font-bold block truncate ${
                          isCurrent
                            ? 'text-[#3027F5] dark:text-[#E4C174]'
                            : isDone
                            ? 'text-[#111318] dark:text-[#F7F3EB]'
                            : 'text-[#868A94]'
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Service & Booking Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10">
            <h3 className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] uppercase tracking-wider">
              Booking Details
            </h3>
            <span className="text-xs font-mono text-[#868A94]">
              Ref: {appointment.bookingToken}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div
                  data-testid="tracking-service-name"
                  className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB]"
                >
                  {appointment.serviceSnapshot.name}
                </div>
                <div className="text-[11px] text-[#60646C] dark:text-[#D0CBC1]">
                  Duration: {appointment.serviceSnapshot.durationMinutes} minutes
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-[#111318] dark:text-[#F7F3EB]">
                {formatMinorUnits(appointment.price, appointment.currency)}
              </span>
            </div>

            <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
                <Calendar className="w-4 h-4 text-[#868A94]" />
                <span data-testid="tracking-date">{dateFormatted}</span>
              </div>
              <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
                <Clock className="w-4 h-4 text-[#868A94]" />
                <span data-testid="tracking-time">{timeFormatted}</span>
              </div>
              <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
                <Scissors className="w-4 h-4 text-[#868A94]" />
                <span data-testid="tracking-staff-name">Stylist: {appointment.staffName}</span>
              </div>
              <div className="flex items-center gap-2 text-[#60646C] dark:text-[#D0CBC1]">
                <User className="w-4 h-4 text-[#868A94]" />
                <span data-testid="tracking-customer-name">Client: {appointment.customerName}</span>
              </div>
            </div>

            {appointment.customerNotes && (
              <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] text-[11px] text-[#60646C] dark:text-[#D0CBC1]">
                <span className="font-bold text-[#111318] dark:text-[#F7F3EB]">Client Note: </span>
                <span>{appointment.customerNotes}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#868A94]">Total Due at Salon</span>
            <span
              data-testid="tracking-total"
              className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]"
            >
              {formatMinorUnits(appointment.price, appointment.currency)}
            </span>
          </div>
        </div>

        {/* 4. Self-Service Cancellation Option (if eligible) */}
        {appointment.canCancelOrReschedule && !isCancelled && !isCompleted && !isNoShow && (
          <div className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                Need to cancel or change plans?
              </div>
              <div className="text-[11px] text-[#868A94] mt-0.5">
                {appointment.cancellationPolicyNotice || 'Free cancellation up to 2 hours prior to scheduled appointment.'}
              </div>
            </div>

            <button
              type="button"
              data-testid="customer-cancel-btn"
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/60 dark:text-red-400 font-bold cursor-pointer transition-colors whitespace-nowrap self-start sm:self-center"
            >
              Request Cancellation
            </button>
          </div>
        )}

        {/* 5. Live Updates Info Pill */}
        <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.15)] flex items-center gap-3 text-xs text-[#60646C] dark:text-[#D0CBC1]">
          <Bell className="w-4 h-4 text-[#3027F5] dark:text-[#E4C174] flex-shrink-0" />
          <span>
            This tracking page automatically updates in real-time as your stylist updates your chair status.
          </span>
        </div>
      </main>

      {/* Customer Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                Cancel Appointment
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
              Please let the salon know why you're cancelling appointment <strong>{appointment.appointmentNumber}</strong>:
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                {cancelError}
              </div>
            )}

            <textarea
              data-testid="cancel-reason-input"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Unforeseen schedule conflict, sick, rescheduling..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-xs text-[#111318] dark:text-[#F7F3EB] focus:outline-hidden focus:ring-2 focus:ring-[#3027F5]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#60646C] dark:text-[#D0CBC1] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                data-testid="confirm-cancel-btn"
                onClick={handleCustomerCancel}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
