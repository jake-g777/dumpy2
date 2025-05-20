import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, ChevronDown, AlertCircle, ChevronUp } from 'lucide-react';
import secureStorage from '../services/secureStorage';
import databaseService from '../services/databaseService';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { gql, useSubscription } from '@apollo/client';
import DatabaseTables from './DatabaseTables';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

interface DatabaseConnectionsProps {
  onConnect: (connection: DatabaseConnection) => void;
}

interface LogMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
  connectionName?: string;
}

type ConnectionStatusType = 'untested' | 'success' | 'failed';

interface ConnectionStatus {
  id: string;
  status: ConnectionStatusType;
  lastTested?: Date;
  metrics?: {
    responseTime: number;
    activeQueries: number;
  };
}

interface ConnectionStatusSubscription {
  onConnectionStatusChange: {
    status: ConnectionStatusType;
    lastTested: string;
    error?: string;
    metrics?: {
      responseTime: number;
      activeQueries: number;
    };
  };
}

const DATABASE_TYPES = {
  mysql: {
    name: 'MySQL',
    defaultPort: '3306',
    hostPlaceholder: 'localhost or 127.0.0.1',
    databasePlaceholder: 'my_database',
    icon: '🐬'
  },
  postgresql: {
    name: 'PostgreSQL',
    defaultPort: '5432',
    hostPlaceholder: 'localhost or 127.0.0.1',
    databasePlaceholder: 'postgres',
    icon: '🐘'
  },
  mongodb: {
    name: 'MongoDB',
    defaultPort: '27017',
    hostPlaceholder: 'localhost or mongodb://localhost',
    databasePlaceholder: 'admin',
    icon: '🍃'
  },
  sqlserver: {
    name: 'SQL Server',
    defaultPort: '1433',
    hostPlaceholder: 'localhost or server\\instance',
    databasePlaceholder: 'master',
    icon: '💠'
  },
  oracle: {
    name: 'Oracle',
    defaultPort: '1521',
    hostPlaceholder: 'localhost or oracle.example.com',
    databasePlaceholder: 'ORCL',
    icon: '⭕'
  }
};

const CONNECTION_STATUS_SUBSCRIPTION = gql`
  subscription OnConnectionStatusChange($connectionId: String!) {
    onConnectionStatusChange(connectionId: $connectionId) {
      status
      lastTested
      error
      metrics {
        responseTime
        activeQueries
      }
    }
  }
`;

