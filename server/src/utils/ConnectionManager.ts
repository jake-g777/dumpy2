import mysql from 'mysql2/promise';
import { Pool, Client } from 'pg';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { ConnectionPool, config as MSSQLConfig } from 'mssql';
import oracledb, { ConnectionAttributes, Pool as OraclePool } from 'oracledb';
import { 
  DatabaseConnection, 
  ConnectionError, 
  DatabaseErrorCodes,
  ConnectionState,
  DatabaseValidation
} from '../types';

interface PooledConnection {
  pool: any;
  state: ConnectionState;
  lastUsed: Date;
  config: DatabaseConnection;
}

class ConnectionManager {
  private connections: Map<string, PooledConnection>;
  private readonly DEFAULT_TIMEOUT = 5000;
  private readonly DEFAULT_POOL_CONFIG = {
    max: 10,
    min: 1,
    idle: 60000,
    acquire: 30000
  };

  constructor() {
    this.connections = new Map();
    // Cleanup idle connections periodically
    setInterval(() => this.cleanupIdleConnections(), 60000);
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    for (const [id, conn] of this.connections.entries()) {
      const idleTime = now.getTime() - conn.lastUsed.getTime();
      if (idleTime > (conn.config.pooling?.idle || this.DEFAULT_POOL_CONFIG.idle)) {
        await this.closeConnection(id);
      }
    }
  }

