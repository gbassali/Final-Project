import { Member, FitnessGoals, HealthMetric, Prisma } from "../generated/prisma/client";

import { updateMember } from "../models/memberModel";
import {
  createFitnessGoalForMember,
  updateFitnessGoal,
  getFitnessGoalsForMember,
  getFitnessGoalById,
  CreateFitnessGoalsInput,
} from "../models/fitnessGoalModel";
import {
  createHealthMetricForMember as createHealthMetricForMemberModel,
  updateHealthMetric,
  getHealthMetricsForMember,
  getHealthMetricById,
  CreateHealthMetricInput,
} from "../models/healthMetricModel";


export async function updateMemberProfile(memberId: number, data: Prisma.MemberUpdateInput): Promise<Member> {
  return updateMember(memberId, data);
}

export async function addFitnessGoalForMember(memberId: number, data: CreateFitnessGoalsInput): Promise<FitnessGoals> {
  return createFitnessGoalForMember(memberId, data);
}

export async function updateFitnessGoalForMember(memberId: number, goalId: number, data: Prisma.FitnessGoalsUpdateInput): Promise<FitnessGoals> {
  // Safety check: Make sure goal belongs to member
  const existing = await getFitnessGoalById(goalId);
  if (!existing) {
    throw new Error(`FitnessGoal with id ${goalId} not found`);
  }
  if (existing.memberId !== memberId) {
    throw new Error(
      `FitnessGoal ${goalId} does not belong to member ${memberId}`
    );
  }
  return updateFitnessGoal(goalId, data);
}


export async function listFitnessGoalsForMember(memberId: number): Promise<FitnessGoals[]> {
  return getFitnessGoalsForMember(memberId);
}


export async function addHealthMetricForMember(memberId: number, data: CreateHealthMetricInput): Promise<HealthMetric> {
  return createHealthMetricForMemberModel(memberId, data);
}

export async function updateHealthMetricForMember(memberId: number, metricId: number, data: Prisma.HealthMetricUpdateInput): Promise<HealthMetric> {
  const existing = await getHealthMetricById(metricId);
  if (!existing) {
    throw new Error(`HealthMetric with id ${metricId} not found`);
  }
  if (existing.memberId !== memberId) {
    throw new Error(
      `HealthMetric ${metricId} does not belong to member ${memberId}`
    );
  }

  return updateHealthMetric(metricId, data);
}

export async function listHealthMetricsForMember(memberId: number): Promise<HealthMetric[]> {
  return getHealthMetricsForMember(memberId);
}
