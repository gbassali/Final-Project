import prisma from "./prismaClient";
import { AdminStaff, Prisma } from "../generated/prisma/client";

export type CreateAdminStaffInput = Prisma.AdminStaffCreateInput;
export type UpdateAdminStaffInput = Prisma.AdminStaffUpdateInput;

export async function createAdminStaff(
  input: CreateAdminStaffInput
): Promise<AdminStaff> {
  return prisma.adminStaff.create({ data: input });
}

export async function getAdminStaffById(id: number): Promise<AdminStaff | null> {
  return prisma.adminStaff.findUnique({ where: { id } });
}

export async function getAdminStaffByEmail(
  email: string
): Promise<AdminStaff | null> {
  return prisma.adminStaff.findUnique({ where: { email } });
}

export async function listAdminStaff(): Promise<AdminStaff[]> {
  return prisma.adminStaff.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateAdminStaff(
  id: number,
  data: UpdateAdminStaffInput
): Promise<AdminStaff> {
  return prisma.adminStaff.update({
    where: { id },
    data,
  });
}

export async function deleteAdminStaff(id: number): Promise<AdminStaff> {
  return prisma.adminStaff.delete({ where: { id } });
}
