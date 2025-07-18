import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Database, X, RefreshCw } from 'lucide-react';
import { DatabaseConnectionService } from '../services/DatabaseConnectionService';
import { useAuth } from '../contexts/AuthContext';

interface DataGridProps {
  headers: string[];
  data: string[][];
  isLoading?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ headers, data, isLoading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [columnWidths, setColumnWidths] = useState<number[]>(headers.map(() => 150));
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [databaseConnections, setDatabaseConnections] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const { databaseUserId } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn === null) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);

      setColumnWidths(prev => {
        const newWidths = [...prev];
        newWidths[resizingColumn] = newWidth;
        return newWidths;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, startX, startWidth]);

  useEffect(() => {
    const loadConnections = async () => {
      if (!databaseUserId) {
        console.error('No database user ID available');
        return;
      }
      
      setIsLoadingConnections(true);
      try {
        console.log('Fetching connections for user:', databaseUserId);
        const connections = await DatabaseConnectionService.getConnections(databaseUserId);
        console.log('Fetched connections:', connections);
        
        if (!connections || connections.length === 0) {
          console.log('No connections found');
          setDatabaseConnections([]);
          return;
        }

        setDatabaseConnections(connections);
      } catch (error) {
        console.error('Failed to load database connections:', error);
        setDatabaseConnections([]);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    if (showDatabaseModal) {
      loadConnections();
    }
  }, [showDatabaseModal, databaseUserId]);

  useEffect(() => {
    const loadTables = async () => {
      if (!selectedConnection) {
        setAvailableTables([]);
        return;
      }

      setIsLoadingTables(true);
      try {
        const connection = databaseConnections.find(conn => conn.dbInfoId.toString() === selectedConnection);
        if (!connection) return;

        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5176/api'}/database/tables`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: connection.type,
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username,
            password: connection.password,
            ssl: connection.ssl
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tables');
        }

        const tables = await response.json();
        setAvailableTables(tables);
      } catch (error) {
        console.error('Failed to load tables:', error);
        setAvailableTables([]);
      } finally {
        setIsLoadingTables(false);
      }
    };

    loadTables();
  }, [selectedConnection, databaseConnections]);

  const handleResizeStart = (columnIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnIndex);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnIndex]);
  };

  const handleDatabaseOperation = async () => {
    if (!selectedConnection || !selectedTable) return;
    
    const connection = databaseConnections.find(conn => conn.dbInfoId.toString() === selectedConnection);
    if (!connection) return;

    try {
      // Prepare the data for insertion
      const insertData = {
        connection: {
          type: connection.type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          ssl: connection.ssl
        },
        table: selectedTable,
        columns: headers,
        data: data
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5176/api'}/database/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(insertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to insert data');
      }

      // Close the modal and show success message
      setShowDatabaseModal(false);
      setSelectedConnection('');
      setSelectedTable('');
      setAvailableTables([]);
      
      // You might want to add a toast notification here
      alert('Data successfully inserted into the database!');
    } catch (error) {
      console.error('Error inserting data:', error);
      alert(error instanceof Error ? error.message : 'Failed to insert data into the database');
    }
  };

  const handleRefreshConnections = async () => {
    if (!databaseUserId) {
      console.error('No database user ID available');
      return;
    }
    
    setIsLoadingConnections(true);
    try {
      console.log('Refreshing connections for user:', databaseUserId);
      const connections = await DatabaseConnectionService.getConnections(databaseUserId);
      console.log('Refreshed connections:', connections);
      
      if (!connections || connections.length === 0) {
        console.log('No connections found');
        setDatabaseConnections([]);
        return;
      }

      setDatabaseConnections(connections);
    } catch (error) {
      console.error('Failed to refresh database connections:', error);
      setDatabaseConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-gray-200 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="h-full w-full bg-white">
      <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Data Grid</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshConnections}
              disabled={isLoadingConnections}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingConnections ? 'animate-spin' : ''}`} />
              Refresh Connections
            </button>
            <button
              onClick={() => setShowDatabaseModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Database className="w-4 h-4 mr-2" />
              Database Operations
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap relative group border-r-2 border-gray-600"
                    style={{ width: columnWidths[index] }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{header}</span>
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 group-hover:bg-blue-500 transition-colors"
                           onMouseDown={(e) => handleResizeStart(index, e)}>
                        <GripVertical className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r-2 border-gray-600"
                      style={{ width: columnWidths[cellIndex] }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-700">Rows per page:</label>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="rounded border-gray-300 text-sm"
            >
              {[5, 10, 25, 50, 100].map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Operations Modal */}
      {showDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Database Operations</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefreshConnections}
                  disabled={isLoadingConnections}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingConnections ? 'animate-spin' : ''}`} />
                  Refresh Connections
                </button>
                <button
                  onClick={() => setShowDatabaseModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Database Connection Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Database Connection
                  </label>
                  <select
                    value={selectedConnection}
                    onChange={(e) => setSelectedConnection(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoadingConnections}
                  >
                    <option value="">Select a connection</option>
                    {databaseConnections.map((conn) => (
                      <option key={conn.dbInfoId} value={conn.dbInfoId}>
                        {conn.connectionName} ({conn.type})
                      </option>
                    ))}
                  </select>
                  {isLoadingConnections && (
                    <p className="mt-1 text-sm text-gray-500">Loading connections...</p>
                  )}
                  {!isLoadingConnections && databaseConnections.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">No database connections found. Please add a connection first.</p>
                  )}
                </div>

                {/* Table Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Table
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedConnection || isLoadingTables}
                  >
                    <option value="">Select a table</option>
                    {availableTables.map((table) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                  {isLoadingTables && (
                    <p className="mt-1 text-sm text-gray-500">Loading tables...</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDatabaseModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDatabaseOperation}
                disabled={!selectedConnection || !selectedTable}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid; 