import prisma from "./prismaClient";
import { Member, Prisma } from "../generated/prisma/client";

export type CreateMemberInput = Prisma.MemberCreateInput;
export type UpdateMemberInput = Prisma.MemberUpdateInput;

export async function createMember(input: CreateMemberInput): Promise<Member> {
  return prisma.member.create({
    data: input,
  });
}

export async function getMemberById(id: number): Promise<Member | null> {
  return prisma.member.findUnique({
    where: { id },
  });
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  return prisma.member.findUnique({
    where: { email },
  });
}

export async function listMembers(): Promise<Member[]> {
  return prisma.member.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateMember(id: number, data: UpdateMemberInput): Promise<Member> {
  return prisma.member.update({
    where: { id },
    data,
  });
}

export async function deleteMember(id: number): Promise<Member> {
  return prisma.member.delete({
    where: { id },
  });
}
