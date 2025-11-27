import { Session, FitnessClass } from "../generated/prisma/client";
import prisma from "../models/prismaClient";
import { ensureTrainerExists } from "./trainerService";


export async function getUpcomingSessionsForTrainer(trainerId: number): Promise<Session[]> {
  await ensureTrainerExists(trainerId);

  const now = new Date();
  return prisma.session.findMany({
    where: {
      trainerId,
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getUpcomingClassesForTrainer(trainerId: number): Promise<FitnessClass[]> {
  await ensureTrainerExists(trainerId);

  const now = new Date();
  return prisma.fitnessClass.findMany({
    where: {
      trainerId,
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
  });
}
