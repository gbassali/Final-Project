import { Session, AvailabilityType } from "../generated/prisma/client";
import { createSession, getSessionById, updateSession } from "../models/sessionModel";
import { listTrainerAvailabilitiesForTrainer } from "../models/trainerAvailabilityModel";
import { getMemberById } from "../models/memberModel";
import { getTrainerById } from "../models/trainerModel";
import { getRoomById } from "../models/roomModel";
import { convertToDate, isTimeWithinOneTimeAvailability, isTimeWithinWeeklyAvailability } from "./utilService";
import { memberHasConflict } from "./memberService";
import { roomHasConflict } from "./roomService";
import { trainerHasConflict } from "./trainerService";

export interface BookPtSessionInput {
  memberId: number;
  trainerId: number;
  roomId: number;
  startTime: Date | string;
  endTime: Date | string;
}

export interface ReschedulePtSessionInput {
  sessionId: number;
  newStartTime: Date | string;
  newEndTime: Date | string;
  newTrainerId?: number;
  newRoomId?: number;
}

export async function bookPtSession(input: BookPtSessionInput): Promise<Session> {
  const start = convertToDate(input.startTime);
  const end = convertToDate(input.endTime);

  // Validate input times
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new Error("Invalid startTime.");
  }
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    throw new Error("Invalid endTime.");
  }
  if (start >= end) {
    throw new Error("startTime must be before endTime.");
  }

  const member = await getMemberById(input.memberId);
  const trainer = await getTrainerById(input.trainerId);
  const room = await getRoomById(input.roomId);

  if (!member) { throw new Error(`Member with id ${input.memberId} not found.`); }
  if (!trainer) { throw new Error(`Trainer with id ${input.trainerId} not found.`); }
  if (!room) { throw new Error(`Room with id ${input.roomId} not found.`); }

  // 1) Check Trainer availability
  await ensureTrainerAvailableForSlot(input.trainerId, start, end);

  // 2) Check if Trainer has conflict
  if (await trainerHasConflict(input.trainerId, start, end)) {
    throw new Error(
      "Trainer already has a session or class during this time."
    );
  }

  // 3) Check if Member has conflict
  if (await memberHasConflict(input.memberId, start, end)) {
    throw new Error(
      "Member already has a session or class during this time."
    );
  }

  // 4) Check if Room has conflict
  if (await roomHasConflict(input.roomId, start, end)) {
    throw new Error("Room is already booked during this time.");
  }

  // 5) Everything is fine --> Create the session
  return createSession({
    member: { connect: { id: input.memberId } },
    trainer: { connect: { id: input.trainerId } },
    room: { connect: { id: input.roomId } },
    startTime: start,
    endTime: end,
  });
}

export async function reschedulePtSession(input: ReschedulePtSessionInput): Promise<Session> {
  const existing = await getSessionById(input.sessionId);
  if (!existing) {
    throw new Error(`Session with id ${input.sessionId} not found.`);
  }

  const start = convertToDate(input.newStartTime);
  const end = convertToDate(input.newEndTime);

  // Validate input times
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new Error("Invalid startTime.");
  }
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    throw new Error("Invalid endTime.");
  }
  if (start >= end) {
    throw new Error("newStartTime must be before newEndTime.");
  }

  // Determine if new trainer or room is specified
  const trainerId = input.newTrainerId ?? existing.trainerId;
  const roomId = input.newRoomId ?? existing.roomId;

  if (roomId == null) {
    throw new Error("Room is required for PT sessions.");
  }

  const member = await getMemberById(existing.memberId);
  const trainer = await getTrainerById(trainerId);
  const room = await getRoomById(roomId);

  if (!member) { throw new Error(`Member with id ${existing.memberId} not found.`); }
  if (!trainer) { throw new Error(`Trainer with id ${trainerId} not found.`); }
  if (!room) { throw new Error(`Room with id ${roomId} not found.`); }

  // 1) Check Trainer availability
  await ensureTrainerAvailableForSlot(trainerId, start, end);

  // 2) Check if Trainer has conflict (ignore this session's own ID when checking conflicts)
  if (await trainerHasConflict(trainerId, start, end, { ignoreSessionId: existing.id })) {
    throw new Error(
      "Trainer already has a session or class during this time."
    );
  }

  // 3) Check if Member has conflict (same member)
  if (await memberHasConflict(existing.memberId, start, end, { ignoreSessionId: existing.id })) {
    throw new Error(
      "Member already has a session or class during this time."
    );
  }

  // 4) Check if Room has conflict
  if (await roomHasConflict(roomId, start, end, { ignoreSessionId: existing.id })) {
    throw new Error("Room is already booked during this time.");
  }

  // 5) Everything is fine --> Update the session
  return updateSession(existing.id, {
    trainer: trainerId !== existing.trainerId ? { connect: { id: trainerId } } : undefined, // Don't update if same trainer
    room: roomId !== existing.roomId ? { connect: { id: roomId } } : undefined, // Don't update if same room
    startTime: start,
    endTime: end,
  });
}


async function ensureTrainerAvailableForSlot(trainerId: number, start: Date, end: Date): Promise<void> {
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
    throw new Error(
      "Trainer is not available during the requested time."
    );
  }
}

//move helpers into generic servicess!!