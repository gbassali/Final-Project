import { Router, Request, Response } from 'express';
import { requireAuth } from './authRoutes';
import {
  listTrainers,
  getTrainerById,
} from '../../models/trainerModel';
import {
  listTrainerAvailabilitiesForTrainer,
  deleteTrainerAvailability,
} from '../../models/trainerAvailabilityModel';
import { listSessionsForTrainerWithDetails } from '../../models/sessionModel';
import { listFitnessClassesForTrainer } from '../../models/fitnessClassModel';
import { getAvailableSlotsForDate } from '../../app/availableSlotsService';
import { addOneTimeAvailabilityForTrainer, addWeeklyAvailabilityForTrainer } from '../../app/trainerAvailabilityService';
import { getUpcomingSessionsForTrainer, getUpcomingClassesForTrainer } from '../../app/trainerScheduleService';
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
    
    let availability;
    if (data.type === 'ONE_TIME') {
      if (!data.startDateTime || !data.endDateTime) {
        res.status(400).json({ error: 'startDateTime and endDateTime are required for ONE_TIME availability' });
        return;
      }
      availability = await addOneTimeAvailabilityForTrainer(trainerId, data.startDateTime, data.endDateTime);
    } else {
      if (data.dayOfWeek === undefined || !data.startTime || !data.endTime) {
        res.status(400).json({ error: 'dayOfWeek, startTime, and endTime are required for WEEKLY availability' });
        return;
      }
      availability = await addWeeklyAvailabilityForTrainer(trainerId, data.dayOfWeek, data.startTime, data.endTime);
    }
    
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
      getUpcomingSessionsForTrainer(trainerId),
      getUpcomingClassesForTrainer(trainerId),
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
): {
  type: AvailabilityType;
  startDateTime?: Date;
  endDateTime?: Date;
  dayOfWeek?: number;
  startTime?: Date;
  endTime?: Date;
} {
  const type = parseAvailabilityType(body?.type);
  const input: any = { type };

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

