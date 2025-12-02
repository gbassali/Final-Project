import { Router } from 'express';
import { requireAdminAuth } from './authRoutes';
import {
  getFitnessClassById,
  deleteFitnessClass,
} from '../../models/fitnessClassModel';
import { listTrainers, getTrainerById } from '../../models/trainerModel';
import { listRooms, getRoomById } from '../../models/roomModel';
import { listRegistrationsForClass } from '../../models/classRegistrationModel';
import { createClassWithValidation, updateClassSchedule } from '../../app/classManagementService';
import prisma from '../../models/prismaClient';

const router = Router();

// All admin routes require admin auth
router.use(requireAdminAuth);

// ==================== TRAINERS (Read-only for class assignment) ====================

router.get('/trainers', async (_req, res, next) => {
  try {
    const trainers = await listTrainers();
    res.json(trainers);
  } catch (error) {
    next(error);
  }
});

// ==================== ROOMS (Read-only for class assignment) ====================

router.get('/rooms', async (_req, res, next) => {
  try {
    const rooms = await listRooms();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

// ==================== FITNESS CLASSES ====================

// List all fitness classes (including past ones for admin view)
router.get('/classes', async (_req, res, next) => {
  try {
    const classes = await prisma.fitnessClass.findMany({
      include: {
        trainer: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    
    // Transform to include registration count
    const result = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      trainerId: cls.trainerId,
      roomId: cls.roomId,
      startTime: cls.startTime,
      endTime: cls.endTime,
      capacity: cls.capacity,
      trainer: cls.trainer,
      room: cls.room,
      registrationCount: cls._count.registrations,
    }));
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single class with details
router.get('/classes/:classId', async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId, 'classId');
    const fitnessClass = await prisma.fitnessClass.findUnique({
      where: { id: classId },
      include: {
        trainer: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        registrations: {
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    
    if (!fitnessClass) {
      res.status(404).json({ error: `Class ${classId} not found` });
      return;
    }
    
    res.json(fitnessClass);
  } catch (error) {
    next(error);
  }
});

// Create a new fitness class
router.post('/classes', async (req, res, next) => {
  try {
    const data = buildClassInput(req.body);
    
    const fitnessClass = await createClassWithValidation({
      name: data.name,
      trainerId: data.trainerId,
      roomId: data.roomId,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
    });
    
    res.status(201).json(fitnessClass);
  } catch (error) {
    next(error);
  }
});

// Update a fitness class
router.patch('/classes/:classId', async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId, 'classId');
    const existing = await getFitnessClassById(classId);
    
    if (!existing) {
      res.status(404).json({ error: `Class ${classId} not found` });
      return;
    }
    
    const data = buildClassUpdateInput(req.body);
    
    const updated = await updateClassSchedule({
      fitnessClassId: classId,
      trainerId: data.trainerId,
      roomId: data.roomId,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
    });
    
    // If name changed, update it separately since updateClassSchedule doesn't handle name
    if (data.name !== undefined) {
      const finalUpdated = await prisma.fitnessClass.update({
        where: { id: classId },
        data: { name: data.name },
      });
      res.json(finalUpdated);
    } else {
      res.json(updated);
    }
  } catch (error) {
    next(error);
  }
});

// Delete a fitness class
router.delete('/classes/:classId', async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId, 'classId');
    const existing = await getFitnessClassById(classId);
    
    if (!existing) {
      res.status(404).json({ error: `Class ${classId} not found` });
      return;
    }
    
    // Check if class has registrations
    const registrations = await listRegistrationsForClass(classId);
    if (registrations.length > 0) {
      res.status(400).json({ 
        error: `Cannot delete class with ${registrations.length} registration(s). Cancel registrations first.` 
      });
      return;
    }
    
    const deleted = await deleteFitnessClass(classId);
    res.json({ message: 'Class deleted', class: deleted });
  } catch (error) {
    next(error);
  }
});

export default router;

// ==================== HELPERS ====================

function parseId(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`Invalid ${field}`);
    (error as any).status = 400;
    throw error;
  }
  return parsed;
}

function buildClassInput(body: any) {
  if (typeof body?.name !== 'string' || !body.name.trim()) {
    const error = new Error('Class name is required');
    (error as any).status = 400;
    throw error;
  }
  
  const trainerId = parseNumericId(body?.trainerId, 'trainerId');
  const roomId = parseNumericId(body?.roomId, 'roomId');
  const capacity = parseNumericId(body?.capacity, 'capacity');
  
  if (!body?.startTime || !body?.endTime) {
    const error = new Error('startTime and endTime are required');
    (error as any).status = 400;
    throw error;
  }
  
  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    const error = new Error('Invalid date format');
    (error as any).status = 400;
    throw error;
  }
  
  if (startTime >= endTime) {
    const error = new Error('startTime must be before endTime');
    (error as any).status = 400;
    throw error;
  }
  
  if (capacity < 1) {
    const error = new Error('Capacity must be at least 1');
    (error as any).status = 400;
    throw error;
  }
  
  return {
    name: body.name.trim(),
    trainerId,
    roomId,
    startTime,
    endTime,
    capacity,
  };
}

function buildClassUpdateInput(body: any) {
  const result: {
    name?: string;
    trainerId?: number;
    roomId?: number;
    startTime?: Date;
    endTime?: Date;
    capacity?: number;
  } = {};
  
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      const error = new Error('Class name cannot be empty');
      (error as any).status = 400;
      throw error;
    }
    result.name = body.name.trim();
  }
  
  if (body.trainerId !== undefined) {
    result.trainerId = parseNumericId(body.trainerId, 'trainerId');
  }
  
  if (body.roomId !== undefined) {
    result.roomId = parseNumericId(body.roomId, 'roomId');
  }
  
  if (body.startTime !== undefined) {
    result.startTime = new Date(body.startTime);
    if (isNaN(result.startTime.getTime())) {
      const error = new Error('Invalid startTime');
      (error as any).status = 400;
      throw error;
    }
  }
  
  if (body.endTime !== undefined) {
    result.endTime = new Date(body.endTime);
    if (isNaN(result.endTime.getTime())) {
      const error = new Error('Invalid endTime');
      (error as any).status = 400;
      throw error;
    }
  }
  
  if (body.capacity !== undefined) {
    result.capacity = parseNumericId(body.capacity, 'capacity');
    if (result.capacity < 1) {
      const error = new Error('Capacity must be at least 1');
      (error as any).status = 400;
      throw error;
    }
  }
  
  return result;
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

