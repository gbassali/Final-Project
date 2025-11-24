import { Prisma, Member } from "../generated/prisma/client";
import { getMemberByEmail, createMember } from "../models/memberModel";

export async function registerMember(data: Prisma.MemberCreateInput): Promise<Member> {
  // Check if email already exists
  if (data.email) {
    const existing = await getMemberByEmail(data.email);
    if (existing) {
      throw new Error(`Email ${data.email} is already in use.`);
    }
  }
  return createMember(data);
}

export async function authenticateMember(
  email: string,
  password: string
): Promise<Member> {
  const member = await getMemberByEmail(email);
  if (!member || member.password !== password) {
    throw new Error("Invalid email or password");
  }
  return member;
}
