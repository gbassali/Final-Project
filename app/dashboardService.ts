import { FitnessGoals, Session, FitnessClass} from "../generated/prisma/client";
import { getFitnessGoalsForMember } from "../models/fitnessGoalModel";
import { listSessionsForMember } from "../models/sessionModel";
import { listRegistrationsForMemberWithFitnessClass } from "../models/classRegistrationModel";

export async function getActiveGoalsForMember(memberId: number): Promise<FitnessGoals[]> {
  const allGoals = await getFitnessGoalsForMember(memberId);
  return allGoals.filter(goal => goal.active == true);
}

export async function getPastClassCountForMember(memberId: number): Promise<number> {
  const now = new Date();

  const registrationsWithClass = await listRegistrationsForMemberWithFitnessClass(memberId);
  const pastCount = registrationsWithClass.filter(
    (reg) => reg.fitnessClass.startTime < now
  ).length;

  return pastCount;
}

export async function getUpcomingPtSessionsForMember(memberId: number): Promise<Session[]> {
  const now = new Date();

  const allSessions = await listSessionsForMember(memberId);
  return allSessions.filter((s) => s.startTime >= now);
}

export async function getUpcomingClassSessionsForMember(memberId: number): Promise<FitnessClass[]> {
  const now = new Date();

  const registrationsWithClass = await listRegistrationsForMemberWithFitnessClass(memberId);
  const upcomingClasses = registrationsWithClass
    .filter((reg) => reg.fitnessClass.startTime >= now)
    .map((reg) => reg.fitnessClass);

  return upcomingClasses;
}