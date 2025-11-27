import { Session, FitnessClass } from "../generated/prisma/client";
import { getFitnessClassById, updateFitnessClass } from "../models/fitnessClassModel";
import prisma from "../models/prismaClient";
import { getRoomById } from "../models/roomModel";
import { getSessionById, updateSession } from "../models/sessionModel";


async function ensureRoomIsFreeForInterval(params: { roomId: number; start: Date; end: Date; ignoreSessionId?: number; ignoreClassId?: number; }): Promise<void> {
  const { roomId, start, end, ignoreSessionId, ignoreClassId } = params;

  // Check conflicting PT sessions
  const conflictingSession = await prisma.session.findFirst({
    where: {
      roomId,
      ...(ignoreSessionId && { NOT: { id: ignoreSessionId } }),
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (conflictingSession) {
    throw new Error( `Room is already booked for another PT session (id=${conflictingSession.id}) during this time.`);
  }

  // Check conflicting classes
  const conflictingClass = await prisma.fitnessClass.findFirst({
    where: {
      roomId,
      ...(ignoreClassId && { NOT: { id: ignoreClassId } }),
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (conflictingClass) {
    throw new Error(`Room is already booked for a class (id=${conflictingClass.id}) during this time.`);
  }
}

/**
 * Assign/change the room for a PT session.
 * Prevents double-booking of the room.
 */
export async function assignRoomToSession(sessionId: number, roomId: number): Promise<Session> {
  const [session, room] = await Promise.all([
    getSessionById(sessionId),
    getRoomById(roomId),
  ]);

  if (!session) { throw new Error(`Session with id ${sessionId} not found.`); }
  if (!room) { throw new Error(`Room with id ${roomId} not found.`); }

  // Ensure room is free for the session's time window
  await ensureRoomIsFreeForInterval({
    roomId,
    start: session.startTime,
    end: session.endTime,
    ignoreSessionId: session.id,
  });

  // Assign the room
  return updateSession(session.id, {
    room: { connect: { id: roomId } },
  });
}

/**
 * Assign/change the room for a group fitness class.
 * Prevents double-booking.
 */
export async function assignRoomToClass(fitnessClassId: number, roomId: number): Promise<FitnessClass> {
  const [fitnessClass, room] = await Promise.all([
    getFitnessClassById(fitnessClassId),
    getRoomById(roomId),
  ]);

  if (!fitnessClass) { throw new Error(`FitnessClass with id ${fitnessClassId} not found.`); }
  if (!room) { throw new Error(`Room with id ${roomId} not found.`); }

  // Ensure class capacity does not exceed room capacity
  if (fitnessClass.capacity > room.capacity) {
    throw new Error( `Class capacity (${fitnessClass.capacity}) exceeds room capacity (${room.capacity}).`);
  }

  // Ensure room is free for this class's time window
  await ensureRoomIsFreeForInterval({
    roomId,
    start: fitnessClass.startTime,
    end: fitnessClass.endTime,
    ignoreClassId: fitnessClass.id,
  });

  // Assign the room
  return updateFitnessClass(fitnessClass.id, {
    room: { connect: { id: roomId } },
  });
}