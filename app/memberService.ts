import { Prisma, Member } from "../generated/prisma/client";
import { listRegistrationsForMemberWithFitnessClass } from "../models/classRegistrationModel";
import { getMemberByEmail, createMember } from "../models/memberModel";
import { listSessionsForMember } from "../models/sessionModel";
import { timeIntervalsOverlap } from "./utilService";

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
export async function memberHasConflict(memberId: number, start: Date, end: Date, options?: { ignoreSessionId?: number }): Promise<boolean> {
  // Member's PT sessions
  const sessions = await listSessionsForMember(memberId);
  const hasSessionConflict = sessions.some((s) => {
    if (options?.ignoreSessionId && s.id === options.ignoreSessionId) {
      return false;
    }
    return timeIntervalsOverlap(start, end, s.startTime, s.endTime);
  });

  if (hasSessionConflict) return true;

  // Member's registered classes
  const registrations = await listRegistrationsForMemberWithFitnessClass(memberId);

  const hasClassConflict = registrations.some((reg) =>
    timeIntervalsOverlap(start, end, reg.fitnessClass.startTime, reg.fitnessClass.endTime)
  );

  return hasClassConflict;
}
