import React, { useEffect, useState } from 'react';
import databaseService from '../services/databaseService';
import { DatabaseConnection } from './DatabaseConnections';

interface DatabaseTablesProps {
  connectionId: string;
  connection: DatabaseConnection;
}

const DatabaseTables: React.FC<DatabaseTablesProps> = ({ connectionId, connection }) => {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await databaseService.query(
          connection,
          "SHOW TABLES"
        );
        setTables(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [connection, connectionId]);

  if (loading) return <div>Loading tables...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Tables</h3>
      <ul>
        {tables.map(table => (
          <li key={table}>{table}</li>
        ))}
      </ul>
    </div>
  );
};

export default DatabaseTables; 