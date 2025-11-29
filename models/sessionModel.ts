import prisma from "./prismaClient";
import { Session, Prisma } from "../generated/prisma/client";

export type CreateSessionInput = Prisma.SessionCreateInput;
export type UpdateSessionInput = Prisma.SessionUpdateInput;

export async function createSession(
  input: CreateSessionInput
): Promise<Session> {
  return prisma.session.create({ data: input });
}

export async function getSessionById(id: number): Promise<Session | null> {
  return prisma.session.findUnique({ where: { id } });
}

export async function listSessionsForMember(
  memberId: number
): Promise<Session[]> {
  return prisma.session.findMany({
    where: { memberId },
    orderBy: { startTime: "asc" },
  });
}

export async function listSessionsForMemberWithDetails(
  memberId: number
) {
  return prisma.session.findMany({
    where: { memberId },
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
          capacity: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function listSessionsForTrainer(
  trainerId: number
): Promise<Session[]> {
  return prisma.session.findMany({
    where: { trainerId },
    orderBy: { startTime: "asc" },
  });
}

export async function listSessionsForTrainerWithDetails(trainerId: number) {
  return prisma.session.findMany({
    where: { trainerId },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function updateSession(
  id: number,
  data: UpdateSessionInput
): Promise<Session> {
  return prisma.session.update({
    where: { id },
    data,
  });
}

export async function deleteSession(id: number): Promise<Session> {
  return prisma.session.delete({ where: { id } });
}
