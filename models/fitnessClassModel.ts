import prisma from "./prismaClient";
import { FitnessClass, Prisma } from "../generated/prisma/client";

export type CreateFitnessClassInput = Prisma.FitnessClassCreateInput;
export type UpdateFitnessClassInput = Prisma.FitnessClassUpdateInput;

export async function createFitnessClass(
  input: CreateFitnessClassInput
): Promise<FitnessClass> {
  return prisma.fitnessClass.create({ data: input });
}

export async function getFitnessClassById(
  id: number
): Promise<FitnessClass | null> {
  return prisma.fitnessClass.findUnique({ where: { id } });
}

export async function listUpcomingFitnessClasses(): Promise<FitnessClass[]> {
  const now = new Date();
  return prisma.fitnessClass.findMany({
    where: { startTime: { gt: now } },
    orderBy: { startTime: "asc" },
  });
}

export async function updateFitnessClass(
  id: number,
  data: UpdateFitnessClassInput
): Promise<FitnessClass> {
  return prisma.fitnessClass.update({
    where: { id },
    data,
  });
}

export async function deleteFitnessClass(id: number): Promise<FitnessClass> {
  return prisma.fitnessClass.delete({ where: { id } });
}
