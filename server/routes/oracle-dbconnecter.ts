import { Router, Request, Response } from 'express';
import oracledb from 'oracledb';

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
    
    const connectionString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))(CONNECT_DATA=(SERVICE_NAME=${database})))`;
    
    try {
        const connection = await oracledb.getConnection({
          user: username,
          password: password,
          connectString: connectionString,
          connectTimeout: 5000,
        });
        
        await connection.execute('SELECT SYSDATE FROM DUAL');
        await connection.close();
        res.json({ success: true });
    } catch (err: any) {
        console.error('Oracle connect failed', err);
        res.status(200).json({ success: false, error: err.code || err.message });
    }
});

export default router; 