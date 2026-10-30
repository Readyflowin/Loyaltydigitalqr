import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  AlertTriangle,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type {
  SalonAppointment,
  AppointmentStatus,
} from '../../../types/salon';
import {
  APPOINTMENT_STATUS_LABELS,
  VALID_APPOINTMENT_TRANSITIONS,
} from '../../../types/salon';
import { salonService } from '../../../services/salonService';
import { formatMinorUnits } from '../../../types/cafe';
import { formatTimeLabel } from '../../../utils/salonScheduling';

interface SalonAppointmentsViewProps {
  business: Business;
  theme: ThemeMode;
}

export const SalonAppointmentsView: React.FC<SalonAppointmentsViewProps> = ({ business }) => {
  const isSalon = business.businessType === 'salon';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = salonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Today string YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected appointment for detail drawer
  const [selectedAppointment, setSelectedAppointment] = useState<SalonAppointment | null>(null);

  // Modals state
  const [cancellingAppointment, setCancellingAppointment] = useState<SalonAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [reschedulingAppointment, setReschedulingAppointment] = useState<SalonAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Manual new appointment modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualStaffId, setManualStaffId] = useState('any');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('10:00');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerEmail, setManualCustomerEmail] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualInternalNotes, setManualInternalNotes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const services = salonService.getServices(business.id);
  const staffList = salonService.getStaff(business.id);
  const metrics = salonService.getSalonMetrics(business.id);

  if (!isSalon) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Appointments Module Unavailable
          </h3>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            This module is reserved for appointment-based salon and grooming businesses.
          </p>
        </div>
      </div>
    );
  }

  // Get filtered appointments list
  const filteredAppointments = salonService.getAppointments(business.id, {
    status: statusFilter,
    staffId: staffFilter,
    serviceId: serviceFilter,
    date: selectedDate,
    searchQuery,
  });

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleUpdateStatus = (aptId: string, nextStatus: AppointmentStatus, note?: string) => {
    const res = salonService.updateAppointmentStatus(aptId, nextStatus, 'Staff', note);
    if (res.success && selectedAppointment?.id === aptId) {
      setSelectedAppointment(res.appointment!);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingAppointment) return;
    salonService.updateAppointmentStatus(
      cancellingAppointment.id,
      'cancelled',
      'Staff',
      cancelReason
    );
    if (selectedAppointment?.id === cancellingAppointment.id) {
      const updated = salonService.getAppointment(cancellingAppointment.id);
      setSelectedAppointment(updated);
    }
    setCancellingAppointment(null);
  };

  const handleOpenReschedule = (apt: SalonAppointment) => {
    setReschedulingAppointment(apt);
    setRescheduleDate(apt.startIso.split('T')[0]);
    const timeHhmm = apt.startIso.split('T')[1].substring(0, 5);
    setRescheduleTime(timeHhmm);
    setRescheduleError(null);
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingAppointment) return;
    setRescheduleError(null);

    const res = salonService.rescheduleAppointment(
      reschedulingAppointment.id,
      rescheduleDate,
      rescheduleTime,
      'Staff'
    );

    if (!res.success) {
      setRescheduleError(res.error || 'Rescheduling failed.');
      return;
    }

    if (selectedAppointment?.id === reschedulingAppointment.id) {
      setSelectedAppointment(res.appointment!);
    }
    setReschedulingAppointment(null);
  };

  const handleCopyTrackingLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://loyaltydigitalqr.com';
    const link = `${origin}/appointment/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleOpenManualModal = () => {
    setManualServiceId(services[0]?.id || '');
    setManualStaffId('any');
    setManualDate(selectedDate);
    setManualTime('10:00');
    setManualCustomerName('');
    setManualCustomerEmail('');
    setManualCustomerPhone('');
    setManualNotes('');
    setManualInternalNotes('');
    setManualError(null);
    setManualModalOpen(true);
  };

  const handleSaveManualAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualCustomerName.trim()) {
      setManualError('Customer name is required.');
      return;
    }
    if (!manualServiceId) {
      setManualError('Please select a service.');
      return;
    }

    const res = salonService.createAppointment({
      businessId: business.id,
      serviceId: manualServiceId,
      staffId: manualStaffId,
      date: manualDate,
      startTime: manualTime,
      customerName: manualCustomerName,
      customerEmail: manualCustomerEmail || 'guest@example.com',
      customerPhone: manualCustomerPhone || '+1 (555) 000-0000',
      customerNotes: manualNotes,
      internalNotes: manualInternalNotes,
      bookingSource: 'dashboard',
    });

    if (!res.success) {
      setManualError(res.error || 'Booking creation failed.');
      return;
    }

    setManualModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            SALON & BARBERSHOP SCHEDULER
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Appointments Management
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Accept, manage, reschedule, and fulfill client bookings with conflict validation.
          </p>
        </div>

        <button
          type="button"
          data-testid="add-appointment-btn"
          onClick={handleOpenManualModal}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            TODAY'S BOOKINGS
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            {metrics.totalAppointmentsToday}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            AWAITING CONFIRMATION
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-amber-600 dark:text-amber-400">
            {metrics.awaitingConfirmation}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            UPCOMING THIS WEEK
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#3027F5] dark:text-[#E4C174]">
            {metrics.upcomingThisWeek}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            COMPLETED TODAY
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {metrics.completedToday}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)]">
          <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block mb-1">
            CANCELLED / NO-SHOW
          </span>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#868A94]">
            {metrics.cancelledOrNoShowToday}
          </div>
        </div>
      </div>

      {/* 3. Date Navigation & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="date-prev-btn"
              onClick={() => handleShiftDate(-1)}
              className="p-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="date-today-btn"
              onClick={handleSetToday}
              className="px-3 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-white/10 text-xs font-bold hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              data-testid="date-next-btn"
              onClick={() => handleShiftDate(1)}
              className="p-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-[#E5E3DB] dark:border-white/10">
              <Calendar className="w-4 h-4 text-[#868A94]" />
              <input
                type="date"
                data-testid="appointment-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] cursor-pointer outline-hidden"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#868A94]" />
            <input
              type="text"
              data-testid="search-appointments-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client or #APT..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-xs text-[#111318] dark:text-[#F7F3EB] placeholder-[#868A94] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E3DB] dark:border-white/10 text-xs">
          <div className="flex items-center gap-1.5 mr-2 text-[#868A94] font-mono text-[10px] uppercase font-bold">
            <Filter className="w-3 h-3" /> Filters:
          </div>

          {/* Status Tabs */}
          {(['all', 'requested', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                data-testid={`status-filter-${st}`}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#3027F5] text-white dark:bg-[#E4C174] dark:text-[#11100D] shadow-xs'
                    : 'text-[#60646C] dark:text-[#D0CBC1] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {st === 'all' ? 'All Status' : APPOINTMENT_STATUS_LABELS[st]}
              </button>
            )
          )}

          {/* Service Filter */}
          <select
            data-testid="service-filter-select"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-xs font-semibold ml-auto"
          >
            <option value="all">All Services</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>

          {/* Stylist Filter */}
          <select
            data-testid="staff-filter-select"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-xs font-semibold"
          >
            <option value="all">All Stylists</option>
            {staffList.map((stf) => (
              <option key={stf.id} value={stf.id}>
                {stf.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Appointments List / Agenda View */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] space-y-3">
          <CalendarCheck className="w-10 h-10 mx-auto text-[#868A94]" />
          <h4 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
            No appointments on {selectedDate}
          </h4>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
            There are no bookings matching the current filters for this date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const startTimeStr = apt.startIso.split('T')[1]?.substring(0, 5) || '10:00';
            const endTimeStr = apt.endIso.split('T')[1]?.substring(0, 5) || '10:45';

            return (
              <div
                key={apt.id}
                data-testid={`appointment-card-${apt.id}`}
                className="p-5 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Time & Client Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 text-center flex-shrink-0 p-2.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10">
                    <span className="font-mono font-black text-sm text-[#3027F5] dark:text-[#E4C174] block">
                      {formatTimeLabel(startTimeStr)}
                    </span>
                    <span className="text-[10px] text-[#868A94] font-medium block">
                      {formatTimeLabel(endTimeStr)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#868A94]">
                        {apt.appointmentNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : apt.status === 'requested'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : apt.status === 'checked_in'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : apt.status === 'in_service'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : apt.status === 'completed'
                            ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status].toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                      {apt.customerName}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-[#60646C] dark:text-[#D0CBC1]">
                      <span className="font-semibold text-[#111318] dark:text-[#F7F3EB]">
                        {apt.serviceSnapshot.name}
                      </span>
                      <span>·</span>
                      <span>{apt.serviceSnapshot.durationMinutes}m</span>
                      <span>·</span>
                      <span className="font-bold text-[#3027F5] dark:text-[#E4C174]">
                        {apt.staffName}
                      </span>
                      <span>·</span>
                      <span className="font-mono font-bold text-[#111318] dark:text-[#F7F3EB]">
                        {formatMinorUnits(apt.price, apt.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    data-testid={`view-appointment-${apt.id}`}
                    onClick={() => setSelectedAppointment(apt)}
                    className="px-3 py-1.5 rounded-xl border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.25)] text-xs font-bold text-[#111318] dark:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  {/* Context-sensitive workflow actions */}
                  {apt.status === 'requested' && (
                    <button
                      type="button"
                      data-testid={`confirm-appointment-${apt.id}`}
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                      className="px-3 py-1.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Confirm
                    </button>
                  )}

                  {apt.status === 'confirmed' && (
                    <button
                      type="button"
                      data-testid={`checkin-appointment-${apt.id}`}
                      onClick={() => handleUpdateStatus(apt.id, 'checked_in')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Check In
                    </button>
                  )}

                  {apt.status === 'checked_in' && (
                    <button
                      type="button"
                      data-testid={`start-service-${apt.id}`}
                      onClick={() => handleUpdateStatus(apt.id, 'in_service')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Start Service
                    </button>
                  )}

                  {apt.status === 'in_service' && (
                    <button
                      type="button"
                      data-testid={`complete-appointment-${apt.id}`}
                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Complete
                    </button>
                  )}

                  {VALID_APPOINTMENT_TRANSITIONS[apt.status]?.includes('cancelled') && (
                    <button
                      type="button"
                      data-testid={`cancel-appointment-${apt.id}`}
                      onClick={() => setCancellingAppointment(apt)}
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      title="Cancel appointment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Appointment Detail Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setSelectedAppointment(null)}
          />

          <div
            data-testid="appointment-detail-drawer"
            className="relative w-full max-w-lg bg-white dark:bg-[#141412] h-full shadow-2xl z-10 flex flex-col border-l border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E5E3DB] dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block">
                  APPOINTMENT DETAILS
                </span>
                <h3 className="font-heading font-black text-xl text-[#111318] dark:text-[#F7F3EB]">
                  {selectedAppointment.appointmentNumber}
                </h3>
              </div>
              <button
                type="button"
                data-testid="close-appointment-drawer-btn"
                onClick={() => setSelectedAppointment(null)}
                className="p-2 rounded-xl text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Customer Info */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block">
                  CLIENT DETAILS
                </span>
                <div className="font-heading font-black text-base text-[#111318] dark:text-[#F7F3EB]">
                  {selectedAppointment.customerName}
                </div>
                <div className="text-xs text-[#60646C] dark:text-[#D0CBC1] space-y-0.5">
                  <p>Email: {selectedAppointment.customerEmail}</p>
                  <p>Phone: {selectedAppointment.customerPhone}</p>
                  {selectedAppointment.customerId && (
                    <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      CRM MEMBER LINKED
                    </span>
                  )}
                </div>
              </div>

              {/* Service & Staff Details */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10 space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block">
                  SERVICE & STYLIST
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB]">
                    {selectedAppointment.serviceSnapshot.name}
                  </span>
                  <span className="font-bold font-mono">
                    {formatMinorUnits(selectedAppointment.price, selectedAppointment.currency)}
                  </span>
                </div>
                <div className="text-xs text-[#60646C] dark:text-[#D0CBC1] space-y-1">
                  <p>Duration: {selectedAppointment.serviceSnapshot.durationMinutes} minutes</p>
                  <p>Stylist: <strong>{selectedAppointment.staffName}</strong></p>
                  <p>Location: {selectedAppointment.locationName}</p>
                  <p>
                    Scheduled: {new Date(selectedAppointment.startIso).toLocaleDateString()} at{' '}
                    {formatTimeLabel(selectedAppointment.startIso.split('T')[1].substring(0, 5))}
                  </p>
                </div>
              </div>

              {/* Public Tracking Link Sharing */}
              <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#1A1916] border border-[#E5E3DB] dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block">
                  CUSTOMER TRACKING & MANAGEMENT LINK
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`/appointment/${selectedAppointment.bookingToken}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-white dark:bg-[#141412] font-mono text-[11px] text-[#3027F5] dark:text-[#E4C174]"
                  />
                  <button
                    type="button"
                    data-testid="copy-apt-tracking-link"
                    onClick={() => handleCopyTrackingLink(selectedAppointment.bookingToken)}
                    className="px-3 py-1.5 rounded-lg bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken === selectedAppointment.bookingToken ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedAppointment.customerNotes && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-800 dark:text-amber-400 font-bold block">
                    CUSTOMER NOTE
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-200">
                    "{selectedAppointment.customerNotes}"
                  </p>
                </div>
              )}

              {/* Internal Staff Notes (STAFF ONLY) */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-purple-800 dark:text-purple-400 font-bold block">
                  INTERNAL STAFF NOTE (AUTHORIZED DASHBOARD ONLY)
                </span>
                <p className="text-xs text-purple-950 dark:text-purple-200">
                  {selectedAppointment.internalNotes || 'No internal notes recorded for this visit.'}
                </p>
              </div>

              {/* Status Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#868A94] font-bold block">
                  AUDIT TIMELINE
                </span>
                <div className="space-y-2 pl-2 border-l-2 border-[#E5E3DB] dark:border-white/10">
                  {selectedAppointment.statusHistory.map((h, i) => (
                    <div key={i} className="pl-3 relative">
                      <div className="w-2 h-2 rounded-full bg-[#3027F5] dark:bg-[#E4C174] absolute -left-[17px] top-1.5" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111318] dark:text-[#F7F3EB]">
                          {APPOINTMENT_STATUS_LABELS[h.status]}
                        </span>
                        <span className="text-[10px] text-[#868A94]">by {h.actor}</span>
                      </div>
                      <span className="text-[10px] text-[#868A94] block">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {h.note && <p className="text-[11px] text-[#60646C] dark:text-[#D0CBC1] mt-0.5">{h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between gap-2 bg-[#F8F7F2] dark:bg-[#1A1916]">
              <button
                type="button"
                data-testid="drawer-reschedule-btn"
                onClick={() => handleOpenReschedule(selectedAppointment)}
                className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 hover:bg-white dark:hover:bg-[#141412] text-xs font-bold transition-colors cursor-pointer"
              >
                Reschedule
              </button>

              <div className="flex items-center gap-2">
                {VALID_APPOINTMENT_TRANSITIONS[selectedAppointment.status]?.includes('cancelled') && (
                  <button
                    type="button"
                    data-testid="drawer-cancel-btn"
                    onClick={() => setCancellingAppointment(selectedAppointment)}
                    className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                )}

                {selectedAppointment.status === 'confirmed' && (
                  <button
                    type="button"
                    data-testid="drawer-checkin-btn"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'checked_in')}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Check In
                  </button>
                )}
                {selectedAppointment.status === 'checked_in' && (
                  <button
                    type="button"
                    data-testid="drawer-start-btn"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'in_service')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Start Service
                  </button>
                )}
                {selectedAppointment.status === 'in_service' && (
                  <button
                    type="button"
                    data-testid="drawer-complete-btn"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Reschedule Modal */}
      {reschedulingAppointment && (
        <div data-testid="reschedule-modal" className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setReschedulingAppointment(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
              Reschedule {reschedulingAppointment.appointmentNumber}
            </h4>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">New Date</label>
                <input
                  type="date"
                  data-testid="reschedule-date-input"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">New Start Time</label>
                <input
                  type="time"
                  data-testid="reschedule-time-input"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E3DB] dark:border-white/10">
              <button
                type="button"
                onClick={() => setReschedulingAppointment(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                data-testid="confirm-reschedule-btn"
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs shadow-md cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Cancellation Confirmation Dialog */}
      {cancellingAppointment && (
        <div data-testid="appointment-cancellation-modal" className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setCancellingAppointment(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-red-200 dark:border-red-900/40 shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                Cancel {cancellingAppointment.appointmentNumber}?
              </h4>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] mt-1">
                This will release the stylist's time slot and notify the customer tracking screen.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-[#111318] dark:text-[#F7F3EB]">
                Cancellation Reason
              </label>
              <select
                data-testid="cancel-reason-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916] text-[#111318] dark:text-[#F7F3EB]"
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Client did not arrive on time">Client did not arrive on time</option>
                <option value="Stylist unavailable due to emergency">Stylist unavailable due to emergency</option>
                <option value="Duplicate booking submitted">Duplicate booking submitted</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E3DB] dark:border-white/10">
              <button
                type="button"
                onClick={() => setCancellingAppointment(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                data-testid="confirm-cancel-appointment-btn"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Manual New Appointment Modal */}
      {manualModalOpen && (
        <div data-testid="manual-appointment-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setManualModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10">
              <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                Add Manual Appointment
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="p-1.5 rounded-xl text-[#868A94] hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                {manualError}
              </div>
            )}

            <form onSubmit={handleSaveManualAppointment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Client Name *</label>
                  <input
                    type="text"
                    data-testid="manual-client-name"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    placeholder="e.g. Liam Taylor"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Select Service *</label>
                <select
                  data-testid="manual-service-select"
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                  required
                >
                  {services.filter((s) => s.isEnabled).map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.durationMinutes}m - {formatMinorUnits(srv.price, srv.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Stylist</label>
                  <select
                    data-testid="manual-staff-select"
                    value={manualStaffId}
                    onChange={(e) => setManualStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                  >
                    <option value="any">Any Available Stylist</option>
                    {staffList.filter((s) => s.isActive).map((stf) => (
                      <option key={stf.id} value={stf.id}>
                        {stf.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Start Time</label>
                  <input
                    type="time"
                    data-testid="manual-time-input"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Date</label>
                <input
                  type="date"
                  data-testid="manual-date-input"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#111318] dark:text-[#F7F3EB] block mb-1">Internal Notes (Staff Only)</label>
                <input
                  type="text"
                  value={manualInternalNotes}
                  onChange={(e) => setManualInternalNotes(e.target.value)}
                  placeholder="e.g. VIP client requested quiet session"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E3DB] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-manual-appointment-btn"
                  className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
