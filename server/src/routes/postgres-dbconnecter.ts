import { Router, Request, Response } from 'express';
import { Client } from 'pg';

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
      host, port, username, password,
      database, ssl,
    } = req.body as TestConnectionBody;
    
    const client = new Client({
      host,
      port: +port,
      user: username,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        await client.query('SELECT NOW()');
        await client.end();
        res.json({ success: true });
    } catch (err: any) {
        console.error('PostgreSQL connect failed', err);
        res.status(200).json({ success: false, error: err.code || err.message });
    }
});

export default router; 