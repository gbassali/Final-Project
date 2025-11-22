import prisma from "./prismaClient";
import { FitnessGoals, Prisma } from "../generated/prisma/client";

export type CreateFitnessGoalsInput = {
  value: string;
  active?: boolean;
  recordedAt?: Date;
};
export type UpdateFitnessGoalsInput = Prisma.FitnessGoalsUpdateInput;

// export async function createFitnessGoal(
//   input: CreateFitnessGoalsInput
// ): Promise<FitnessGoals> {
//   return prisma.fitnessGoals.create({ data: input });
// }

export async function createFitnessGoalForMember(memberId: number, data: CreateFitnessGoalsInput): Promise<FitnessGoals> {
  return prisma.fitnessGoals.create({
    data: {
      value: data.value,
      active: data.active ?? true,
      recordedAt: data.recordedAt,
      member: {
        connect: { id: memberId },
      },
    },
  });
}

export async function getFitnessGoalById(id: number): Promise<FitnessGoals | null> {
  return prisma.fitnessGoals.findUnique({ where: { id } });
}

export async function getFitnessGoalsForMember(
  memberId: number
): Promise<FitnessGoals[]> {
  return prisma.fitnessGoals.findMany({
    where: { memberId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function updateFitnessGoal(
  id: number,
  data: UpdateFitnessGoalsInput
): Promise<FitnessGoals> {
  return prisma.fitnessGoals.update({
    where: { id },
    data,
  });
}

export async function deleteFitnessGoal(id: number): Promise<FitnessGoals> {
  return prisma.fitnessGoals.delete({ where: { id } });
}
