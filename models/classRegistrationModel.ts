import prisma from "./prismaClient";
import { ClassRegistration, FitnessClass, Prisma } from "../generated/prisma/client";

export type CreateClassRegistrationInput = Prisma.ClassRegistrationCreateInput;
export type UpdateClassRegistrationInput = Prisma.ClassRegistrationUpdateInput;

export async function createClassRegistration(
  input: CreateClassRegistrationInput
): Promise<ClassRegistration> {
  return prisma.classRegistration.create({ data: input });
}

export async function getClassRegistrationById(
  id: number
): Promise<ClassRegistration | null> {
  return prisma.classRegistration.findUnique({ where: { id } });
}

export async function listRegistrationsForClass(
  fitnessClassId: number
): Promise<ClassRegistration[]> {
  return prisma.classRegistration.findMany({
    where: { fitnessClassId },
    orderBy: { registeredAt: "asc" },
  });
}

export async function listRegistrationsForMember(
  memberId: number
): Promise<ClassRegistration[]> {
  return prisma.classRegistration.findMany({
    where: { memberId },
    orderBy: { registeredAt: "desc" },
  });
}

export async function updateClassRegistration(
  id: number,
  data: UpdateClassRegistrationInput
): Promise<ClassRegistration> {
  return prisma.classRegistration.update({
    where: { id },
    data,
  });
}

export async function deleteClassRegistration(
  id: number
): Promise<ClassRegistration> {
  return prisma.classRegistration.delete({ where: { id } });
}

export async function listRegistrationsForMemberWithFitnessClass(
  memberId: number
): Promise<(ClassRegistration & { fitnessClass: FitnessClass })[]> {
  return prisma.classRegistration.findMany({
    where: { memberId },
    include: {
      fitnessClass: true,
    },
    orderBy: {
      fitnessClass: {
        startTime: "asc",
      },
    },
  });
}
