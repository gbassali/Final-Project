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
