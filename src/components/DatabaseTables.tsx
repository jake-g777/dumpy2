import React, { useState, useEffect } from 'react';
import { Table, ChevronDown, ChevronRight, Database, AlertCircle } from 'lucide-react';
import { gql, useQuery } from '@apollo/client';

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
  lastModified?: string;
  columns: TableColumn[];
}

interface DatabaseTablesProps {
  connectionId: string;
}

const GET_DATABASE_TABLES = gql`
  query GetDatabaseTables($connectionId: String!) {
    getDatabaseTables(connectionId: $connectionId) {
      name
      schema
      type
      rowCount
      lastModified
      columns {
        name
        dataType
        isNullable
        isPrimaryKey
        isForeignKey
        defaultValue
      }
    }
  }
`;

const DatabaseTables: React.FC<DatabaseTablesProps> = ({ connectionId }) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const { loading, error, data } = useQuery(GET_DATABASE_TABLES, {
    variables: { connectionId },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>Error loading tables: {error.message}</span>
      </div>
    );
  }

  const tables = data?.getDatabaseTables || [];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
          <span className="text-sm text-gray-500">({tables.length} tables)</span>
        </div>

        <div className="space-y-2">
          {tables.map((table: DatabaseTable) => (
            <div key={table.name} className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleTable(table.name)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedTables.has(table.name) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{table.name}</h3>
                    <p className="text-sm text-gray-500">
                      {table.type} • {table.rowCount.toLocaleString()} rows
                      {table.lastModified && ` • Modified ${new Date(table.lastModified).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </button>

              {expandedTables.has(table.name) && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {table.columns.map((column) => (
                          <tr key={column.name}>
                            <td className="px-3 py-2 text-sm text-gray-900">{column.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{column.dataType}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {column.isNullable ? 'Yes' : 'No'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {column.isPrimaryKey && 'PK'}
                              {column.isForeignKey && 'FK'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {column.defaultValue || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseTables; 