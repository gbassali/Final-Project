import { ClassRegistration, FitnessClass } from "../generated/prisma/client";
import {
  createClassRegistration,
  deleteClassRegistration,
  listRegistrationsForClass,
  listRegistrationsForMemberWithFitnessClass,
} from "../models/classRegistrationModel";
import {
  getFitnessClassById,
  listUpcomingFitnessClasses,
} from "../models/fitnessClassModel";
import { getMemberById } from "../models/memberModel";
import { memberHasConflict } from "./memberService";

export type FitnessClassWithDetails = FitnessClass & {
  trainer: { id: number; name: string };
  room: { id: number; name: string };
  registrationCount: number;
  isRegistered: boolean;
};

/**
 * List all upcoming fitness classes with registration counts and member's registration status
 */
export async function listUpcomingClassesForMember(
  memberId: number
): Promise<FitnessClassWithDetails[]> {
  const prisma = (await import("../models/prismaClient")).default;

  const now = new Date();
  const classes = await prisma.fitnessClass.findMany({
    where: { startTime: { gt: now } },
    include: {
      trainer: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      registrations: { select: { memberId: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    trainerId: cls.trainerId,
    roomId: cls.roomId,
    startTime: cls.startTime,
    endTime: cls.endTime,
    capacity: cls.capacity,
    trainer: cls.trainer,
    room: cls.room,
    registrationCount: cls.registrations.length,
    isRegistered: cls.registrations.some((r) => r.memberId === memberId),
  }));
}

/**
 * Register a member for a fitness class
 */
export async function registerForClass(
  memberId: number,
  fitnessClassId: number
): Promise<ClassRegistration> {
  // 1. Verify member exists
  const member = await getMemberById(memberId);
  if (!member) {
    throw new Error(`Member with id ${memberId} not found.`);
  }

  // 2. Verify class exists and is in the future
  const fitnessClass = await getFitnessClassById(fitnessClassId);
  if (!fitnessClass) {
    throw new Error(`Class with id ${fitnessClassId} not found.`);
  }

  if (new Date(fitnessClass.startTime) <= new Date()) {
    throw new Error("Cannot register for a class that has already started.");
  }

  // 3. Check if already registered
  const existingRegistrations = await listRegistrationsForClass(fitnessClassId);
  const alreadyRegistered = existingRegistrations.some(
    (r) => r.memberId === memberId
  );
  if (alreadyRegistered) {
    throw new Error("You are already registered for this class.");
  }

  // 4. Check capacity
  if (existingRegistrations.length >= fitnessClass.capacity) {
    throw new Error("This class is full.");
  }

  // 5. Check for schedule conflicts (member can't be in two places at once)
  const hasConflict = await memberHasConflict(
    memberId,
    new Date(fitnessClass.startTime),
    new Date(fitnessClass.endTime)
  );
  if (hasConflict) {
    throw new Error(
      "You have a scheduling conflict during this time (another class or PT session)."
    );
  }

  // 6. Create registration
  return createClassRegistration({
    member: { connect: { id: memberId } },
    fitnessClass: { connect: { id: fitnessClassId } },
  });
}

/**
 * Cancel a class registration
 */
export async function cancelClassRegistration(
  memberId: number,
  registrationId: number
): Promise<ClassRegistration> {
  const prisma = (await import("../models/prismaClient")).default;

  // Find the registration
  const registration = await prisma.classRegistration.findUnique({
    where: { id: registrationId },
    include: { fitnessClass: true },
  });

  if (!registration) {
    throw new Error(`Registration with id ${registrationId} not found.`);
  }

  // Verify ownership
  if (registration.memberId !== memberId) {
    throw new Error("You can only cancel your own registrations.");
  }

  // Check if class has already started
  if (new Date(registration.fitnessClass.startTime) <= new Date()) {
    throw new Error("Cannot cancel registration for a class that has already started.");
  }

  return deleteClassRegistration(registrationId);
}

/**
 * Get member's registered classes with class details
 */
export async function getMemberRegistrations(memberId: number) {
  return listRegistrationsForMemberWithFitnessClass(memberId);
}

