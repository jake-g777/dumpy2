import { DatabaseConnection } from '../components/DatabaseConnections';
import { gql } from '@apollo/client';
import { client } from '../apollo/client';

// Update the API base URL to point to your C# backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5172/api';

const TEST_CONNECTION = gql`
  mutation TestConnection($type: String!, $connection: DatabaseConnectionInput!) {
    testConnection(type: $type, connection: $connection) {
      success
      message
      details
    }
  }
`;

class DatabaseService {
  async testConnection(connection: DatabaseConnection) {
    console.log('Testing connection to:', {
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      // Don't log the password for security
    });
    
    try {
      const response = await client.mutate({
        mutation: TEST_CONNECTION,
        variables: {
          type: connection.type,
          connection: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username,
            password: connection.password,
            ssl: connection.ssl
          }
        }
      });
      
      console.log('Connection test response:', response);
      return response;
    } catch (error) {
      console.error('Connection test error:', error);
      throw error;
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