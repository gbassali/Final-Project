import { TrainerAvailability } from "../generated/prisma/client";

export function timeIntervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function convertToDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function minutesSinceMidnightLocal(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function minutesSinceMidnightUTC(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function isTimeWithinOneTimeAvailability(start: Date, end: Date, availability: TrainerAvailability): boolean {
  if (!availability.startDateTime || !availability.endDateTime) {
    return false;
  }
  return availability.startDateTime <= start && availability.endDateTime >= end;
}

export function isTimeWithinWeeklyAvailability(start: Date, end: Date, availability: TrainerAvailability): boolean {
  if (availability.dayOfWeek == null || !availability.startTime || !availability.endTime) {
    return false;
  }

  // Check if same weekday (using local day since that's what user selected)
  if (availability.dayOfWeek !== start.getDay()) {
    return false;
  }

  // Session must be on the same day
  if (start.toDateString() !== end.toDateString()) {
    return false;
  }

  // The requested session times are in local time (user's perspective)
  const startMinutes = minutesSinceMidnightLocal(start);
  const endMinutes = minutesSinceMidnightLocal(end);
  
  // Weekly availability times are stored as UTC (1970-01-01T11:00:00Z means 11:00)
  // so we need to read UTC hours/minutes to get the intended time
  const availStartMinutes = minutesSinceMidnightUTC(availability.startTime);
  const availEndMinutes = minutesSinceMidnightUTC(availability.endTime);

  return availStartMinutes <= startMinutes && availEndMinutes >= endMinutes;
}
