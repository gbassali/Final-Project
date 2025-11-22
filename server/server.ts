import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import memberRoutes from './routes/memberRoutes';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/members', memberRoutes);

app.use(
  (err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

