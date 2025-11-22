import prisma from "./prismaClient";
import { HealthMetric, Prisma } from "../generated/prisma/client";

export type CreateHealthMetricInput = {
  metricType: string;
  value: number;
  unit?: string | null;
  recordedAt?: Date;
};
export type UpdateHealthMetricInput = Prisma.HealthMetricUpdateInput;

// export async function createHealthMetric(
//   input: CreateHealthMetricInput
// ): Promise<HealthMetric> {
//   return prisma.healthMetric.create({ data: input });
// }
export async function createHealthMetricForMember(memberId: number, data: CreateHealthMetricInput): Promise<HealthMetric> {
  return prisma.healthMetric.create({
    data: {
      metricType: data.metricType,
      value: data.value,
      unit: data.unit ?? null,
      recordedAt: data.recordedAt,
      member: {
        connect: { id: memberId },
      },
    },
  });
}

export async function getHealthMetricById(id: number): Promise<HealthMetric | null> {
  return prisma.healthMetric.findUnique({ where: { id } });
}

export async function getHealthMetricsForMember(memberId: number): Promise<HealthMetric[]> {
  return prisma.healthMetric.findMany({
    where: { memberId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function updateHealthMetric(id: number, data: UpdateHealthMetricInput): Promise<HealthMetric> {
  return prisma.healthMetric.update({
    where: { id },
    data,
  });
}

export async function deleteHealthMetric(id: number): Promise<HealthMetric> {
  return prisma.healthMetric.delete({ where: { id } });
}
