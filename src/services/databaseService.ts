import { DatabaseConnection, DatabaseConnectionInput } from '../components/DatabaseConnections';

// Update the API base URL to point to your C# backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5176/api';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details: string;
}

class DatabaseService {
  async testConnection(connection: DatabaseConnectionInput): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/database/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to test connection');
      }

      return data;
    } catch (error) {
      console.error('Test connection error:', error);
      throw error;
    }
  }

  async query(connection: DatabaseConnection, query: string, params: any[] = []) {
    const response = await fetch(`${API_BASE_URL}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        connection: {
          type: connection.type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          ssl: connection.ssl
        },
        query,
        params 
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Query failed');
    }

    return data;
  }

  async disconnect(connection: DatabaseConnection): Promise<void> {
    await fetch(`${API_BASE_URL}/${connection.type}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection }),
    });
  }
}

export const databaseService = new DatabaseService();
export default databaseService; 