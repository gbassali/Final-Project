import { Router } from 'express';
import { requireAuth } from './authRoutes';
import { listRooms } from '../../models/roomModel';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const rooms = await listRooms();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

export default router;

