import React, { useState } from 'react';
import { X, Database, Table, Loader2, AlertCircle } from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (databaseId: string, tableId: string) => Promise<void>;
  onGenerateSql: (databaseType: string, tableName: string, columns: any[]) => void;
  parsedData: {
    headers: string[];
    rows: string[][];
  } | null;
}

const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  onGenerateSql,
  parsedData
}) => {
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [operationType, setOperationType] = useState<'select' | 'create'>('select');
  const [newTableName, setNewTableName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  if (!isOpen) return null;

  const handleOperation = async () => {
    if (!selectedConnection) return;
    
    setIsLoading(true);
    try {
      switch (operationType) {
        case 'select':
          if (!selectedTable) return;
          await onInsert(selectedConnection, selectedTable);
          onClose();
          break;
        case 'create':
          if (!newTableName) return;
          onGenerateSql('sqlserver', newTableName, parsedData?.headers.map(header => ({
            name: header,
            type: 'varchar',
            isNullable: true
          })) || []);
          setShowSqlPreview(true);
          break;
      }
    } catch (error) {
      console.error('Error performing operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Database Operations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
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
              >
                <option value="">Select a connection</option>
                {/* Add your database connections here */}
              </select>
            </div>

            {/* Operation Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOperationType('select')}
                  className={`p-4 rounded-md border ${
                    operationType === 'select'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Database className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Select Table</span>
                  <p className="text-xs text-gray-500 mt-1">Insert data into an existing table</p>
                </button>
                <button
                  onClick={() => setOperationType('create')}
                  className={`p-4 rounded-md border ${
                    operationType === 'create'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Table className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Create Table</span>
                  <p className="text-xs text-gray-500 mt-1">Create a new table and generate SQL</p>
                </button>
              </div>
            </div>

            {/* Table Selection or Creation */}
            {operationType === 'select' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a table</option>
                  {/* Add your tables here */}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Table Name
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* SQL Preview */}
            {showSqlPreview && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Generated SQL</h3>
                </div>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                  {generatedSql}
                </pre>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {showSqlPreview ? 'Close' : 'Cancel'}
          </button>
          {!showSqlPreview && (
            <button
              onClick={handleOperation}
              disabled={
                !selectedConnection || 
                (operationType === 'select' && !selectedTable) ||
                (operationType === 'create' && !newTableName) ||
                isLoading
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                operationType === 'select' ? 'Insert Data' : 'Generate SQL'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseModal; 