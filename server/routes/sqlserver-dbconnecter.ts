import { Router, Request, Response } from 'express';
import { ConnectionPool } from 'mssql';

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
    
    const config = {
      server: host,
      port: +port,
      user: username,
      password: password,
      database: database,
      options: {
        encrypt: ssl,
        trustServerCertificate: true,
        connectionTimeout: 5000,
      },
    };

    try {
        const pool = new ConnectionPool(config);
        await pool.connect();
        await pool.request().query('SELECT GETDATE()');
        await pool.close();
        res.json({ success: true });
    } catch (err: any) {
        console.error('SQL Server connect failed', err);
        res.status(200).json({ success: false, error: err.code || err.message });
    }
});

export default router; 