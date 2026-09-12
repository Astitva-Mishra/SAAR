import { Request, Response } from 'express';
import { getDatabaseStatus, connectDB } from '../config/db';

export function getHealth(req: Request, res: Response): void {
  let dbStatus = getDatabaseStatus();
  if (dbStatus !== 'connected' && dbStatus !== 'connecting') {
    connectDB().catch(() => {});
    dbStatus = getDatabaseStatus();
  }

  res.status(200).json({
    success: true,
    service: 'CareKare Backend',
    database: dbStatus,
  });
}
