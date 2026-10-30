import type {
  SalonService,
  StaffProfile,
  SalonAppointment,
  TimeSlot,
} from '../types/salon';

/**
 * Format a 24h time string 'HH:mm' into standard 12h label 'h:mm A'
 */
export function formatTimeLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Parse HH:mm to minutes from midnight
 */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to HH:mm string
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
}

/**
 * Convert YYYY-MM-DD + HH:mm into ISO datetime string without UTC timezone shift
 */
export function combineDateAndTimeToIso(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}

/**
 * Check if two time intervals overlap: [startA, endA) and [startB, endB)
 */
export function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Core Scheduling Utility:
 * Calculates all available time slots for a given service, date, and staff member(s).
 */
export function calculateAvailableSlots(params: {
  service: SalonService;
  staffList: StaffProfile[];
  appointments: SalonAppointment[];
  date: string; // YYYY-MM-DD
  targetStaffId?: string; // Specific staff ID or undefined for "any"
  slotIntervalMinutes?: number; // Default 15
}): TimeSlot[] {
  const {
    service,
    staffList,
    appointments,
    date,
    targetStaffId,
    slotIntervalMinutes = 15,
  } = params;

  if (!service.isEnabled) {
    return [];
  }

  // Parse target date to get dayOfWeek (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
  const targetDateObj = new Date(year, month - 1, day);
  const dayOfWeek = targetDateObj.getDay();

  // Filter eligible and active staff
  const eligibleStaff = staffList.filter((stf) => {
    if (!stf.isActive) return false;
    // Must be assigned to this service
    if (!stf.assignedServiceIds.includes(service.id)) return false;
    // If a specific staff was requested, match ID
    if (targetStaffId && targetStaffId !== 'any' && stf.id !== targetStaffId) {
      return false;
    }
    return true;
  });

  if (eligibleStaff.length === 0) {
    return [];
  }

  // Service execution duration plus buffer
  const serviceDuration = service.durationMinutes;
  const totalOccupiedMinutes = serviceDuration + (service.bufferAfterMinutes || 0);

  // Active appointments on this date (excluding cancelled)
  const activeAppointmentsOnDate = appointments.filter((apt) => {
    if (apt.status === 'cancelled') return false;
    return apt.startIso.startsWith(date);
  });

  const slotsMap = new Map<string, TimeSlot>();

  // Evaluate candidate slots for each eligible staff member
  for (const staff of eligibleStaff) {
    const daySchedule = staff.schedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.isOpen) {
      continue;
    }

    const workStart = timeToMinutes(daySchedule.startTime);
    const workEnd = timeToMinutes(daySchedule.endTime);

    const staffAppointments = activeAppointmentsOnDate.filter((a) => a.staffId === staff.id);
    const staffBlocked = (staff.blockedPeriods || []).filter((b) => b.date === date);

    // Step through candidate times in increments of slotIntervalMinutes
    for (
      let candidateStart = workStart;
      candidateStart + serviceDuration <= workEnd;
      candidateStart += slotIntervalMinutes
    ) {
      const candidateEnd = candidateStart + serviceDuration;
      const candidateOccupiedEnd = candidateStart + totalOccupiedMinutes;

      // 1. Must fit completely within working hours
      if (candidateOccupiedEnd > workEnd) {
        continue;
      }

      // 2. Check overlap with breaks
      let conflictsWithBreak = false;
      for (const brk of daySchedule.breaks) {
        const brkStart = timeToMinutes(brk.startTime);
        const brkEnd = timeToMinutes(brk.endTime);
        if (isOverlapping(candidateStart, candidateOccupiedEnd, brkStart, brkEnd)) {
          conflictsWithBreak = true;
          break;
        }
      }
      if (conflictsWithBreak) continue;

      // 3. Check overlap with blocked periods
      let conflictsWithBlocked = false;
      for (const blk of staffBlocked) {
        const blkStart = timeToMinutes(blk.startTime);
        const blkEnd = timeToMinutes(blk.endTime);
        if (isOverlapping(candidateStart, candidateOccupiedEnd, blkStart, blkEnd)) {
          conflictsWithBlocked = true;
          break;
        }
      }
      if (conflictsWithBlocked) continue;

      // 4. Check overlap with existing appointments
      let conflictsWithAppointment = false;
      for (const apt of staffAppointments) {
        const aptStartDate = new Date(apt.startIso);
        const aptEndDate = new Date(apt.endIso);
        const aptStartMins = aptStartDate.getHours() * 60 + aptStartDate.getMinutes();
        const aptEndMins = aptEndDate.getHours() * 60 + aptEndDate.getMinutes();

        // Also include service buffer of the existing appointment if applicable
        const bufferAfter = apt.serviceSnapshot?.bufferAfterMinutes || 0;
        const totalAptOccupiedEnd = aptEndMins + bufferAfter;

        if (isOverlapping(candidateStart, candidateOccupiedEnd, aptStartMins, totalAptOccupiedEnd)) {
          conflictsWithAppointment = true;
          break;
        }
      }
      if (conflictsWithAppointment) continue;

      // Slot is valid for this staff member!
      const timeStr = minutesToTime(candidateStart);
      const startIso = combineDateAndTimeToIso(date, timeStr);
      const endTimeStr = minutesToTime(candidateEnd);
      const endIso = combineDateAndTimeToIso(date, endTimeStr);

      const slotKey = timeStr;
      if (!slotsMap.has(slotKey)) {
        slotsMap.set(slotKey, {
          startTime: startIso,
          endTime: endIso,
          timeLabel: formatTimeLabel(timeStr),
          timeHhmm: timeStr,
          staffId: staff.id,
          staffName: staff.displayName,
          isAvailable: true,
        });
      }
    }
  }

  // Convert map to sorted list by start time
  return Array.from(slotsMap.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Validates whether a specific requested appointment slot is currently conflict-free
 */
export function validateSlotAvailability(params: {
  service: SalonService;
  staff: StaffProfile;
  appointments: SalonAppointment[];
  date: string;
  startTimeHhmm: string;
  excludeAppointmentId?: string; // Used when rescheduling
}): { isAvailable: boolean; conflictReason?: string } {
  const { service, staff, appointments, date, startTimeHhmm, excludeAppointmentId } = params;

  if (!service.isEnabled) {
    return { isAvailable: false, conflictReason: 'This service is currently unavailable.' };
  }
  if (!staff.isActive) {
    return { isAvailable: false, conflictReason: 'Staff professional is currently inactive.' };
  }
  if (!staff.assignedServiceIds.includes(service.id)) {
    return { isAvailable: false, conflictReason: `${staff.displayName} does not perform this service.` };
  }

  const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const schedule = staff.schedule.find((s) => s.dayOfWeek === dayOfWeek);

  if (!schedule || !schedule.isOpen) {
    return { isAvailable: false, conflictReason: `${staff.displayName} is off duty on this day.` };
  }

  const reqStart = timeToMinutes(startTimeHhmm);
  const reqOccupiedEnd = reqStart + service.durationMinutes + (service.bufferAfterMinutes || 0);

  const workStart = timeToMinutes(schedule.startTime);
  const workEnd = timeToMinutes(schedule.endTime);

  if (reqStart < workStart || reqOccupiedEnd > workEnd) {
    return {
      isAvailable: false,
      conflictReason: `Requested time falls outside working hours (${formatTimeLabel(schedule.startTime)} - ${formatTimeLabel(schedule.endTime)}).`,
    };
  }

  // Check breaks
  for (const brk of schedule.breaks) {
    const brkStart = timeToMinutes(brk.startTime);
    const brkEnd = timeToMinutes(brk.endTime);
    if (isOverlapping(reqStart, reqOccupiedEnd, brkStart, brkEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Selected time conflicts with ${staff.displayName}'s scheduled break (${brk.name}).`,
      };
    }
  }

  // Check blocked periods
  const blocked = (staff.blockedPeriods || []).filter((b) => b.date === date);
  for (const blk of blocked) {
    const blkStart = timeToMinutes(blk.startTime);
    const blkEnd = timeToMinutes(blk.endTime);
    if (isOverlapping(reqStart, reqOccupiedEnd, blkStart, blkEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Selected time is blocked: ${blk.reason || 'Unavailable'}.`,
      };
    }
  }

  // Check appointments
  const conflictingApts = appointments.filter((apt) => {
    if (apt.id === excludeAppointmentId) return false;
    if (apt.status === 'cancelled') return false;
    if (apt.staffId !== staff.id) return false;
    return apt.startIso.startsWith(date);
  });

  for (const apt of conflictingApts) {
    const aptStartDate = new Date(apt.startIso);
    const aptEndDate = new Date(apt.endIso);
    const aptStartMins = aptStartDate.getHours() * 60 + aptStartDate.getMinutes();
    const aptEndMins = aptEndDate.getHours() * 60 + aptEndDate.getMinutes();
    const buffer = apt.serviceSnapshot?.bufferAfterMinutes || 0;

    if (isOverlapping(reqStart, reqOccupiedEnd, aptStartMins, aptEndMins + buffer)) {
      return {
        isAvailable: false,
        conflictReason: `Time slot already booked for ${apt.serviceSnapshot?.name || 'another appointment'}.`,
      };
    }
  }

  return { isAvailable: true };
}