const DatabaseConnections: React.FC<DatabaseConnectionsProps> = ({ onConnect }) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [savingConnection, setSavingConnection] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  
  const [newConnection, setNewConnection] = useState<DatabaseConnection>({
    id: '',
    name: '',
    type: 'mysql',
    host: '',
    port: DATABASE_TYPES.mysql.defaultPort,
    database: '',
    username: '',
    password: '',
    ssl: true
  });

  // Load connections from secure storage on mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const stored = secureStorage.getItem();
        if (stored) {
          setConnections(stored);
        }
      } catch (error) {
        console.error('Failed to load connections:', error);
      }
    };
    loadConnections();
  }, []);

  // Save connections to secure storage when updated
  useEffect(() => {
    const saveConnections = async () => {
      try {
        secureStorage.setItem(connections);
      } catch (error) {
        console.error('Failed to save connections:', error);
      }
    };
    saveConnections();
  }, [connections]);

  // Reset form when modal is closed
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConnection(null);
    setNewConnection({
      id: '',
      name: '',
      type: 'mysql',
      host: '',
      port: DATABASE_TYPES.mysql.defaultPort,
      database: '',
      username: '',
      password: '',
      ssl: true
    });
  };

  // Handle edit button click
  const handleEditClick = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setNewConnection(connection);
    setShowModal(true);
  };

  const handleSaveConnection = async () => {
    setSavingConnection(true);
    try {
      // Validate required fields
      if (!newConnection.name || !newConnection.host || !newConnection.database) {
        addLog('Please fill in all required fields', 'error');
        return;
      }

      // Validate host format
      if (newConnection.host === 'localhose') {
        addLog('Did you mean "localhost"? Please check the hostname spelling.', 'error');
        return;
      }

      // Validate host format for common mistakes
      if (!/^[a-zA-Z0-9.-]+$/.test(newConnection.host)) {
        addLog('Invalid hostname format. Please use only letters, numbers, dots, and hyphens.', 'error');
        return;
      }

      // Validate port number
      const portNum = parseInt(newConnection.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        addLog('Invalid port number. Please enter a number between 1 and 65535.', 'error');
        return;
      }

      if (editingConnection) {
        // Update existing connection
        setConnections(connections.map(conn => 
          conn.id === editingConnection.id ? newConnection : conn
        ));
        addLog(`Connection "${newConnection.name}" updated successfully`, 'success');
      } else {
        // Add new connection with untested status
        const connection = {
          ...newConnection,
          id: Date.now().toString()
        };
        setConnections([...connections, connection]);
        setConnectionStatuses(prev => [...prev, { id: connection.id, status: 'untested' }]);
        addLog(`Connection "${connection.name}" added successfully`, 'success');
      }

      handleCloseModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      addLog(`Failed to save connection: ${errorMessage}`, 'error');
    } finally {
      setSavingConnection(false);
    }
  };

  const handleTypeChange = (type: DatabaseConnection['type']) => {
    setNewConnection({
      ...newConnection,
      type,
      port: DATABASE_TYPES[type].defaultPort
    });
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const addLog = (message: string, type: LogMessage['type'], connectionName?: string) => {
    const newLog: LogMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      connectionName
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const handleTestConnection = async (connection: DatabaseConnection) => {
    setTestingConnection(connection.id);
    addLog(`Testing connection to ${connection.name}...`, 'info', connection.name);
    
    try {
      const { data } = await databaseService.testConnection(connection);
      const success = data.testConnection.success;
      const message = data.testConnection.message;
      const details = data.testConnection.details;
      
      setConnectionStatuses(prev => prev.map(status => 
        status.id === connection.id 
          ? { id: connection.id, status: success ? 'success' : 'failed', lastTested: new Date() }
          : status
      ));
      
      if (success) {
        addLog(`Successfully connected to ${connection.name}`, 'success', connection.name);
        if (details) {
          addLog(details, 'info', connection.name);
        }
      } else {
        addLog(`Failed to connect to ${connection.name}: ${message}`, 'error', connection.name);
        if (details) {
          addLog(details, 'error', connection.name);
        }
      }
    } catch (error) {
      setConnectionStatuses(prev => prev.map(status => 
        status.id === connection.id 
          ? { id: connection.id, status: 'failed', lastTested: new Date() }
          : status
      ));
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Connection error for ${connection.name}: ${errorMessage}`, 'error', connection.name);
    } finally {
      setTestingConnection(null);
    }
  };

  // Format timestamp for logs
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const { data: subscriptionData, error: subscriptionError } = useSubscription<ConnectionStatusSubscription>(
    CONNECTION_STATUS_SUBSCRIPTION,
    {
      variables: {
        connectionId: editingConnection?.id ?? '',
      },
      skip: !editingConnection,
      onData: ({ data }) => {
        if (data?.data?.onConnectionStatusChange) {
          const subscriptionData = data.data.onConnectionStatusChange;
          setConnectionStatuses((prev) =>
            prev.map((status) =>
              status.id === editingConnection?.id
                ? {
                    id: editingConnection.id,
                    status: subscriptionData.status as ConnectionStatusType,
                    lastTested: new Date(subscriptionData.lastTested),
                    metrics: subscriptionData.metrics,
                  }
                : status
            )
          );
        }
      },
      onError: (error) => {
        console.error('Subscription error:', error);
        addLog(`Subscription error: ${error.message}`, 'error');
      },
      onComplete: () => {
        console.log('Subscription completed');
      },
    }
  );

  // Add error handling for subscription errors
  useEffect(() => {
    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      addLog(`Subscription error: ${subscriptionError.message}`, 'error');
    }
  }, [subscriptionError]);

  // Cleanup subscription when component unmounts or editing connection changes
  useEffect(() => {
    return () => {
      // Cleanup will be handled by Apollo Client
    };
  }, [editingConnection?.id]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* Header - Fixed height */}
      <div className="flex-none flex justify-between items-center px-6 py-1.5 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Database Connections</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-900 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Connection
        </button>
      </div>

      {/* Main Content Area - Scrollable with bottom margin for console */}
      <div className="flex-1 min-h-0 bg-gray-50">
        <div className={`h-full overflow-y-auto p-3 ${isConsoleCollapsed ? 'pb-8' : 'pb-80'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-1.5">
              {connections.length === 0 ? (
                <div className="text-center py-6">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No database connections yet</p>
                  <p className="text-sm text-gray-400">Click "Add Connection" to get started</p>
                </div>
              ) : (
                connections.map(connection => {
                  const status = connectionStatuses.find(s => s.id === connection.id);
                  return (
                    <div
                      key={connection.id}
                      className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-sm transition-shadow relative"
                    >
                      {/* Status Indicator */}
                      <div className="absolute top-4 right-4">
                        <div 
                          className={`h-3 w-3 rounded-full ${
                            !status || status.status === 'untested' 
                              ? 'bg-yellow-400 animate-pulse' 
                              : status.status === 'success'
                              ? 'bg-green-400 animate-pulse'
                              : 'bg-red-400 animate-pulse'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between pr-8">
                        <div className="flex items-center space-x-3">
                          <Database className="w-5 h-5 text-gray-500" />
                          <div>
                            <h3 className="font-medium text-gray-900">{connection.name}</h3>
                            <p className="text-sm text-gray-500">
                              {connection.type} • {connection.host}:{connection.port}
                            </p>
                            {status?.lastTested && (
                              <p className="text-xs text-gray-400">
                                Last tested: {new Date(status.lastTested).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConnection(connection)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                              testingConnection === connection.id
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            disabled={testingConnection === connection.id}
                          >
                            {testingConnection === connection.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => setSelectedConnection(selectedConnection === connection.id ? null : connection.id)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                              selectedConnection === connection.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {selectedConnection === connection.id ? 'Hide Tables' : 'Show Tables'}
                          </button>
                          <button
                            onClick={() => handleEditClick(connection)}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConnection(connection.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {selectedConnection === connection.id && status?.status === 'success' && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <DatabaseTables connectionId={connection.id} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Console - Fixed at bottom with drawer offset */}
      <div className={`flex-none border-t border-gray-200 bg-gray-900 text-white transition-all duration-200 ${isConsoleCollapsed ? 'h-8' : 'h-80'}`}>
        <div className="flex items-center justify-between px-4 py-1 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connection Logs</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear logs
            </button>
            <button
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              {isConsoleCollapsed ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        {!isConsoleCollapsed && (
          <div className="h-[calc(20rem-2rem)] overflow-y-auto p-1.5 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-xs p-1.5">No connection logs yet</div>
            ) : (
              <div className="space-y-0.5">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`px-2 py-0.5 rounded ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>
                    {log.connectionName && (
                      <span className="text-gray-400"> ({log.connectionName})</span>
                    )}
                    : {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal - Fixed position with internal scroll if needed */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingConnection ? 'Edit Database Connection' : 'Add Database Connection'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Connection Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Development Database"
                />
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Type
                </label>
                <select
                  value={newConnection.type}
                  onChange={(e) => handleTypeChange(e.target.value as DatabaseConnection['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DATABASE_TYPES).map(([value, { name, icon }]) => (
                    <option key={value} value={value}>
                      {icon} {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                  <span className="text-xs text-gray-500 ml-1">
                    (Server address)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={DATABASE_TYPES[newConnection.type].hostPlaceholder}
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                  <span className="text-xs text-gray-500 ml-1">
                    (Default: {DATABASE_TYPES[newConnection.type].defaultPort})
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={DATABASE_TYPES[newConnection.type].defaultPort}
                />
              </div>

              {/* Database Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                  <span className="text-xs text-gray-500 ml-1">
                    (Schema or service name)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.database}
                  onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={DATABASE_TYPES[newConnection.type].databasePlaceholder}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                  <span className="text-xs text-gray-500 ml-1">
                    (Database user)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newConnection.password}
                    onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* SSL */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newConnection.ssl}
                  onChange={(e) => setNewConnection({ ...newConnection, ssl: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Use SSL/TLS connection
                  <span className="text-xs text-gray-500 ml-1">
                    (Recommended for production)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                disabled={savingConnection}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnection}
                className={`px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 ${
                  savingConnection ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={savingConnection}
              >
                {savingConnection ? 'Saving...' : editingConnection ? 'Save Changes' : 'Add Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnections; 