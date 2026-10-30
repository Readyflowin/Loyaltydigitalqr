import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { MockBusiness } from '../../../types/business';
import type { ThemeMode } from '../../../types';
import type { SalonAppointment } from '../../../types/salon';
import { mockSalonService } from '../../../services/mockSalonService';
import { formatTimeLabel, timeToMinutes } from '../../../utils/salonScheduling';
import { formatMinorUnits } from '../../../types/cafe';

interface SalonCalendarViewProps {
  business: MockBusiness;
  theme: ThemeMode;
}

const HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

export const SalonCalendarView: React.FC<SalonCalendarViewProps> = ({ business }) => {
  const isSalon = business.businessType === 'salon';

  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsub = mockSalonService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<SalonAppointment | null>(null);

  const staffList = mockSalonService.getStaff(business.id, selectedLocationId);
  const appointments = mockSalonService.getAppointments(business.id, {
    date: selectedDate,
    locationId: selectedLocationId,
  });

  if (!isSalon) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-heading font-black text-[#111318] dark:text-[#F7F3EB]">
            Calendar Module Unavailable
          </h3>
          <p className="text-xs text-[#60646C] dark:text-[#D0CBC1] max-w-md mx-auto">
            This module is reserved for salon and barbershop appointments workspaces.
          </p>
        </div>
      </div>
    );
  }

  const handleShiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const dayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3027F5] dark:text-[#E4C174] uppercase block">
            CHAIRS & SCHEDULE GRID
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111318] dark:text-[#F7F3EB] mt-0.5">
            Staff & Chairs Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#60646C] dark:text-[#D0CBC1] mt-1">
            Visual column grid showing real-time bookings, scheduled breaks, and open slots.
          </p>
        </div>

        {/* Date & Location Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {business.locations.length > 1 && (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] text-[#111318] dark:text-[#F7F3EB] shadow-xs cursor-pointer"
            >
              <option value="all">All Locations</option>
              {business.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-[#1A1916] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-mono font-bold bg-transparent outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Visual Calendar Grid */}
      <div className="rounded-3xl bg-white dark:bg-[#141412] border border-[#E5E3DB] dark:border-[rgba(228,193,116,0.2)] shadow-xs overflow-hidden">
        {/* Column Headers (Staff Members) */}
        <div
          className="grid border-b border-[#E5E3DB] dark:border-white/10 bg-[#F8F7F2] dark:bg-[#1A1916]"
          style={{ gridTemplateColumns: `80px repeat(${staffList.length}, minmax(180px, 1fr))` }}
        >
          <div className="p-3 text-center border-r border-[#E5E3DB] dark:border-white/10 font-mono text-[10px] uppercase font-bold text-[#868A94]">
            TIME
          </div>
          {staffList.map((stf) => (
            <div
              key={stf.id}
              className="p-3 border-r last:border-r-0 border-[#E5E3DB] dark:border-white/10 flex items-center justify-between gap-2"
            >
              <div>
                <span className="font-heading font-black text-sm text-[#111318] dark:text-[#F7F3EB] block leading-tight">
                  {stf.displayName}
                </span>
                <span className="text-[10px] text-[#868A94] block truncate">{stf.role}</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  stf.isActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={stf.isActive ? 'Active' : 'Inactive'}
              />
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="overflow-x-auto">
          {HOURS.map((hour) => {
            const hourMins = timeToMinutes(hour);

            return (
              <div
                key={hour}
                className="grid border-b last:border-b-0 border-[#E5E3DB]/60 dark:border-white/5 min-h-[70px]"
                style={{
                  gridTemplateColumns: `80px repeat(${staffList.length}, minmax(180px, 1fr))`,
                }}
              >
                {/* Time Label */}
                <div className="p-2 border-r border-[#E5E3DB] dark:border-white/10 text-center font-mono text-xs font-bold text-[#868A94] bg-[#F8F7F2]/50 dark:bg-[#1A1916]/50">
                  {formatTimeLabel(hour)}
                </div>

                {/* Staff Cells */}
                {staffList.map((stf) => {
                  const schedule = stf.schedule.find((s) => s.dayOfWeek === dayOfWeek);
                  const isOffDuty = !schedule || !schedule.isOpen;

                  // Check if this hour is in working hours
                  const workStart = schedule ? timeToMinutes(schedule.startTime) : 0;
                  const workEnd = schedule ? timeToMinutes(schedule.endTime) : 0;
                  const isWithinWork = !isOffDuty && hourMins >= workStart && hourMins < workEnd;

                  // Check breaks
                  const isBreak =
                    schedule?.breaks.some((brk) => {
                      const bStart = timeToMinutes(brk.startTime);
                      const bEnd = timeToMinutes(brk.endTime);
                      return hourMins >= bStart && hourMins < bEnd;
                    }) || false;

                  // Find appointments falling in this hour
                  const aptsInHour = appointments.filter((a) => {
                    if (a.staffId !== stf.id || a.status === 'cancelled') return false;
                    const aStartMins = timeToMinutes(a.startIso.split('T')[1].substring(0, 5));
                    return aStartMins >= hourMins && aStartMins < hourMins + 60;
                  });

                  return (
                    <div
                      key={stf.id}
                      className={`p-1.5 border-r last:border-r-0 border-[#E5E3DB]/60 dark:border-white/5 relative ${
                        isOffDuty
                          ? 'bg-black/5 dark:bg-white/5'
                          : isBreak
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : !isWithinWork
                          ? 'bg-black/5 dark:bg-white/5 opacity-40'
                          : ''
                      }`}
                    >
                      {isOffDuty && (
                        <span className="text-[10px] text-[#868A94] italic block text-center pt-3">
                          Off Duty
                        </span>
                      )}

                      {isBreak && !isOffDuty && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block text-center pt-3">
                          Scheduled Break
                        </span>
                      )}

                      {aptsInHour.map((apt) => (
                        <div
                          key={apt.id}
                          data-testid={`cal-apt-${apt.id}`}
                          onClick={() => setSelectedAppointment(apt)}
                          className="p-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] shadow-xs cursor-pointer hover:opacity-90 transition-all text-xs space-y-0.5"
                        >
                          <div className="font-heading font-black truncate">{apt.customerName}</div>
                          <div className="text-[10px] opacity-90 truncate">{apt.serviceSnapshot.name}</div>
                          <div className="text-[9px] font-mono opacity-80">
                            {formatTimeLabel(apt.startIso.split('T')[1].substring(0, 5))} (
                            {apt.serviceSnapshot.durationMinutes}m)
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment quick summary drawer if clicked */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setSelectedAppointment(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#141412] border-2 border-[#E5E3DB] dark:border-[rgba(228,193,116,0.3)] shadow-2xl p-6 z-10 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#868A94]">
                {selectedAppointment.appointmentNumber}
              </span>
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {selectedAppointment.status.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-lg text-[#111318] dark:text-[#F7F3EB]">
                {selectedAppointment.customerName}
              </h3>
              <p className="text-xs text-[#60646C] dark:text-[#D0CBC1]">
                {selectedAppointment.serviceSnapshot.name} ({selectedAppointment.serviceSnapshot.durationMinutes} min)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#1A1916] text-xs space-y-1">
              <p>Stylist: <strong>{selectedAppointment.staffName}</strong></p>
              <p>
                Time: {formatTimeLabel(selectedAppointment.startIso.split('T')[1].substring(0, 5))} -{' '}
                {formatTimeLabel(selectedAppointment.endIso.split('T')[1].substring(0, 5))}
              </p>
              <p>Fee: {formatMinorUnits(selectedAppointment.price, selectedAppointment.currency)}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAppointment(null)}
              className="w-full py-2 rounded-xl bg-[#3027F5] dark:bg-[#E4C174] text-white dark:text-[#11100D] font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
