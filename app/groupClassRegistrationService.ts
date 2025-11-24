import { ClassRegistration, FitnessClass } from "../generated/prisma/client";

import { getMemberById } from "../models/memberModel";
import { getFitnessClassById } from "../models/fitnessClassModel";
import { createClassRegistration, listRegistrationsForMemberWithFitnessClass} from "../models/classRegistrationModel";
import { memberHasConflict } from "./memberService";
import prisma from "../models/prismaClient";

export async function getFitnessClassWithRemainingCapacity(fitnessClassId: number): Promise<{
  fitnessClass: FitnessClass;
  remainingSpots: number;
  currentRegistrations: number;
}> {
  const fitnessClass = await getFitnessClassById(fitnessClassId);
  if (!fitnessClass) {
    throw new Error(`FitnessClass with id ${fitnessClassId} not found.`);
  }

  const currentRegistrations = await prisma.classRegistration.count({
    where: { fitnessClassId },
  });
  const remainingSpots = Math.max(0, fitnessClass.capacity - currentRegistrations);
  return { fitnessClass, remainingSpots, currentRegistrations };
}

export async function registerMemberForClass(memberId: number, fitnessClassId: number): Promise<ClassRegistration> {
  // Ensure member exists
  const member = await getMemberById(memberId);
  if (!member) {
    throw new Error(`Member with id ${memberId} not found.`);
  }

  // Get class and its remaining capacity
  const { fitnessClass, remainingSpots } = await getFitnessClassWithRemainingCapacity(fitnessClassId);

  // Check if class has already started
  const now = new Date();
  if (fitnessClass.startTime <= now) {
    throw new Error("Cannot register for a class that has already started.");
  }

  // Check if member is already registered for this class
  const existingRegistration = await prisma.classRegistration.findFirst({
    where: {
      memberId,
      fitnessClassId,
    },
  });
  if (existingRegistration) {
    throw new Error("Member is already registered for this class.");
  }

  // Check capacity
  if (remainingSpots <= 0) {
    throw new Error("Class is full; cannot register.");
  }

  // Check for member schedule conflicts (sessions or other classes)
  const hasConflict = await memberHasConflict(memberId, fitnessClass.startTime, fitnessClass.endTime);
  if (hasConflict) {
    throw new Error("Member already has a session or class during this time.");
  }

  // Everything is fine --> Create the registration
  return createClassRegistration({
    member: { connect: { id: memberId } },
    fitnessClass: { connect: { id: fitnessClassId } },
  });
}
