import { Router, Request, Response } from 'express';
import { requireAuth } from './authRoutes';
import {
  listTrainers,
  getTrainerById,
} from '../../models/trainerModel';
import {
  listTrainerAvailabilitiesForTrainer,
  createTrainerAvailability,
  deleteTrainerAvailability,
} from '../../models/trainerAvailabilityModel';
import { listSessionsForTrainerWithDetails } from '../../models/sessionModel';
import { listFitnessClassesForTrainer } from '../../models/fitnessClassModel';
import { getAvailableSlotsForDate } from '../../app/availableSlotsService';
import type { Prisma, AvailabilityType } from '../../generated/prisma/client';

const router = Router();

router.use(requireAuth);

// Get available slots for a specific date (across all trainers)
router.get('/available-slots', async (req, res, next) => {
  try {
    const date = req.query.date as string;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
      return;
    }
    const result = await getAvailableSlotsForDate(date);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const trainers = await listTrainers();
    res.json(trainers);
  } catch (error) {
    next(error);
  }
});

router.get('/:trainerId', async (req, res, next) => {
  try {
    const trainerId = parseId(req.params.trainerId, 'trainerId');
    const trainer = await getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ error: `Trainer ${trainerId} not found` });
      return;
    }
    res.json(trainer);
  } catch (error) {
    next(error);
  }
});

router.get('/:trainerId/availabilities', async (req, res, next) => {
  try {
    const trainerId = parseId(req.params.trainerId, 'trainerId');
    const slots = await listTrainerAvailabilitiesForTrainer(trainerId);
    res.json(slots);
  } catch (error) {
    next(error);
  }
});

router.post('/:trainerId/availabilities', async (req, res, next) => {
  try {
    const trainerId = parseId(req.params.trainerId, 'trainerId');
    const data = buildAvailabilityInput(req.body);
    await assertNoAvailabilityConflict(trainerId, data);
    const availability = await createTrainerAvailability({
      ...data,
      trainer: { connect: { id: trainerId } },
    });
    res.status(201).json(availability);
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/:trainerId/availabilities/:availabilityId',
  async (req, res, next) => {
    try {
      const availabilityId = parseId(
        req.params.availabilityId,
        'availabilityId'
      );
      await deleteTrainerAvailability(availabilityId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:trainerId/schedule', async (req, res, next) => {
  try {
    const trainerId = parseId(req.params.trainerId, 'trainerId');
    const [sessions, classes] = await Promise.all([
      listSessionsForTrainerWithDetails(trainerId),
      listFitnessClassesForTrainer(trainerId),
    ]);
    res.json({ sessions, classes });
  } catch (error) {
    next(error);
  }
});

export default router;

function parseId(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return parsed;
}

function buildAvailabilityInput(
  body: any
): Prisma.TrainerAvailabilityCreateWithoutTrainerInput {
  const type = parseAvailabilityType(body?.type);
  const input: Prisma.TrainerAvailabilityCreateWithoutTrainerInput = {
    type,
  };

  if (type === 'ONE_TIME') {
    if (!body?.startDateTime || !body?.endDateTime) {
      const error = new Error(
        'startDateTime and endDateTime are required for ONE_TIME availability'
      );
      (error as any).status = 400;
      throw error;
    }
    input.startDateTime = parseDate(body.startDateTime, 'startDateTime');
    input.endDateTime = parseDate(body.endDateTime, 'endDateTime');
  } else {
    if (
      typeof body?.dayOfWeek !== 'number' ||
      body.dayOfWeek < 0 ||
      body.dayOfWeek > 6
    ) {
      const error = new Error('dayOfWeek must be between 0 and 6');
      (error as any).status = 400;
      throw error;
    }
    if (!body?.startTime || !body?.endTime) {
      const error = new Error(
        'startTime and endTime are required for WEEKLY availability'
      );
      (error as any).status = 400;
      throw error;
    }
    input.dayOfWeek = body.dayOfWeek;
    input.startTime = parseTime(body.startTime, 'startTime');
    input.endTime = parseTime(body.endTime, 'endTime');
  }

  return input;
}

function parseAvailabilityType(value: any): AvailabilityType {
  if (value === 'ONE_TIME' || value === 'WEEKLY') {
    return value;
  }
  const error = new Error('type must be ONE_TIME or WEEKLY');
  (error as any).status = 400;
  throw error;
}

function parseDate(value: any, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return date;
}

function parseTime(value: string, field: string): Date {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  const iso = `1970-01-01T${value.length === 5 ? `${value}:00` : value}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return date;
}

async function assertNoAvailabilityConflict(
  trainerId: number,
  data: Prisma.TrainerAvailabilityCreateWithoutTrainerInput
) {
  const slots = await listTrainerAvailabilitiesForTrainer(trainerId);
  if (data.type === 'ONE_TIME') {
    const newStart = toMillis(data.startDateTime);
    const newEnd = toMillis(data.endDateTime);
    if (newStart == null || newEnd == null || newStart >= newEnd) {
      const error = new Error('Invalid start/end times for ONE_TIME slot');
      (error as any).status = 400;
      throw error;
    }
    for (const slot of slots) {
      if (slot.type !== 'ONE_TIME') continue;
      const existingStart = toMillis(slot.startDateTime);
      const existingEnd = toMillis(slot.endDateTime);
      if (
        existingStart != null &&
        existingEnd != null &&
        rangesOverlap(newStart, newEnd, existingStart, existingEnd)
      ) {
        const error = new Error('Availability overlaps an existing slot');
        (error as any).status = 400;
        throw error;
      }
    }
  } else {
    const newStartMinutes = toMinutes(data.startTime);
    const newEndMinutes = toMinutes(data.endTime);
    if (
      data.dayOfWeek == null ||
      newStartMinutes == null ||
      newEndMinutes == null ||
      newStartMinutes >= newEndMinutes
    ) {
      const error = new Error('Invalid weekly availability inputs');
      (error as any).status = 400;
      throw error;
    }
    for (const slot of slots) {
      if (slot.type !== 'WEEKLY' || slot.dayOfWeek !== data.dayOfWeek) {
        continue;
      }
      const existingStart = toMinutes(slot.startTime);
      const existingEnd = toMinutes(slot.endTime);
      if (
        existingStart != null &&
        existingEnd != null &&
        rangesOverlap(
          newStartMinutes,
          newEndMinutes,
          existingStart,
          existingEnd
        )
      ) {
        const error = new Error('Weekly availability overlaps existing slot');
        (error as any).status = 400;
        throw error;
      }
    }
  }
}

function toMillis(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function toMinutes(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

