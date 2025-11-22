import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { registerMember } from '../../app/memberService';

const router = Router();

router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as Prisma.MemberCreateInput;
      const member = await registerMember(data);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

