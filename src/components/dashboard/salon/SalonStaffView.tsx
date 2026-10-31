import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import type { Business } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { StaffProfile, StaffWorkingHours, BreakPeriod } from '../../../types/salon';
import { salonService } from '../../../services/salonService';
import { formatTimeLabel, timeToMinutes } from '../../../utils/salonScheduling';

interface SalonStaffViewProps {
  business: Business;
  theme: ThemeMode;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const SalonStaffView: React.FC<SalonStaffViewProps> = ({ business }) => {
  const isSalon = business.businessType === 'salon';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = salonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const staffList = salonService.getStaff(business.id);
  const services = salonService.getServices(business.id);
  const appointments = salonService.getAppointments(business.id);

  // Modal states
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);

  // Profile Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Senior Stylist');
  const [formLocationId, setFormLocationId] = useState(business.locations[0]?.id || 'loc_main');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAssignedServiceIds, setFormAssignedServiceIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Schedule Editor states
  const [editingSchedule, setEditingSchedule] = useState<StaffWorkingHours[]>([]);
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null);

  if (!isSalon) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-black text-foreground">
            Staff Management Module Unavailable
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            This module is reserved for appointment-based salon and wellness businesses.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreateModal = () => {
    setSelectedStaff(null);
    setFormName('');
    setFormRole('Senior Stylist');
    setFormLocationId(business.locations[0]?.id || 'loc_main');
    setFormIsActive(true);
    setFormAssignedServiceIds(services.map((s) => s.id));
    setFormError(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditProfile = (stf: StaffProfile) => {
    setSelectedStaff(stf);
    setFormName(stf.displayName);
    setFormRole(stf.role);
    setFormLocationId(stf.locationId);
    setFormIsActive(stf.isActive);
    setFormAssignedServiceIds([...stf.assignedServiceIds]);
    setFormError(null);
    setEditorModalOpen(true);
  };

  const handleOpenScheduleEditor = (stf: StaffProfile) => {
    setSelectedStaff(stf);
    // Deep clone schedule
    setEditingSchedule(JSON.parse(JSON.stringify(stf.schedule)));
    setScheduleWarning(null);
    setScheduleModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Staff name is required.');
      return;
    }

    if (selectedStaff) {
      salonService.updateStaff(business.id, selectedStaff.id, {
        displayName: formName.trim(),
        role: formRole.trim(),
        locationId: formLocationId,
        isActive: formIsActive,
        assignedServiceIds: formAssignedServiceIds,
      });
    } else {
      // Default working schedule for new staff: Mon-Sat 09:00 - 18:00
      const defaultSchedule: StaffWorkingHours[] = DAYS_OF_WEEK.map((_, idx) => ({
        dayOfWeek: idx,
        isOpen: idx !== 0, // closed on Sunday
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ id: `brk_${idx}`, name: 'Lunch', startTime: '13:00', endTime: '14:00' }],
      }));

      salonService.createStaff(business.id, {
        displayName: formName.trim(),
        role: formRole.trim(),
        locationId: formLocationId,
        isActive: formIsActive,
        assignedServiceIds: formAssignedServiceIds,
        schedule: defaultSchedule,
      });
    }

    setEditorModalOpen(false);
  };

  const handleSaveSchedule = () => {
    if (!selectedStaff) return;

    // Check for any schedule conflicts with existing upcoming appointments
    const staffAppointments = appointments.filter(
      (a) => a.staffId === selectedStaff.id && a.status !== 'cancelled'
    );

    let hasConflict = false;
    for (const apt of staffAppointments) {
      const aptDate = new Date(apt.startIso);
      const dayIdx = aptDate.getDay();
      const daySched = editingSchedule.find((s) => s.dayOfWeek === dayIdx);

      if (!daySched || !daySched.isOpen) {
        hasConflict = true;
        break;
      }

      const aptStartMins = aptDate.getHours() * 60 + aptDate.getMinutes();
      const workStart = timeToMinutes(daySched.startTime);
      const workEnd = timeToMinutes(daySched.endTime);

      if (aptStartMins < workStart || aptStartMins >= workEnd) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict && !scheduleWarning) {
      setScheduleWarning(
        'Warning: One or more existing appointments fall outside these new working hours. Are you sure you want to proceed?'
      );
      return;
    }

    salonService.updateStaff(business.id, selectedStaff.id, {
      schedule: editingSchedule,
    });

    setScheduleModalOpen(false);
  };

  const handleToggleDayOpen = (dayIdx: number) => {
    setEditingSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIdx ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const handleUpdateDayTime = (
    dayIdx: number,
    field: 'startTime' | 'endTime',
    val: string
  ) => {
    setEditingSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIdx ? { ...item, [field]: val } : item
      )
    );
  };

  const handleAddBreak = (dayIdx: number) => {
    const newBreak: BreakPeriod = {
      id: `brk_${Date.now()}`,
      name: 'Break',
      startTime: '13:00',
      endTime: '14:00',
    };

    setEditingSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIdx
          ? { ...item, breaks: [...item.breaks, newBreak] }
          : item
      )
    );
  };

  const handleRemoveBreak = (dayIdx: number, breakId: string) => {
    setEditingSchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIdx
          ? { ...item, breaks: item.breaks.filter((b) => b.id !== breakId) }
          : item
      )
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff profile?')) {
      salonService.deleteStaff(business.id, staffId);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            STYLISTS & STAFF ROSTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-0.5">
            Staff & Availability
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your professionals, assign services, and customize weekly working hours.
          </p>
        </div>

        <button
          type="button"
          data-testid="add-staff-btn"
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-[#3027F5] hover:bg-[#2319D8] text-white dark:bg-[#E4C174] dark:hover:bg-[#EBD294] dark:text-[#11100D] text-xs sm:text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* 2. Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((stf) => {
          const location = business.locations.find((l) => l.id === stf.locationId);
          const assignedServices = services.filter((s) =>
            stf.assignedServiceIds.includes(s.id)
          );
          const upcomingCount = appointments.filter(
            (a) => a.staffId === stf.id && a.status === 'confirmed'
          ).length;

          return (
            <div
              key={stf.id}
              data-testid={`staff-card-${stf.id}`}
              className={`p-5 rounded-3xl bg-card border transition-all flex flex-col justify-between ${
                stf.isActive
                  ? 'border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs hover:shadow-md'
                  : 'border-amber-200 dark:border-amber-900/30 opacity-70 bg-amber-50/20'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] font-heading font-black text-base flex items-center justify-center flex-shrink-0">
                      {stf.displayName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base text-foreground leading-tight">
                        {stf.displayName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {stf.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      stf.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {stf.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Location & Upcoming Bookings */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10">
                    <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </span>
                    <span className="font-bold text-foreground truncate block">
                      {location?.name || 'Main Studio'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted border border-[#E5E3DB] dark:border-white/10">
                    <span className="text-xs uppercase text-subtle-foreground font-bold block mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Upcoming
                    </span>
                    <span className="font-bold text-[#3027F5] dark:text-[#E4C174]">
                      {upcomingCount} bookings
                    </span>
                  </div>
                </div>

                {/* Assigned Services */}
                <div>
                  <span className="text-xs uppercase text-subtle-foreground font-bold block mb-1">
                    SERVICES PROVIDED ({assignedServices.length})
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {assignedServices.slice(0, 3).map((srv) => (
                      <span
                        key={srv.id}
                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-[#4A4D55] dark:text-[#D0CBC1]"
                      >
                        {srv.name}
                      </span>
                    ))}
                    {assignedServices.length > 3 && (
                      <span className="text-xs text-subtle-foreground font-bold">
                        +{assignedServices.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-[#E5E3DB] dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  data-testid={`edit-schedule-btn-${stf.id}`}
                  onClick={() => handleOpenScheduleEditor(stf)}
                  className="px-3 py-1.5 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 hover:bg-[#3027F5]/20 dark:hover:bg-[#E4C174]/25 text-[#3027F5] dark:text-[#E4C174] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Working Hours</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`edit-staff-btn-${stf.id}`}
                    onClick={() => handleOpenEditProfile(stf)}
                    className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] hover:bg-[#F8F7F2] dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-staff-btn-${stf.id}`}
                    onClick={() => handleDeleteStaff(stf.id)}
                    className="p-1.5 rounded-xl text-subtle-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Add / Edit Staff Modal */}
      {editorModalOpen && (
        <div
          data-testid="staff-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setEditorModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-lg text-foreground">
                  {selectedStaff ? 'Edit Staff Profile' : 'Add Staff Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorModalOpen(false)}
                className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Full Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  data-testid="input-staff-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jordan Vance"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-muted text-foreground focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Role / Speciality
                </label>
                <input
                  type="text"
                  data-testid="input-staff-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="e.g. Master Barber, Colour Specialist"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-muted text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Studio Location
                </label>
                <select
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-muted text-foreground focus:outline-hidden"
                >
                  {business.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Assigned */}
              <div>
                <label className="font-bold text-foreground block mb-1 flex items-center justify-between">
                  <span>Assigned Services</span>
                  <span className="text-xs text-subtle-foreground">Select all they provide</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-[#E5E3DB] dark:border-white/10 bg-muted">
                  {services.map((srv) => {
                    const isChecked = formAssignedServiceIds.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#141412] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormAssignedServiceIds([...formAssignedServiceIds, srv.id]);
                              } else {
                                setFormAssignedServiceIds(
                                  formAssignedServiceIds.filter((id) => id !== srv.id)
                                );
                              }
                            }}
                            className="rounded text-[#3027F5]"
                          />
                          <span className="font-semibold text-foreground">
                            {srv.name}
                          </span>
                        </div>
                        <span className="text-xs text-subtle-foreground">{srv.durationMinutes}m</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted border border-[#E5E3DB] dark:border-white/10">
                <div>
                  <span className="font-bold text-foreground block">
                    Active for Bookings
                  </span>
                  <span className="text-xs text-subtle-foreground">
                    Disabled staff cannot accept new bookings.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3027F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E3DB] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-staff-btn"
                  className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{selectedStaff ? 'Save Profile' : 'Add Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Weekly Schedule Editor Modal */}
      {scheduleModalOpen && selectedStaff && (
        <div
          data-testid="schedule-editor-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setScheduleModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB] dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#3027F5]/10 dark:bg-[#E4C174]/15 text-[#3027F5] dark:text-[#E4C174] flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-foreground leading-none">
                    Working Hours & Schedule
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedStaff.displayName} ({business.timeZone || 'America/New_York'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-subtle-foreground hover:text-[#111318] dark:hover:text-[#F7F3EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleWarning && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Appointment Conflict Warning</span>
                  <span>{scheduleWarning}</span>
                </div>
              </div>
            )}

            {/* Days list */}
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((dayName, idx) => {
                const daySched = editingSchedule.find((s) => s.dayOfWeek === idx) || {
                  dayOfWeek: idx,
                  isOpen: false,
                  startTime: '09:00',
                  endTime: '18:00',
                  breaks: [],
                };

                return (
                  <div
                    key={dayName}
                    data-testid={`schedule-day-${idx}`}
                    className={`p-3.5 rounded-2xl border transition-all text-xs ${
                      daySched.isOpen
                        ? 'border-[#E5E3DB] dark:border-white/10 bg-muted'
                        : 'border-[#E5E3DB]/60 dark:border-white/5 bg-black/5 dark:bg-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={daySched.isOpen}
                          onChange={() => handleToggleDayOpen(idx)}
                          className="w-4 h-4 rounded text-[#3027F5]"
                        />
                        <span className="font-heading font-black text-sm text-foreground w-24">
                          {dayName}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            daySched.isOpen
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-black/10 text-subtle-foreground dark:bg-white/10'
                          }`}
                        >
                          {daySched.isOpen ? 'WORKING' : 'OFF DUTY'}
                        </span>
                      </div>

                      {daySched.isOpen && (
                        <div className="flex items-center gap-2 pl-7 sm:pl-0">
                          <input
                            type="time"
                            value={daySched.startTime}
                            onChange={(e) => handleUpdateDayTime(idx, 'startTime', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-card text-xs font-mono font-bold"
                          />
                          <span className="text-subtle-foreground">to</span>
                          <input
                            type="time"
                            value={daySched.endTime}
                            onChange={(e) => handleUpdateDayTime(idx, 'endTime', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-card text-xs font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddBreak(idx)}
                            className="px-2.5 py-1 rounded-lg border border-[#E5E3DB] dark:border-white/10 bg-card hover:bg-[#F8F7F2] text-xs font-bold text-[#3027F5] dark:text-[#E4C174] cursor-pointer"
                          >
                            + Break
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breaks list */}
                    {daySched.isOpen && daySched.breaks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#E5E3DB] dark:border-white/10 pl-7 flex flex-wrap gap-2">
                        {daySched.breaks.map((brk) => (
                          <div
                            key={brk.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
                          >
                            <span className="font-bold">{brk.name}:</span>
                            <span className="font-mono">
                              {formatTimeLabel(brk.startTime)} - {formatTimeLabel(brk.endTime)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBreak(idx, brk.id)}
                              className="text-amber-700 hover:text-red-500 ml-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E3DB] dark:border-white/10">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="save-schedule-btn"
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] hover:bg-[#2319D8] dark:hover:bg-[#EBD294] text-white dark:text-[#11100D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
