import prisma from "./prismaClient";
import { Trainer, Prisma } from "../generated/prisma/client";

export type CreateTrainerInput = Prisma.TrainerCreateInput;
export type UpdateTrainerInput = Prisma.TrainerUpdateInput;

export async function createTrainer(input: CreateTrainerInput): Promise<Trainer> {
  return prisma.trainer.create({ data: input });
}

export async function getTrainerById(id: number): Promise<Trainer | null> {
  return prisma.trainer.findUnique({ where: { id } });
}

export async function listTrainers(): Promise<Trainer[]> {
  return prisma.trainer.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateTrainer(
  id: number,
  data: UpdateTrainerInput
): Promise<Trainer> {
  return prisma.trainer.update({
    where: { id },
    data,
  });
}

export async function deleteTrainer(id: number): Promise<Trainer> {
  return prisma.trainer.delete({ where: { id } });
}
