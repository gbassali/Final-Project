import { Router, Request, Response, NextFunction } from 'express';
import type { Prisma } from '../../generated/prisma/client';
import { registerMember } from '../../app/memberService';
import {
  updateMemberProfile,
  addFitnessGoalForMember,
  listFitnessGoalsForMember,
  updateFitnessGoalForMember,
  addHealthMetricForMember,
  listHealthMetricsForMember,
  updateHealthMetricForMember,
} from '../../app/profileService';
import {
  listMembers,
  getMemberById,
} from '../../models/memberModel';
import { CreateFitnessGoalsInput } from '../../models/fitnessGoalModel';
import { CreateHealthMetricInput } from '../../models/healthMetricModel';
import { requireAuth } from './authRoutes';
import { listSessionsForMemberWithDetails } from '../../models/sessionModel';
import { bookPtSession, cancelPtSession, reschedulePtSession } from '../../app/ptSessionSchedulingService';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const data = buildMemberCreateInput(req.body);
    const member = await registerMember(data);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const members = await listMembers();
    res.json(members);
  } catch (error) {
    next(error);
  }
});

router.get('/:memberId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const member = await getMemberById(memberId);
    if (!member) {
      res.status(404).json({ error: `Member ${memberId} not found` });
      return;
    }
    res.json(member);
  } catch (error) {
    next(error);
  }
});

router.patch('/:memberId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const data = buildMemberUpdateInput(req.body);
    const updated = await updateMemberProfile(memberId, data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/:memberId/goals', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const goals = await listFitnessGoalsForMember(memberId);
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

router.post('/:memberId/goals', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const data = buildFitnessGoalInput(req.body);
    const goal = await addFitnessGoalForMember(memberId, data);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

router.patch('/:memberId/goals/:goalId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const goalId = parseId(req.params.goalId, 'goalId');
    const data = buildFitnessGoalUpdateInput(req.body);
    const goal = await updateFitnessGoalForMember(memberId, goalId, data);
    res.json(goal);
  } catch (error) {
    next(error);
  }
});

router.get('/:memberId/metrics', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const metrics = await listHealthMetricsForMember(memberId);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

router.post('/:memberId/metrics', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const data = buildHealthMetricInput(req.body);
    const metric = await addHealthMetricForMember(memberId, data);
    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
});

router.patch('/:memberId/metrics/:metricId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const metricId = parseId(req.params.metricId, 'metricId');
    const data = buildHealthMetricUpdateInput(req.body);
    const metric = await updateHealthMetricForMember(memberId, metricId, data);
    res.json(metric);
  } catch (error) {
    next(error);
  }
});

