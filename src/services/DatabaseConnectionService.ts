import { DatabaseConnection, DatabaseConnectionResponse, DatabaseConnectionRequest } from '../models/DatabaseConnection';
import { EncryptionService } from './EncryptionService';
import { auth } from '../firebase/config';

export class DatabaseConnectionService {
  private static readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5176/api';

  static async saveConnection(connection: DatabaseConnection): Promise<DatabaseConnectionResponse> {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Encrypt sensitive data
      const encryptedData = EncryptionService.encryptConnectionData({
        password: connection.password,
        username: connection.username,
        hostName: connection.hostName,
        serviceName: connection.serviceName,
      });

      const request: DatabaseConnectionRequest = {
        request: {
          connectionName: connection.connectionName,
          databaseType: connection.databaseType,
          encryptedHostName: encryptedData.encryptedHostName,
          portId: connection.portId,
          encryptedServiceName: encryptedData.encryptedServiceName,
          encryptedUsername: encryptedData.encryptedUsername,
          encryptedPassword: encryptedData.encryptedPassword,
          sslRequired: connection.sslRequired,
          optionsJson: connection.optionsJson
        }
      };

      const response = await fetch(`${this.API_URL}/database-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to save database connection: ${errorData}`);
      }

      const savedConnection = await response.json();
      return this.decryptConnectionResponse(savedConnection);
    } catch (error) {
      console.error('Error saving database connection:', error);
      throw error;
    }
  }

  static async getConnections(userId: number): Promise<DatabaseConnectionResponse[]> {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching connections for user:', userId);
      console.log('Using token:', token.substring(0, 10) + '...');

      const requestUrl = `${this.API_URL}/database-connection/user/${userId}`;
      console.log('Making request to:', requestUrl);
      console.log('Request headers:', {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      });

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to fetch database connections: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const connections = await response.json();
      console.log('Received connections:', connections);
      return connections.map((conn: DatabaseConnectionResponse) => this.decryptConnectionResponse(conn));
    } catch (error) {
      console.error('Error in getConnections:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch database connections: ${error.message}`);
      }
      throw error;
    }
  }

  static async deleteConnection(connectionId: number): Promise<void> {
    try {
      const response = await fetch(`${this.API_URL}/database-connection/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete database connection: ${errorData}`);
      }
    } catch (error) {
      console.error('Error deleting database connection:', error);
      throw error;
    }
  }

  private static decryptConnectionResponse(connection: DatabaseConnectionResponse): DatabaseConnectionResponse {
    try {
      const decryptedData = EncryptionService.decryptConnectionData({
        password: connection.password,
        username: connection.username,
        hostName: connection.hostName,
        serviceName: connection.serviceName,
      });

      return {
        ...connection,
        ...decryptedData,
      };
    } catch (error) {
      console.error('Error decrypting connection data:', error);
      throw new Error('Failed to decrypt connection data');
    }
  }
} 