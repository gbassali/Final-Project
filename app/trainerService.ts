import prisma from "../models/prismaClient";
import { listSessionsForTrainer } from "../models/sessionModel";
import { getTrainerById } from "../models/trainerModel";
import { timeIntervalsOverlap } from "./utilService";

export async function ensureTrainerExists(trainerId: number): Promise<void> {
  const trainer = await getTrainerById(trainerId);
  if (!trainer) {
    throw new Error(`Trainer with id ${trainerId} not found.`);
  }
}

export async function trainerHasConflict(trainerId: number, start: Date, end: Date, options?: { ignoreSessionId?: number }): Promise<boolean> {
  const sessions = await listSessionsForTrainer(trainerId);
  const hasSessionConflict = sessions.some((s) => {
    if (options?.ignoreSessionId && s.id === options.ignoreSessionId) {
      return false;
    }
    return timeIntervalsOverlap(start, end, s.startTime, s.endTime);
  });

  if (hasSessionConflict) return true;

  // Trainer's group classes
  const classes = await prisma.fitnessClass.findMany({ //maybe implement as model function
    where: { trainerId },
  });

  const hasClassConflict = classes.some((c) =>
    timeIntervalsOverlap(start, end, c.startTime, c.endTime)
  );

  return hasClassConflict;
}
