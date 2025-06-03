import { DatabaseConnection, DatabaseConnectionInput } from '../components/DatabaseConnections';

// Update the API base URL to point to your C# backend
const API_BASE_URL = 'http://localhost:5176/api';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details: string;
}

interface TableColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
}

interface DatabaseTable {
  name: string;
  schema: string;
  type: string;
  rowCount: number;
  lastModified?: Date;
  columns: TableColumn[];
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

  async getDatabases(connection: DatabaseConnection): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/database/databases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get databases');
    }

    return data;
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

  async getTables(connection: DatabaseConnection): Promise<DatabaseTable[]> {
    const response = await fetch(`${API_BASE_URL}/database/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get tables');
    }

    return data;
  }

  async getTableNames(connection: DatabaseConnection): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/database/table-names`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get table names');
    }

    return data;
  }

  async getViews(connection: DatabaseConnection): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/database/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get views');
    }

    return data;
  }
}

export const databaseService = new DatabaseService();
export default databaseService; 