router.get('/:memberId/sessions', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const sessions = await listSessionsForMemberWithDetails(memberId);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.post('/:memberId/sessions', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const data = buildPtSessionCreateInput(req.body);
    const session = await bookPtSession({
      memberId,
      trainerId: data.trainerId,
      roomId: data.roomId,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Cancel a PT session
router.delete('/:memberId/sessions/:sessionId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const sessionId = parseId(req.params.sessionId, 'sessionId');
    const deleted = await cancelPtSession(sessionId, memberId);
    res.json({ message: 'Session cancelled', session: deleted });
  } catch (error) {
    next(error);
  }
});

// Reschedule a PT session
router.patch('/:memberId/sessions/:sessionId', async (req, res, next) => {
  try {
    const memberId = parseId(req.params.memberId, 'memberId');
    const sessionId = parseId(req.params.sessionId, 'sessionId');
    const data = buildPtSessionRescheduleInput(req.body);
    const session = await reschedulePtSession({
      sessionId,
      newStartTime: data.startTime,
      newEndTime: data.endTime,
      newTrainerId: data.trainerId,
      newRoomId: data.roomId,
    });
    res.json(session);
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

function parseDateString(input: unknown, field: string): Date {
  if (typeof input !== 'string' || !input.trim()) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return date;
}

function buildMemberCreateInput(body: any): Prisma.MemberCreateInput {
  if (
    typeof body?.name !== 'string' ||
    typeof body?.email !== 'string' ||
    typeof body?.password !== 'string'
  ) {
    const error = new Error('Name, email, and password are required');
    (error as any).status = 400;
    throw error;
  }

  const input: Prisma.MemberCreateInput = {
    name: body.name,
    email: body.email,
    password: body.password,
    phone: body.phone ?? null,
  };

  if (body.dateOfBirth) {
    input.dateOfBirth = parseDateString(body.dateOfBirth, 'dateOfBirth');
  }

  return input;
}

function buildMemberUpdateInput(body: any): Prisma.MemberUpdateInput {
  const data: Prisma.MemberUpdateInput = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.password !== undefined) data.password = body.password;
  if (body.phone !== undefined) data.phone = body.phone ?? null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth =
      body.dateOfBirth === null || body.dateOfBirth === ''
        ? null
        : parseDateString(body.dateOfBirth, 'dateOfBirth');
  }

  return data;
}

function buildFitnessGoalInput(body: any): CreateFitnessGoalsInput {
  if (typeof body?.value !== 'string') {
    const error = new Error('Goal value is required');
    (error as any).status = 400;
    throw error;
  }

  const input: CreateFitnessGoalsInput = {
    value: body.value,
    active: Boolean(body.active ?? true),
    recordedAt: body.recordedAt
      ? parseDateString(body.recordedAt, 'recordedAt')
      : undefined,
  };

  return input;
}

function buildFitnessGoalUpdateInput(
  body: any
): Prisma.FitnessGoalsUpdateInput {
  const data: Prisma.FitnessGoalsUpdateInput = {};

  if (body.value !== undefined) data.value = body.value;
  if (body.active !== undefined) data.active = body.active;
  if (body.recordedAt !== undefined) {
    data.recordedAt =
      body.recordedAt === null || body.recordedAt === ''
        ? undefined
        : parseDateString(body.recordedAt, 'recordedAt');
  }

  return data;
}

function buildHealthMetricInput(body: any): CreateHealthMetricInput {
  if (typeof body?.metricType !== 'string') {
    const error = new Error('metricType is required');
    (error as any).status = 400;
    throw error;
  }
  if (typeof body?.value !== 'number') {
    const error = new Error('value must be a number');
    (error as any).status = 400;
    throw error;
  }

  const input: CreateHealthMetricInput = {
    metricType: body.metricType,
    value: body.value,
    unit: body.unit ?? null,
    recordedAt: body.recordedAt
      ? parseDateString(body.recordedAt, 'recordedAt')
      : undefined,
  };

  return input;
}

function buildHealthMetricUpdateInput(
  body: any
): Prisma.HealthMetricUpdateInput {
  const data: Prisma.HealthMetricUpdateInput = {};

  if (body.metricType !== undefined) data.metricType = body.metricType;
  if (body.value !== undefined) data.value = body.value;
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.recordedAt !== undefined) {
    data.recordedAt =
      body.recordedAt === null || body.recordedAt === ''
        ? undefined
        : parseDateString(body.recordedAt, 'recordedAt');
  }

  return data;
}

function buildPtSessionCreateInput(body: any) {
  const trainerId = parseNumericId(body?.trainerId, 'trainerId');
  const roomId = parseNumericId(body?.roomId, 'roomId');
  if (!body?.startTime || !body?.endTime) {
    const error = new Error('startTime and endTime are required');
    (error as any).status = 400;
    throw error;
  }
  const startTime = parseDateString(body.startTime, 'startTime');
  const endTime = parseDateString(body.endTime, 'endTime');
  if (startTime >= endTime) {
    const error = new Error('startTime must be before endTime');
    (error as any).status = 400;
    throw error;
  }
  return { trainerId, roomId, startTime, endTime };
}

function parseNumericId(value: unknown, field: string): number {
  const parsed =
    typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : typeof value === 'number'
      ? value
      : NaN;
  if (!Number.isFinite(parsed)) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return parsed;
}

function buildPtSessionRescheduleInput(body: any) {
  if (!body?.startTime || !body?.endTime) {
    const error = new Error('startTime and endTime are required');
    (error as any).status = 400;
    throw error;
  }
  const startTime = parseDateString(body.startTime, 'startTime');
  const endTime = parseDateString(body.endTime, 'endTime');
  if (startTime >= endTime) {
    const error = new Error('startTime must be before endTime');
    (error as any).status = 400;
    throw error;
  }
  return {
    startTime,
    endTime,
    trainerId: body.trainerId ? parseNumericId(body.trainerId, 'trainerId') : undefined,
    roomId: body.roomId ? parseNumericId(body.roomId, 'roomId') : undefined,
  };
}

