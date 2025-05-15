export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pooling?: ConnectionPoolConfig; // Optional pooling configuration
}

export interface ConnectionPoolConfig {
  max?: number;        // Maximum number of connections
  min?: number;        // Minimum number of connections
  idle?: number;       // Max milliseconds a connection can be idle
  acquire?: number;    // Max milliseconds to acquire a connection
}

export interface ConnectionError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
  sql?: string;
}

export interface DatabaseValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export type DatabaseErrorCode = 
  | 'AUTH_FAILED'
  | 'CONN_REFUSED'
  | 'DB_NOT_FOUND'
  | 'TIMEOUT'
  | 'SSL_REQUIRED'
  | 'INVALID_CONFIG';

// Database-specific error codes
export const DatabaseErrorCodes: Record<string, DatabaseErrorCode> = {
  AUTHENTICATION_FAILED: 'AUTH_FAILED',
  CONNECTION_REFUSED: 'CONN_REFUSED',
  DATABASE_NOT_FOUND: 'DB_NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  SSL_REQUIRED: 'SSL_REQUIRED',
  INVALID_CONFIG: 'INVALID_CONFIG',
};

// Connection states
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
} 