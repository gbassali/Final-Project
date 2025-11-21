import prisma from "./prismaClient";
import { HealthMetric, Prisma } from "../generated/prisma/client";

export type CreateHealthMetricInput = Prisma.HealthMetricCreateInput;
export type UpdateHealthMetricInput = Prisma.HealthMetricUpdateInput;

export async function createHealthMetric(
  input: CreateHealthMetricInput
): Promise<HealthMetric> {
  return prisma.healthMetric.create({ data: input });
}

export async function getHealthMetricById(
  id: number
): Promise<HealthMetric | null> {
  return prisma.healthMetric.findUnique({ where: { id } });
}

export async function listHealthMetricsForMember(
  memberId: number
): Promise<HealthMetric[]> {
  return prisma.healthMetric.findMany({
    where: { memberId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function updateHealthMetric(
  id: number,
  data: UpdateHealthMetricInput
): Promise<HealthMetric> {
  return prisma.healthMetric.update({
    where: { id },
    data,
  });
}

export async function deleteHealthMetric(id: number): Promise<HealthMetric> {
  return prisma.healthMetric.delete({ where: { id } });
}
