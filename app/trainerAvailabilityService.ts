import { convertToDate, minutesSinceMidnight, timeIntervalsOverlap } from "./utilService";
import { ensureTrainerExists } from "./trainerService"
import { TrainerAvailability, AvailabilityType } from "../generated/prisma/client";
import { createTrainerAvailability, listTrainerAvailabilitiesForTrainer, CreateTrainerAvailabilityInput } from "../models/trainerAvailabilityModel";

// Make sure there is no overlapping one time availability for the trainer
async function ensureNoOneTimeOverlap(trainerId: number, start: Date, end: Date): Promise<void> {
  const allAvailabilites = await listTrainerAvailabilitiesForTrainer(trainerId);
  const oneTimeSlots = allAvailabilites.filter(
    (a) => a.type === AvailabilityType.ONE_TIME && a.startDateTime && a.endDateTime
  );

  const hasOverlap = oneTimeSlots.some((a) =>
    timeIntervalsOverlap(start, end, a.startDateTime!, a.endDateTime!)
  );

  if (hasOverlap) {
    throw new Error("New availability overlaps with an existing one-time availability for this trainer.");
  }
}

// Make sure there is no overlapping weekly availability for the trainer
async function ensureNoWeeklyOverlap(trainerId: number, dayOfWeek: number, startTime: Date, endTime: Date): Promise<void> {
  const allAvailabilites = await listTrainerAvailabilitiesForTrainer(trainerId);
  const weeklySlots = allAvailabilites.filter(
    (a) => a.type === AvailabilityType.WEEKLY && a.dayOfWeek === dayOfWeek && a.startTime && a.endTime
  );

  const newStartMinutes = minutesSinceMidnight(startTime);
  const newEndMinutes = minutesSinceMidnight(endTime);

  const hasOverlap = weeklySlots.some((a) => {
    const existingStart = minutesSinceMidnight(a.startTime!);
    const existingEnd = minutesSinceMidnight(a.endTime!);

    // Check if minutes overlap on the same day
    return newStartMinutes < existingEnd && newEndMinutes > existingStart;
  });

  if (hasOverlap) {
    throw new Error("New weekly availability overlaps with an existing weekly availability for this trainer on the same day.");
  }
}

export async function addOneTimeAvailabilityForTrainer(trainerId: number, startDateTime: Date | string, endDateTime: Date | string): Promise<TrainerAvailability> {
  await ensureTrainerExists(trainerId);

  const start = convertToDate(startDateTime);
  const end = convertToDate(endDateTime);

  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new Error("Invalid startDateTime.");
  }
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    throw new Error("Invalid endDateTime.");
  }
  if (start >= end) {
    throw new Error("startDateTime must be before endDateTime.");
  }

  // Prevent overlapping one time slots for this trainer
  await ensureNoOneTimeOverlap(trainerId, start, end);

  // Everything is fine --> create availability
  const input: CreateTrainerAvailabilityInput = {
    trainer: { connect: { id: trainerId } },
    type: AvailabilityType.ONE_TIME,
    startDateTime: start,
    endDateTime: end,
  };
  return createTrainerAvailability(input);
}

export async function addWeeklyAvailabilityForTrainer(trainerId: number, dayOfWeek: number, startTimeInput: Date | string, endTimeInput: Date | string): Promise<TrainerAvailability> {
  await ensureTrainerExists(trainerId);

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("dayOfWeek must be between 0 (Sunday) and 6 (Saturday).");
  }

  const startTime = convertToDate(startTimeInput);
  const endTime = convertToDate(endTimeInput);

  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    throw new Error("Invalid startTime.");
  }
  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    throw new Error("Invalid endTime.");
  }

  const startMinutes = minutesSinceMidnight(startTime);
  const endMinutes = minutesSinceMidnight(endTime);
  if (startMinutes >= endMinutes) {
    throw new Error("startTime must be before endTime (time-of-day).");
  }

  // Prevent overlapping weekly slots on same day of the week
  await ensureNoWeeklyOverlap(trainerId, dayOfWeek, startTime, endTime);

  const input: CreateTrainerAvailabilityInput = {
    trainer: { connect: { id: trainerId } },
    type: AvailabilityType.WEEKLY,
    dayOfWeek,
    startTime,
    endTime,
  };
  return createTrainerAvailability(input);
}
