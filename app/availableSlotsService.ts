import { listTrainers } from "../models/trainerModel";
import { listTrainerAvailabilitiesForTrainer } from "../models/trainerAvailabilityModel";
import { listSessionsForTrainer } from "../models/sessionModel";
import { listFitnessClassesForTrainer } from "../models/fitnessClassModel";
import { AvailabilityType } from "../generated/prisma/client";

export type AvailableSlot = {
  trainerId: number;
  trainerName: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
};

export type AvailableSlotsForDate = {
  date: string;
  slots: AvailableSlot[];
};

// Standard 1-hour slots from 6am to 8pm
const SLOT_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/**
 * Get all available 1-hour slots for a given date across all trainers.
 * Returns slots where trainer has availability AND no conflicts.
 */
export async function getAvailableSlotsForDate(dateStr: string): Promise<AvailableSlotsForDate> {
  // Parse date string as local date (not UTC) by appending time
  const targetDate = new Date(`${dateStr}T12:00:00`);
  if (isNaN(targetDate.getTime())) {
    throw new Error("Invalid date");
  }

  const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon, etc.
  const trainers = await listTrainers();
  const allSlots: AvailableSlot[] = [];

  for (const trainer of trainers) {
    const availabilities = await listTrainerAvailabilitiesForTrainer(trainer.id);
    const sessions = await listSessionsForTrainer(trainer.id);
    const classes = await listFitnessClassesForTrainer(trainer.id);

    // For each possible hour slot
    for (const hour of SLOT_HOURS) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if trainer has availability covering this slot
      const hasCoverage = availabilities.some((avail) => {
        if (avail.type === AvailabilityType.WEEKLY) {
          if (avail.dayOfWeek !== dayOfWeek) return false;
          if (!avail.startTime || !avail.endTime) return false;
          
          // Weekly times are stored as UTC
          const availStartHour = avail.startTime.getUTCHours();
          const availEndHour = avail.endTime.getUTCHours();
          const availStartMin = avail.startTime.getUTCMinutes();
          const availEndMin = avail.endTime.getUTCMinutes();
          
          const availStartMinutes = availStartHour * 60 + availStartMin;
          const availEndMinutes = availEndHour * 60 + availEndMin;
          const slotStartMinutes = hour * 60;
          const slotEndMinutes = (hour + 1) * 60;
          
          return availStartMinutes <= slotStartMinutes && availEndMinutes >= slotEndMinutes;
        }
        
        if (avail.type === AvailabilityType.ONE_TIME) {
          if (!avail.startDateTime || !avail.endDateTime) return false;
          
          // Check if the one-time availability covers this date and time
          const availStart = avail.startDateTime;
          const availEnd = avail.endDateTime;
          
          // Build slot datetime for comparison
          const slotStartDate = new Date(`${dateStr}T${slotStart}:00`);
          const slotEndDate = new Date(`${dateStr}T${slotEnd}:00`);
          
          return availStart <= slotStartDate && availEnd >= slotEndDate;
        }
        
        return false;
      });

      if (!hasCoverage) continue;

      // Check for conflicts with existing sessions
      const slotStartDate = new Date(`${dateStr}T${slotStart}:00`);
      const slotEndDate = new Date(`${dateStr}T${slotEnd}:00`);

      const hasSessionConflict = sessions.some((s) => {
        const sStart = new Date(s.startTime);
        const sEnd = new Date(s.endTime);
        return sStart < slotEndDate && sEnd > slotStartDate;
      });

      if (hasSessionConflict) continue;

      // Check for conflicts with classes
      const hasClassConflict = classes.some((c) => {
        const cStart = new Date(c.startTime);
        const cEnd = new Date(c.endTime);
        return cStart < slotEndDate && cEnd > slotStartDate;
      });

      if (hasClassConflict) continue;

      // Slot is available!
      allSlots.push({
        trainerId: trainer.id,
        trainerName: trainer.name,
        startTime: slotStart,
        endTime: slotEnd,
      });
    }
  }

  // Sort by time, then by trainer name
  allSlots.sort((a, b) => {
    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.trainerName.localeCompare(b.trainerName);
  });

  return {
    date: dateStr,
    slots: allSlots,
  };
}

