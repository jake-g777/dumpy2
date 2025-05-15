import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Log that the router is being created
console.log('Initializing MySQL router');

interface TestConnectionBody {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

// Test connection endpoint
router.post('/test-connection', async (req: Request, res: Response) => {
    try {
        console.log('\n=== MySQL Test Connection Request ===');
        
        // Validate request body
        if (!req.body) {
            throw new Error('Request body is missing');
        }
        
        const {
            host,
            port,
            username: user,
            password,
            database,
            ssl,
        } = req.body as TestConnectionBody;

        // Validate required fields
        if (!host || !port || !user || !password || !database) {
            throw new Error('Missing required connection parameters');
        }

        console.log('Connection parameters:', {
            host,
            port,
            user,
            database,
            ssl,
            // Don't log password
        });

        console.log('Attempting to create MySQL connection...');
        const conn = await mysql.createConnection({
            host,
            port: +port,
            user,
            password,
            database,
            ssl: ssl ? { rejectUnauthorized: false } : undefined,
            connectTimeout: 5_000,
        });

        console.log('Connection created, attempting ping...');
        await conn.ping();
        console.log('Ping successful');

        await conn.end();
        console.log('Connection closed successfully');

        res.json({ 
            success: true,
            message: 'Successfully connected to MySQL database'
        });
    } catch (err: any) {
        console.error('MySQL connection failed:', {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage || err.message
        });

        res.status(err.code === 'ECONNREFUSED' ? 503 : 400).json({
            success: false,
            error: err.code || 'UNKNOWN_ERROR',
            message: err.sqlMessage || err.message,
            details: {
                code: err.code,
                errno: err.errno,
                sqlState: err.sqlState,
                sqlMessage: err.sqlMessage
            }
        });
    }
});

// Log available routes
console.log('MySQL router initialized with routes:');
router.stack.forEach((r: any) => {
  if (r.route && r.route.path) {
    console.log(`- ${Object.keys(r.route.methods).join(', ')} ${r.route.path}`);
  }
});

export default router; 