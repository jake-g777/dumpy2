import React, { useEffect, useState } from 'react';
import databaseService from '../services/databaseService';
import { DatabaseConnection } from './DatabaseConnections';
import { Loader2, RefreshCw } from 'lucide-react';

interface DatabaseTablesProps {
  connectionId: string;
  connection: DatabaseConnection;
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseTables: React.FC<DatabaseTablesProps> = ({ 
  connection, 
  isOpen
}) => {
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTableNames = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await databaseService.getTableNames(connection);
      setTableNames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTableNames();
    }
  }, [isOpen, connection]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Tables</h3>
        <button
          onClick={fetchTableNames}
          disabled={loading}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Tables</span>
            </>
          )}
        </button>
      </div>

      {loading && tableNames.length === 0 ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          <p>Error: {error}</p>
          <button
            onClick={fetchTableNames}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      ) : tableNames.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No tables found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tableNames.map((tableName) => (
            <div
              key={tableName}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer"
            >
              {tableName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseTables; 