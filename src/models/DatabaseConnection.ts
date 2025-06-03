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
  request: {
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
}

export interface DatabaseConnectionResponse {
  dbInfoId: number;
  connectionName: string;
  databaseType: string;
  hostName: string;
  portId: number;
  serviceName: string;
  username: string;
  password: string;
  sslRequired: 'Y' | 'N';
  optionsJson?: string;
  createdAt: Date;
  updatedAt: Date;
} 