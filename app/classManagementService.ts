import { FitnessClass, TrainerAvailability, AvailabilityType, Prisma } from "../generated/prisma/client";
import { createFitnessClass, getFitnessClassById, updateFitnessClass } from "../models/fitnessClassModel";
import prisma from "../models/prismaClient";
import { getRoomById } from "../models/roomModel";
import { listTrainerAvailabilitiesForTrainer } from "../models/trainerAvailabilityModel";
import { ensureRoomExists, roomHasConflict } from "./roomService";
import { ensureTrainerExists, trainerHasConflict } from "./trainerService";
import { convertToDate, isTimeWithinOneTimeAvailability, isTimeWithinWeeklyAvailability } from "./utilService";

export interface CreateClassInput {
  name: string;
  trainerId: number;
  roomId: number;
  startTime: Date | string;
  endTime: Date | string;
  capacity: number;
}

export interface UpdateClassScheduleInput {
  fitnessClassId: number;
  trainerId?: number;
  roomId?: number;
  startTime?: Date | string;
  endTime?: Date | string;
  capacity?: number;
}

/**
 * Create a new fitness class knowing:
 * - trainer & room exist
 * - trainer is available and has no conflicts (sessions/classes)
 * - room is free (sessions/classes)
 * - capacity fits room
 */
export async function createClassWithValidation(input: CreateClassInput): Promise<FitnessClass> {
  const start = convertToDate(input.startTime);
  const end = convertToDate(input.endTime);

  // Time checks
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid startTime or endTime.");
  }
  if (start >= end) {
    throw new Error("startTime must be before endTime.");
  }
  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    throw new Error("capacity must be a positive integer.");
  }

  // Existence & capacity of trainer/room
  await Promise.all([
    ensureTrainerExists(input.trainerId),
    ensureRoomExists(input.roomId),
    ensureCapacityFitsRoom(input.capacity, input.roomId),
  ]);

  // Trainer availability
  await ensureTrainerAvailableForClass(input.trainerId, start, end);

  // Trainer schedule conflicts (sessions or classes)
  if (await trainerHasConflict(input.trainerId, start, end)) {
    throw new Error("Trainer already has a session or class during this time.");
  }

  // Room conflicts (sessions or classes)
  if (await roomHasConflict(input.roomId, start, end)) {
    throw new Error("Room is already booked during this time.");
  }

  // Create class
  return createFitnessClass({
    name: input.name,
    capacity: input.capacity,
    startTime: start,
    endTime: end,
    trainer: { connect: { id: input.trainerId } },
    room: { connect: { id: input.roomId } },
  });
}

/**
 * Update an existing class's schedule/assignment:
 * - trainerId, roomId, start/end time, capacity
 *
 * Re-validates:
 * - trainer & room exist
 * - trainer availability
 * - trainer conflicts (ignore this class)
 * - room conflicts (ignore this class)
 * - capacity fits room
 * - capacity not less than existing registrations
 */
export async function updateClassSchedule(input: UpdateClassScheduleInput): Promise<FitnessClass> {
  const existing = await getFitnessClassById(input.fitnessClassId);
  if (!existing) {
    throw new Error(`FitnessClass with id ${input.fitnessClassId} not found.`);
  }

  const trainerId = input.trainerId ?? existing.trainerId;
  const roomId = input.roomId ?? existing.roomId;

  const start = input.startTime ? convertToDate(input.startTime) : existing.startTime;
  const end = input.endTime ? convertToDate(input.endTime) : existing.endTime;

  if (start >= end) {
    throw new Error("startTime must be before endTime.");
  }

  const capacity = input.capacity ?? existing.capacity;
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new Error("capacity must be a positive integer.");
  }

  await Promise.all([
    ensureTrainerExists(trainerId),
    ensureRoomExists(roomId),
    ensureCapacityFitsRoom(capacity, roomId),
    ensureCapacityNotBelowRegistrations(existing.id, capacity),
  ]);

  // Trainer availability for the new time
  await ensureTrainerAvailableForClass(trainerId, start, end);

  // Trainer conflicts (ignore this class)
  if (await trainerHasConflict(trainerId, start, end, {ignoreClassId: existing.id})) {
    throw new Error("Trainer already has a session or class during this time.");
  }

  // Room conflicts (ignore this class)
  if (await roomHasConflict(roomId, start, end, {ignoreClassId: existing.id})) {
    throw new Error("Room is already booked during this time.");
  }

  const data: Prisma.FitnessClassUpdateInput = {
    startTime: start,
    endTime: end,
    capacity,
  };

  // Attach new trainer/room if specified
  if (trainerId !== existing.trainerId) {
    (data as Prisma.FitnessClassUpdateInput).trainer = {
      connect: { id: trainerId },
    };
  }

  if (roomId !== existing.roomId) {
    (data as Prisma.FitnessClassUpdateInput).room = {
      connect: { id: roomId },
    };
  }

  return updateFitnessClass(existing.id, data);
}

/**
 * Check that the trainer has at least one availability slot
 * that fully covers the start to end for this class.
 */
async function ensureTrainerAvailableForClass(trainerId: number, start: Date, end: Date): Promise<void> {
  const availabilities = await listTrainerAvailabilitiesForTrainer(trainerId);

  const hasCoveringSlot = availabilities.some((a) => {
    if (a.type === AvailabilityType.ONE_TIME) {
      return isTimeWithinOneTimeAvailability(start, end, a);
    }
    if (a.type === AvailabilityType.WEEKLY) {
      return isTimeWithinWeeklyAvailability(start, end, a);
    }
    return false;
  });

  if (!hasCoveringSlot) {
    throw new Error("Trainer is not available during the requested class time.");
  }
}

/**
 * Ensure class capacity does not exceed room capacity.
 */
async function ensureCapacityFitsRoom(capacity: number, roomId: number): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new Error(`Room with id ${roomId} not found.`);
  }

  if (capacity > room.capacity) {
    throw new Error(`Class capacity (${capacity}) exceeds room capacity (${room.capacity}).`);
  }
}

/**
 * Ensure we don't reduce capacity below current registrations (for updates).
 */
async function ensureCapacityNotBelowRegistrations(fitnessClassId: number, newCapacity: number): Promise<void> {
  const currentRegistrations = await prisma.classRegistration.count({
    where: { fitnessClassId },
  });

  if (newCapacity < currentRegistrations) {
    throw new Error(`New capacity (${newCapacity}) is less than current registrations (${currentRegistrations}).`);
  }
}