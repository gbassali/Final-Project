import { TrainerAvailability } from "../generated/prisma/client";

export function timeIntervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function convertToDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
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

  // Check if same weekday
  if (availability.dayOfWeek !== start.getDay()) {
    return false;
  }

  // Use minutes since midnight for time comparison
  if (start.toDateString() !== end.toDateString()) {
    return false;
  }

  const startMinutes = minutesSinceMidnight(start);
  const endMinutes = minutesSinceMidnight(end);
  const availStartMinutes = minutesSinceMidnight(availability.startTime);
  const availEndMinutes = minutesSinceMidnight(availability.endTime);

  return availStartMinutes <= startMinutes && availEndMinutes >= endMinutes;
}
