import { Router, Request, Response } from 'express';
import { MongoClient } from 'mongodb';

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
    
    const url = `mongodb://${username}:${password}@${host}:${port}/${database}`;
    const client = new MongoClient(url, {
      serverSelectionTimeoutMS: 5000,
      ssl: ssl,
    });

    try {
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.close();
        res.json({ success: true });
    } catch (err: any) {
        console.error('MongoDB connect failed', err);
        res.status(200).json({ success: false, error: err.code || err.message });
    }
});

export default router; 