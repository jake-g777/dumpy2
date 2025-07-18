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
        connectionName: connection.connectionName,
        databaseType: connection.databaseType,
        encryptedHostName: encryptedData.encryptedHostName,
        portId: connection.portId,
        encryptedServiceName: encryptedData.encryptedServiceName,
        encryptedUsername: encryptedData.encryptedUsername,
        encryptedPassword: encryptedData.encryptedPassword,
        sslRequired: connection.sslRequired,
        optionsJson: connection.optionsJson
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
      return savedConnection;
    } catch (error) {
      console.error('Error saving database connection:', error);
      throw error;
    }
  }

  static async updateConnection(connectionId: number, connection: DatabaseConnection): Promise<DatabaseConnectionResponse> {
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
        connectionName: connection.connectionName,
        databaseType: connection.databaseType,
        encryptedHostName: encryptedData.encryptedHostName,
        portId: connection.portId,
        encryptedServiceName: encryptedData.encryptedServiceName,
        encryptedUsername: encryptedData.encryptedUsername,
        encryptedPassword: encryptedData.encryptedPassword,
        sslRequired: connection.sslRequired,
        optionsJson: connection.optionsJson
      };

      const response = await fetch(`${this.API_URL}/database-connection/${connectionId}`, {
        method: 'PUT',
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
        throw new Error(`Failed to update database connection: ${errorData}`);
      }

      const updatedConnection = await response.json();
      return updatedConnection;
    } catch (error) {
      console.error('Error updating database connection:', error);
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
      const requestUrl = `${this.API_URL}/database-connection/user/${userId}`;
      console.log('Making request to:', requestUrl);

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
      console.log('Raw connections from server:', connections);
      
      // Decrypt each connection's sensitive data
      const decryptedConnections = connections.map((conn: DatabaseConnectionResponse) => {
        try {
          console.log('Processing connection:', conn);
          // The data from the server is already encrypted, so we need to decrypt it
          const decryptedData = EncryptionService.decryptConnectionData({
            password: conn.password,
            username: conn.username,
            hostName: conn.host,
            serviceName: conn.database,
          });
          console.log('Decrypted data:', decryptedData);

          // Return the connection with decrypted data
          return {
            ...conn,
            password: decryptedData.password,
            username: decryptedData.username || conn.username, // Fallback to original username if decryption fails
            host: decryptedData.hostName || conn.host,
            database: decryptedData.serviceName || conn.database
          };
        } catch (error) {
          console.error('Error decrypting connection:', error);
          return conn;
        }
      });

      console.log('Final decrypted connections:', decryptedConnections);
      return decryptedConnections;
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
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Deleting connection:', connectionId);
      const requestUrl = `${this.API_URL}/database-connection/${connectionId}`;
      console.log('Making request to:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'DELETE',
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
        throw new Error(`Failed to delete database connection: ${response.status} ${response.statusText} - ${errorData}`);
      }

      console.log('Successfully deleted connection:', connectionId);
    } catch (error) {
      console.error('Error deleting database connection:', error);
      throw error;
    }
  }
} 