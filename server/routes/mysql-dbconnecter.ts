import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

interface TestConnectionBody {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
    const {
      host, port, username: user, password,
      database, ssl,
    } = req.body as TestConnectionBody;
    try {
        const conn = await mysql.createConnection({
          host,
          port: +port,
          user,
          password,
          database,
          ssl: ssl ? { rejectUnauthorized: false } : undefined,
          connectTimeout: 5_000,
        });
        await conn.ping();
        await conn.end();
        res.json({ success: true });
    } catch (err: any) {
        console.error('MySQL connect failed', err);
        res.status(200).json({ success: false, error: err.code || err.message });
    }
});

export default router; 