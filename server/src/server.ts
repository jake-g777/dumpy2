import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import chalk from 'chalk';
import { DatabaseConnection, ConnectionError } from './types';
import { connectionManager } from './utils/ConnectionManager';
import { swaggerDocument } from './swagger';

// Import database routes
import mysqlRouter from './routes/mysql-dbconnecter';
import postgresRouter from './routes/postgres-dbconnecter';
import mongoRouter from './routes/mongodb-dbconnecter';
import sqlserverRouter from './routes/sqlserver-dbconnecter';
import oracleRouter from './routes/oracle-dbconnecter';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5172', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(json());

// Debug middleware to log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(chalk.blue('\n[Request]'), chalk.yellow(req.method), chalk.cyan(req.path));
  if (Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    console.log('Body:', sanitizedBody);
  }
  next();
});

// Register database routes
app.use('/api/mysql', mysqlRouter);
app.use('/api/postgresql', postgresRouter);
app.use('/api/mongodb', mongoRouter);
app.use('/api/sqlserver', sqlserverRouter);
app.use('/api/oracle', oracleRouter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Logger middleware
const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const getStatusColor = (status: number) => {
      if (status >= 500) return chalk.red;
      if (status >= 400) return chalk.yellow;
      return chalk.green;
    };
    
    console.log(
      chalk.blue(`[${new Date().toISOString()}]`),
      chalk.magenta(req.method),
      req.path,
      getStatusColor(status)(status.toString()),
      chalk.cyan(`${duration}ms`)
    );
  });
  next();
};

app.use(logger);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(chalk.red('Error:'), err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Root endpoint redirects to Swagger UI
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Validate database type middleware
const validateDbType = (req: Request, res: Response, next: NextFunction): void => {
  const validTypes = ['mysql', 'postgresql', 'mongodb', 'sqlserver', 'oracle'];
  if (!validTypes.includes(req.params.dbType)) {
    res.status(400).json({
      success: false,
      error: 'Invalid database type',
      validTypes
    });
    return;
  }
  next();
};

// Test connection endpoint
app.post('/api/:dbType/test-connection', validateDbType, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const connection: DatabaseConnection = {
      ...req.body,
      type: req.params.dbType as DatabaseConnection['type']
    };

    console.log(
      chalk.blue('\n[Database Connection Test]'),
      '\nType:', chalk.cyan(connection.type),
      '\nHost:', chalk.cyan(connection.host),
      '\nDatabase:', chalk.cyan(connection.database),
      '\nUser:', chalk.cyan(connection.username)
    );

    const success = await connectionManager.testConnection(connection);
    const duration = Date.now() - startTime;

    if (success) {
      console.log(
        chalk.green('\n✓ Connection successful!'),
        chalk.gray(`(${duration}ms)`)
      );
    } else {
      console.log(
        chalk.red('\n✗ Connection failed!'),
        chalk.gray(`(${duration}ms)`)
      );
    }

    res.json({ success, duration });
  } catch (error) {
    const err = error as ConnectionError;
    const duration = Date.now() - startTime;
    
    console.log(
      chalk.red('\n✗ Connection error:'),
      chalk.yellow(err.message),
      chalk.gray(`(${duration}ms)`)
    );

    res.status(500).json({ 
      success: false, 
      error: err.message,
      duration
    });
  }
});

// Execute query endpoint
app.post('/api/:dbType/query', validateDbType, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { connection, query, params } = req.body;

    console.log(
      chalk.blue('\n[Database Query]'),
      '\nType:', chalk.cyan(connection.type),
      '\nDatabase:', chalk.cyan(connection.database),
      '\nQuery:', chalk.yellow(query)
    );

    const result = await connectionManager.executeQuery(connection.id, query, params);
    const duration = Date.now() - startTime;

    console.log(
      chalk.green('\n✓ Query executed successfully!'),
      chalk.gray(`(${duration}ms)`),
      '\nResults:', chalk.cyan(JSON.stringify(result, null, 2))
    );

    res.json({ 
      success: true, 
      rows: result,
      duration
    });
  } catch (error) {
    const err = error as ConnectionError;
    const duration = Date.now() - startTime;

    console.log(
      chalk.red('\n✗ Query error:'),
      chalk.yellow(err.message),
      chalk.gray(`(${duration}ms)`)
    );

    res.status(500).json({ 
      success: false, 
      error: err.message,
      duration
    });
  }
});

// Disconnect endpoint
app.post('/api/:dbType/disconnect', validateDbType, async (req: Request, res: Response) => {
  try {
    const { connection } = req.body;

    console.log(
      chalk.blue('\n[Database Disconnect]'),
      '\nType:', chalk.cyan(connection.type),
      '\nDatabase:', chalk.cyan(connection.database)
    );

    await connectionManager.closeConnection(connection.id);

    console.log(chalk.green('\n✓ Disconnected successfully!'));

    res.json({ success: true });
  } catch (error) {
    const err = error as ConnectionError;

    console.log(
      chalk.red('\n✗ Disconnect error:'),
      chalk.yellow(err.message)
    );

    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(
    chalk.yellow('\n[404]'),
    chalk.red(`Cannot ${req.method} ${req.path}`)
  );

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Add preflight handler for all routes
app.options('*', cors());

// Start server with a nice welcome message
app.listen(port, () => {
  console.clear();
  console.log('\n' + chalk.bold.blue('Database Connection Manager API'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.green('✓'), 'Frontend App:', chalk.cyan('http://localhost:5174'));
  console.log(chalk.green('✓'), 'Server running at:', chalk.cyan(`http://localhost:${port}`));
  console.log(chalk.green('✓'), 'API Documentation:', chalk.cyan(`http://localhost:${port}/api-docs`));
  console.log(chalk.green('✓'), 'Health Check:', chalk.cyan(`http://localhost:${port}/api/health`));
  console.log(chalk.gray('─'.repeat(50)), '\n');
  
  // Log available endpoints
  console.log(chalk.blue('Available API Endpoints:'));
  console.log(chalk.cyan('→'), 'POST /api/mysql/test-connection');
  console.log(chalk.cyan('→'), 'POST /api/postgresql/test-connection');
  console.log(chalk.cyan('→'), 'POST /api/mongodb/test-connection');
  console.log(chalk.cyan('→'), 'POST /api/sqlserver/test-connection');
  console.log(chalk.cyan('→'), 'POST /api/oracle/test-connection');
  console.log(chalk.gray('─'.repeat(50)), '\n');
}); 