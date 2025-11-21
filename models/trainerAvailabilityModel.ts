import prisma from "./prismaClient";
import { TrainerAvailability, Prisma } from "../generated/prisma/client";

export type CreateTrainerAvailabilityInput =
  Prisma.TrainerAvailabilityCreateInput;
export type UpdateTrainerAvailabilityInput =
  Prisma.TrainerAvailabilityUpdateInput;

export async function createTrainerAvailability(
  input: CreateTrainerAvailabilityInput
): Promise<TrainerAvailability> {
  return prisma.trainerAvailability.create({ data: input });
}

export async function getTrainerAvailabilityById(
  id: number
): Promise<TrainerAvailability | null> {
  return prisma.trainerAvailability.findUnique({ where: { id } });
}

export async function listTrainerAvailabilitiesForTrainer(
  trainerId: number
): Promise<TrainerAvailability[]> {
  return prisma.trainerAvailability.findMany({
    where: { trainerId },
    orderBy: { id: "asc" },
  });
}

export async function updateTrainerAvailability(
  id: number,
  data: UpdateTrainerAvailabilityInput
): Promise<TrainerAvailability> {
  return prisma.trainerAvailability.update({
    where: { id },
    data,
  });
}

export async function deleteTrainerAvailability(
  id: number
): Promise<TrainerAvailability> {
  return prisma.trainerAvailability.delete({ where: { id } });
}
