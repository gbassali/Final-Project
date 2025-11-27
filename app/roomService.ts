import prisma from "../models/prismaClient";
import { getRoomById } from "../models/roomModel";
import { timeIntervalsOverlap } from "./utilService";

export async function ensureRoomExists(roomId: number): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new Error(`Room with id ${roomId} not found.`);
  }
}

export async function roomHasConflict(roomId: number, start: Date, end: Date, options?: { ignoreSessionId?: number; ignoreClassId?: number }): Promise<boolean> {
  // Room PT sessions
  const sessions = await prisma.session.findMany({
    where: { roomId },
  });

  const hasSessionConflict = sessions.some((s) => {
    if (options?.ignoreSessionId && s.id === options.ignoreSessionId) {
      return false;
    }
    return timeIntervalsOverlap(start, end, s.startTime, s.endTime);
  });

  if (hasSessionConflict) return true;

  // Room classes
  const classes = await prisma.fitnessClass.findMany({
    where: { roomId },
  });

  const hasClassConflict = classes.some((c) => {
    if (options?.ignoreClassId && c.id === options.ignoreClassId) {
      return false;
    }
    return timeIntervalsOverlap(start, end, c.startTime, c.endTime)
  }
  );
  return hasClassConflict;
}