  private validateConnection(config: DatabaseConnection): DatabaseValidation {
    const errors = [];
    
    if (!config.host) errors.push({ field: 'host', message: 'Host is required' });
    if (!config.port) errors.push({ field: 'port', message: 'Port is required' });
    if (!config.database) errors.push({ field: 'database', message: 'Database name is required' });
    if (!config.username) errors.push({ field: 'username', message: 'Username is required' });
    
    // Validate port number
    if (config.port && isNaN(parseInt(config.port))) {
      errors.push({ field: 'port', message: 'Port must be a number' });
    }
    
    // Validate pooling configuration if provided
    if (config.pooling) {
      if (config.pooling.max && config.pooling.max < 1) {
        errors.push({ field: 'pooling.max', message: 'Max pool size must be at least 1' });
      }
      if (config.pooling.min && config.pooling.min < 0) {
        errors.push({ field: 'pooling.min', message: 'Min pool size cannot be negative' });
      }
      if (config.pooling.min && config.pooling.max && config.pooling.min > config.pooling.max) {
        errors.push({ field: 'pooling', message: 'Min pool size cannot be greater than max' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async createConnection(config: DatabaseConnection): Promise<any> {
    const validation = this.validateConnection(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    try {
      let pool;
      const poolConfig = { ...this.DEFAULT_POOL_CONFIG, ...config.pooling };

      switch (config.type) {
        case 'mysql':
          pool = mysql.createPool({
            host: config.host,
            port: parseInt(config.port),
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
            connectionLimit: poolConfig.max,
            queueLimit: poolConfig.max * 2,
            connectTimeout: this.DEFAULT_TIMEOUT,
          });
          break;

        case 'postgresql':
          pool = new Pool({
            host: config.host,
            port: parseInt(config.port),
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
            max: poolConfig.max,
            idleTimeoutMillis: poolConfig.idle,
            connectionTimeoutMillis: this.DEFAULT_TIMEOUT,
          });
          break;

        case 'mongodb':
          const mongoUrl = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
          const mongoOptions: MongoClientOptions = {
            maxPoolSize: poolConfig.max,
            minPoolSize: poolConfig.min,
            serverSelectionTimeoutMS: this.DEFAULT_TIMEOUT,
            ssl: config.ssl,
          };
          pool = await MongoClient.connect(mongoUrl, mongoOptions);
          break;

        case 'sqlserver':
          const sqlConfig: MSSQLConfig = {
            server: config.host,
            port: parseInt(config.port),
            user: config.username,
            password: config.password,
            database: config.database,
            options: {
              encrypt: config.ssl,
              trustServerCertificate: true,
              connectTimeout: this.DEFAULT_TIMEOUT,
            },
            pool: {
              max: poolConfig.max,
              min: poolConfig.min,
              idleTimeoutMillis: poolConfig.idle,
            },
          };
          pool = await new ConnectionPool(sqlConfig).connect();
          break;

        case 'oracle':
          await oracledb.createPool({
            user: config.username,
            password: config.password,
            connectString: `${config.host}:${config.port}/${config.database}`,
            poolMax: poolConfig.max,
            poolMin: poolConfig.min,
            poolTimeout: poolConfig.idle / 1000, // Oracle uses seconds
          });
          pool = await oracledb.getPool();
          break;

        default:
          throw new Error(`Unsupported database type: ${config.type}`);
      }

      const pooledConnection: PooledConnection = {
        pool,
        state: ConnectionState.CONNECTED,
        lastUsed: new Date(),
        config
      };

      this.connections.set(config.id, pooledConnection);
      return pool;
    } catch (error) {
      const err = error as ConnectionError;
      let errorCode = DatabaseErrorCodes.INVALID_CONFIG;

      // Map common error patterns to our error codes
      if (err.message?.includes('access denied') || err.message?.includes('authentication failed')) {
        errorCode = DatabaseErrorCodes.AUTHENTICATION_FAILED;
      } else if (err.message?.includes('ECONNREFUSED')) {
        errorCode = DatabaseErrorCodes.CONNECTION_REFUSED;
      } else if (err.message?.includes('database') && err.message?.includes('not found')) {
        errorCode = DatabaseErrorCodes.DATABASE_NOT_FOUND;
      } else if (err.message?.includes('timeout')) {
        errorCode = DatabaseErrorCodes.TIMEOUT;
      } else if (err.message?.includes('SSL')) {
        errorCode = DatabaseErrorCodes.SSL_REQUIRED;
      }

      throw new Error(`Failed to create ${config.type} connection: ${err.message} (${errorCode})`);
    }
  }

  async testConnection(config: DatabaseConnection): Promise<boolean> {
    try {
      const pool = await this.createConnection(config);
      let testResult = false;

      switch (config.type) {
        case 'mysql': {
          const conn = await pool.getConnection();
          await conn.ping();
          conn.release();
          testResult = true;
          break;
        }
        case 'postgresql': {
          const client = await pool.connect();
          await client.query('SELECT NOW()');
          client.release();
          testResult = true;
          break;
        }
        case 'mongodb':
          await pool.db().admin().ping();
          testResult = true;
          break;
        case 'sqlserver':
          await pool.request().query('SELECT GETDATE()');
          testResult = true;
          break;
        case 'oracle': {
          const conn = await pool.getConnection();
          await conn.execute('SELECT SYSDATE FROM DUAL');
          await conn.close();
          testResult = true;
          break;
        }
      }

      await this.closeConnection(config.id);
      return testResult;
    } catch (error) {
      const err = error as ConnectionError;
      console.error(`Test connection failed for ${config.type}:`, err.message);
      return false;
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      connection.state = ConnectionState.DISCONNECTING;
      const pool = connection.pool;

      if (typeof pool.end === 'function') {
        await pool.end();
      } else if (typeof pool.close === 'function') {
        await pool.close();
      } else if (typeof pool.terminate === 'function') {
        await pool.terminate();
      }

      connection.state = ConnectionState.DISCONNECTED;
    } catch (error) {
      const err = error as ConnectionError;
      connection.state = ConnectionState.ERROR;
      console.error(`Error closing connection: ${err.message}`);
    } finally {
      this.connections.delete(connectionId);
    }
  }

  async executeQuery(connectionId: string, query: string, params: any[] = []): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.lastUsed = new Date();
    const pool = connection.pool;

    try {
      let result;
      switch (connection.config.type) {
        case 'mysql': {
          const conn = await pool.getConnection();
          try {
            [result] = await conn.execute(query, params);
          } finally {
            conn.release();
          }
          break;
        }
        case 'postgresql': {
          const client = await pool.connect();
          try {
            result = await client.query(query, params);
          } finally {
            client.release();
          }
          break;
        }
        case 'mongodb':
          result = await pool.db().aggregate(JSON.parse(query)).toArray();
          break;
        case 'sqlserver':
          result = await pool.request()
            .input('params', params)
            .query(query);
          break;
        case 'oracle': {
          const conn = await pool.getConnection();
          try {
            result = await conn.execute(query, params);
          } finally {
            await conn.close();
          }
          break;
        }
        default:
          throw new Error('Unsupported connection type');
      }
      return result;
    } catch (error) {
      const err = error as ConnectionError;
      throw new Error(`Query execution failed: ${err.message}`);
    }
  }
}

export const connectionManager = new ConnectionManager();
export default connectionManager; 