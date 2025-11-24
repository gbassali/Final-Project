import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { authenticateMember } from '../../app/memberService';

type SessionStore = Map<string, number>;

const sessions: SessionStore = new Map();
const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const member = await authenticateMember(email.trim(), password);
    const token = crypto.randomUUID();
    sessions.set(token, member.id);
    res.json({
      token,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      error: error instanceof Error ? error.message : 'Invalid credentials',
    });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.header('authorization');
  const token = extractToken(authHeader) ?? req.body?.token;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  sessions.delete(token);
  res.json({ success: true });
});

export function requireAuth(
  req: Request & { memberId?: number },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header('authorization');
  const token = extractToken(authHeader);

  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.memberId = sessions.get(token);
  next();
}

function extractToken(header?: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

export default router;

