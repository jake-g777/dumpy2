export interface DatabaseConnection {
  connectionName: string;
  databaseType: string;
  hostName: string;
  portId: number;
  serviceName: string;
  username: string;
  password: string;
  sslRequired: boolean;
  optionsJson?: string;
}

export interface DatabaseConnectionRequest {
  connectionName: string;
  databaseType: string;
  encryptedHostName: string;
  portId: number;
  encryptedServiceName: string;
  encryptedUsername: string;
  encryptedPassword: string;
  sslRequired: boolean;
  optionsJson?: string;
}

export interface DatabaseConnectionResponse {
  dbInfoId: number;
  duUserId: number;
  connectionName: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  optionsJson: string;
  createdAt: string;
  updatedAt: string;
} 