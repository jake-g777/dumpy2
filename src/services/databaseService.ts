import { DatabaseConnection } from '../components/DatabaseConnections';

// Get the API URL from environment variables or use a default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class DatabaseService {
  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      console.log('Attempting connection to:', `${API_BASE_URL}/${connection.type}/test-connection`);
      console.log('Connection details:', { ...connection, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/${connection.type}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      return data.success;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      console.error('Full error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace available',
      });
      return false;
    }
  }

  async query(connection: DatabaseConnection, query: string, params: any[] = []): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/${connection.type}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection, query, params }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.rows;
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