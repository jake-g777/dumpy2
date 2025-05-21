import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, ChevronDown, AlertCircle, ChevronUp, ChevronRight, Table } from 'lucide-react';
import secureStorage from '../services/secureStorage';
import databaseService from '../services/databaseService';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import DatabaseTables from './DatabaseTables';

export interface DatabaseConnectionInput {
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface DatabaseConnection extends DatabaseConnectionInput {
  id: string;
  name: string;
}

export interface DatabaseConnectionFormState extends DatabaseConnectionInput {
  name: string;
  showAllDatabases: boolean;
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

interface DatabaseInfo {
  name: string;
  tables: string[];
}

const DATABASE_TYPES = {
  mysql: {
    name: 'MySQL',
    defaultPort: 3306,
    hostPlaceholder: 'localhost or 127.0.0.1',
    databasePlaceholder: 'my_database',
    icon: '🐬'
  },
  postgresql: {
    name: 'PostgreSQL',
    defaultPort: 5432,
    hostPlaceholder: 'localhost or 127.0.0.1',
    databasePlaceholder: 'postgres',
    icon: '🐘'
  },
  mongodb: {
    name: 'MongoDB',
    defaultPort: 27017,
    hostPlaceholder: 'localhost or mongodb://localhost',
    databasePlaceholder: 'admin',
    icon: '🍃'
  },
  sqlserver: {
    name: 'SQL Server',
    defaultPort: 1433,
    hostPlaceholder: 'localhost or server\\instance',
    databasePlaceholder: 'master',
    icon: '💠'
  },
  oracle: {
    name: 'Oracle',
    defaultPort: 1521,
    hostPlaceholder: 'localhost or oracle.example.com',
    databasePlaceholder: 'ORCL',
    icon: '⭕'
  }
};

// Add this CSS animation at the top of the file after the imports
const statusStyles = {
  untested: 'bg-yellow-400 animate-pulse',
  success: 'bg-green-400 animate-pulse',
  failed: 'bg-red-400 animate-pulse'
};

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
  const [selectedConnectionForTables, setSelectedConnectionForTables] = useState<string | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [databaseInfo, setDatabaseInfo] = useState<Record<string, DatabaseInfo[]>>({});
  const [loadingDatabases, setLoadingDatabases] = useState<Set<string>>(new Set());
  
  const [newConnection, setNewConnection] = useState<DatabaseConnectionFormState>({
    type: 'mysql' as const,
    host: '',
    port: DATABASE_TYPES.mysql.defaultPort,
    database: '',
    username: '',
    password: '',
    ssl: true,
    name: '',
    showAllDatabases: false
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
      type: 'mysql' as const,
      host: '',
      port: DATABASE_TYPES.mysql.defaultPort,
      database: '',
      username: '',
      password: '',
      ssl: true,
      name: '',
      showAllDatabases: false
    });
  };

  // Handle edit button click
  const handleEditClick = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setNewConnection({
      ...connection,
      showAllDatabases: connection.database.toLowerCase() === 'mysql'
    });
    setShowModal(true);
  };

  const handleSaveConnection = async () => {
    setSavingConnection(true);
    try {
      // Validate required fields
      if (!newConnection.name || !newConnection.host || (!newConnection.database && !newConnection.showAllDatabases)) {
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
      const portNum = newConnection.port;
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        addLog('Invalid port number. Please enter a number between 1 and 65535.', 'error');
        return;
      }

      let connectionId: string;
      if (editingConnection) {
        // Update existing connection
        connectionId = editingConnection.id;
        setConnections(connections.map(conn => 
          conn.id === editingConnection.id ? { 
            ...conn, 
            ...newConnection,
            database: newConnection.showAllDatabases ? 'mysql' : newConnection.database
          } : conn
        ));
        addLog(`Connection "${newConnection.name}" updated successfully`, 'success');
      } else {
        // Add new connection with untested status
        connectionId = Date.now().toString();
        const connection = {
          ...newConnection,
          id: connectionId,
          name: newConnection.name,
          database: newConnection.showAllDatabases ? 'mysql' : newConnection.database
        };
        setConnections([...connections, connection]);
        setConnectionStatuses(prev => [...prev, { id: connectionId, status: 'untested' }]);
        addLog(`Connection "${connection.name}" added successfully`, 'success');
      }

      handleCloseModal();

      // Test the connection immediately after saving
      try {
        setTestingConnection(connectionId);
        const result = await databaseService.testConnection({
          type: newConnection.type,
          host: newConnection.host,
          port: newConnection.port,
          database: newConnection.database,
          username: newConnection.username,
          password: newConnection.password,
          ssl: newConnection.ssl
        });

        if (result?.success) {
          addLog(`Successfully connected to ${newConnection.name}`, 'success');
          setConnectionStatuses(prev => 
            prev.map(s => s.id === connectionId ? { ...s, status: 'success' as const } : s)
          );
        } else {
          addLog(`Connection failed: ${result?.message}`, 'error');
          setConnectionStatuses(prev => 
            prev.map(s => s.id === connectionId ? { ...s, status: 'failed' as const } : s)
          );
        }
      } catch (error) {
        console.error('Test connection error:', error);
        addLog(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
        setConnectionStatuses(prev => 
          prev.map(s => s.id === connectionId ? { ...s, status: 'failed' as const } : s)
        );
      } finally {
        setTestingConnection(null);
      }
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

  const handleTestConnection = async () => {
    try {
      // Validate required fields
      if (!newConnection.host) {
        addLog('Host is required', 'error');
        return;
      }
      if (!newConnection.database) {
        addLog('Database name is required', 'error');
        return;
      }
      if (!newConnection.username) {
        addLog('Username is required', 'error');
        return;
      }
      if (!newConnection.password) {
        addLog('Password is required', 'error');
        return;
      }

      console.log('Testing connection with:', {
        ...newConnection,
        password: '***'
      });

      const result = await databaseService.testConnection({
        type: newConnection.type,
        host: newConnection.host,
        port: newConnection.port,
        database: newConnection.database,
        username: newConnection.username,
        password: newConnection.password,
        ssl: newConnection.ssl
      });

      if (result?.success) {
        addLog(`Successfully connected to ${newConnection.name || 'database'}`, 'success');
      } else {
        addLog(`Connection failed: ${result?.message}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      addLog(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
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

  const toggleConnection = async (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
      // Load databases if not already loaded
      if (!databaseInfo[connectionId]) {
        await loadDatabases(connectionId);
      }
    }
    setExpandedConnections(newExpanded);
  };

  const toggleDatabase = async (connectionId: string, databaseName: string) => {
    const newExpanded = new Set(expandedDatabases);
    const key = `${connectionId}-${databaseName}`;
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // Load tables if not already loaded
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        await loadTables(connection, databaseName);
      }
    }
    setExpandedDatabases(newExpanded);
  };

  const loadDatabases = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setLoadingDatabases(prev => new Set([...prev, connectionId]));
    try {
      if (connection.type === 'mysql' && connection.database.toLowerCase() === 'mysql') {
        // If database is 'mysql', fetch all databases
        const databases = await databaseService.getDatabases(connection);
        setDatabaseInfo(prev => ({
          ...prev,
          [connectionId]: databases.map(db => ({ name: db, tables: [], views: [], viewType: 'tables' }))
        }));
      } else {
        // Otherwise, just show the connected database
        setDatabaseInfo(prev => ({
          ...prev,
          [connectionId]: [{
            name: connection.database,
            tables: [],
            views: [],
            viewType: 'tables'
          }]
        }));
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
      addLog(`Failed to load databases: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoadingDatabases(prev => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  const loadTables = async (connection: DatabaseConnection, databaseName: string) => {
    const connectionId = connection.id;
    const key = `${connectionId}-${databaseName}`;
    
    try {
      addLog(`Loading tables for database "${databaseName}"...`, 'info', connection.name);
      const tables = await databaseService.getTableNames({
        ...connection,
        database: databaseName
      });
      
      setDatabaseInfo(prev => ({
        ...prev,
        [connectionId]: prev[connectionId].map(db => 
          db.name === databaseName 
            ? { ...db, tables }
            : db
        )
      }));
      addLog(`Successfully loaded ${tables.length} tables from "${databaseName}"`, 'success', connection.name);
    } catch (error) {
      console.error('Failed to load tables:', error);
      addLog(`Failed to load tables: ${error instanceof Error ? error.message : String(error)}`, 'error', connection.name);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* Header - Fixed height */}
      <div className="flex-none flex justify-between items-center px-6 py-1.5 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Database Connections</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Connection
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-h-0 bg-gray-50">
        <div className="h-full overflow-y-auto p-3">
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
                const isExpanded = expandedConnections.has(connection.id);
                const databases = databaseInfo[connection.id] || [];
                const isLoading = loadingDatabases.has(connection.id);

                return (
                  <div
                    key={connection.id}
                    className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-sm transition-shadow"
                  >
                    {/* Connection Header */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleConnection(connection.id)}
                        className="flex-1 flex items-center space-x-3 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                        />
                        <Database className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{connection.name}</h3>
                          <p className="text-sm text-gray-500">
                            {connection.type} • {connection.host}:{connection.port}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`h-3 w-3 rounded-full ${statusStyles[status?.status || 'untested']}`} />
                          {status?.status === 'success' && (
                            <span className="text-sm text-green-600 font-medium">Connected</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center space-x-1">
                        {status?.status !== 'success' && (
                          <button
                            onClick={async () => {
                              try {
                                setTestingConnection(connection.id);
                                const result = await databaseService.testConnection({
                                  type: connection.type,
                                  host: connection.host,
                                  port: connection.port,
                                  database: connection.database,
                                  username: connection.username,
                                  password: connection.password,
                                  ssl: connection.ssl
                                });

                                if (result?.success) {
                                  addLog(`Successfully connected to ${connection.name}`, 'success');
                                  setConnectionStatuses(prev => 
                                    prev.map(s => s.id === connection.id ? { ...s, status: 'success' as const } : s)
                                  );
                                } else {
                                  addLog(`Connection failed: ${result?.message}`, 'error');
                                  setConnectionStatuses(prev => 
                                    prev.map(s => s.id === connection.id ? { ...s, status: 'failed' as const } : s)
                                  );
                                }
                              } catch (error) {
                                console.error('Test connection error:', error);
                                addLog(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
                                setConnectionStatuses(prev => 
                                  prev.map(s => s.id === connection.id ? { ...s, status: 'failed' as const } : s)
                                );
                              } finally {
                                setTestingConnection(null);
                              }
                            }}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                              testingConnection === connection.id
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            disabled={testingConnection === connection.id}
                          >
                            {testingConnection === connection.id ? 'Testing...' : 'Retry Connection'}
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(connection)}
                          className="p-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Databases List */}
                    {isExpanded && (
                      <div className="mt-2 ml-6 space-y-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">Databases</div>
                          <button
                            onClick={async () => {
                              try {
                                if (connection.type === 'mysql' && connection.database.toLowerCase() === 'mysql') {
                                  addLog(`Refreshing all databases...`, 'info', connection.name);
                                  setLoadingDatabases(prev => new Set([...prev, connection.id]));
                                  const databases = await databaseService.getDatabases(connection);
                                  setDatabaseInfo(prev => ({
                                    ...prev,
                                    [connection.id]: databases.map(db => ({ name: db, tables: [], views: [], viewType: 'tables' }))
                                  }));
                                  
                                  // Reload tables for all expanded databases
                                  const expandedDbs = Array.from(expandedDatabases)
                                    .filter(key => key.startsWith(`${connection.id}-`))
                                    .map(key => key.split('-')[1]);
                                  
                                  if (expandedDbs.length > 0) {
                                    addLog(`Refreshing tables for ${expandedDbs.length} expanded database(s)...`, 'info', connection.name);
                                    for (const dbName of expandedDbs) {
                                      const currentConn = connections.find(c => c.id === connection.id);
                                      if (currentConn) {
                                        await loadTables(currentConn, dbName);
                                      }
                                    }
                                  }
                                  addLog(`Successfully refreshed all databases`, 'success', connection.name);
                                } else {
                                  addLog(`Refreshing database "${connection.database}"...`, 'info', connection.name);
                                  setLoadingDatabases(prev => new Set([...prev, connection.id]));
                                  // Reload the connected database
                                  setDatabaseInfo(prev => ({
                                    ...prev,
                                    [connection.id]: [{
                                      name: connection.database,
                                      tables: [],
                                      views: [],
                                      viewType: 'tables'
                                    }]
                                  }));
                                  
                                  // Reload tables if database is expanded
                                  const dbKey = `${connection.id}-${connection.database}`;
                                  if (expandedDatabases.has(dbKey)) {
                                    addLog(`Refreshing tables for "${connection.database}"...`, 'info', connection.name);
                                    await loadTables(connection, connection.database);
                                  }
                                  addLog(`Successfully refreshed database "${connection.database}"`, 'success', connection.name);
                                }
                              } catch (error) {
                                console.error('Failed to refresh database:', error);
                                addLog(`Failed to refresh database: ${error instanceof Error ? error.message : String(error)}`, 'error', connection.name);
                              } finally {
                                setLoadingDatabases(prev => {
                                  const next = new Set(prev);
                                  next.delete(connection.id);
                                  return next;
                                });
                              }
                            }}
                            className="flex items-center space-x-1 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                            title="Refresh database"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                          </button>
                        </div>
                        {isLoading ? (
                          <div className="text-sm text-gray-500 py-2">Loading databases...</div>
                        ) : databases.length === 0 ? (
                          <div className="text-sm text-gray-500 py-2">No databases found on this connection</div>
                        ) : (
                          databases.map(db => {
                            const dbKey = `${connection.id}-${db.name}`;
                            const isDbExpanded = expandedDatabases.has(dbKey);
                            
                            return (
                              <div key={db.name} className="border-l border-gray-200 pl-3">
                                <button
                                  onClick={() => toggleDatabase(connection.id, db.name)}
                                  className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer"
                                >
                                  <ChevronRight
                                    className={`w-3 h-3 transition-transform ${isDbExpanded ? 'transform rotate-90' : ''}`}
                                  />
                                  <Database className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">{db.name}</span>
                                </button>

                                {/* Tables List */}
                                {isDbExpanded && (
                                  <div className="ml-4 mt-1 space-y-1">
                                    <div className="border-l border-gray-200 pl-3">
                                      <button
                                        onClick={() => {
                                          const key = `${connection.id}-${db.name}-tables`;
                                          const newExpanded = new Set(expandedDatabases);
                                          if (newExpanded.has(key)) {
                                            newExpanded.delete(key);
                                          } else {
                                            newExpanded.add(key);
                                            // Load tables if not already loaded
                                            const currentConn = connections.find(c => c.id === connection.id);
                                            if (currentConn && db.tables.length === 0) {
                                              loadTables(currentConn, db.name);
                                            }
                                          }
                                          setExpandedDatabases(newExpanded);
                                        }}
                                        className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer"
                                      >
                                        <ChevronRight
                                          className={`w-3 h-3 transition-transform ${expandedDatabases.has(`${connection.id}-${db.name}-tables`) ? 'transform rotate-90' : ''}`}
                                        />
                                        <Table className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Tables</span>
                                      </button>

                                      {expandedDatabases.has(`${connection.id}-${db.name}-tables`) && (
                                        <div className="ml-4 mt-1 space-y-1">
                                          {db.tables.length === 0 ? (
                                            <div className="text-sm text-gray-500 py-1">No tables found in this database</div>
                                          ) : (
                                            db.tables.map(table => (
                                              <div
                                                key={table}
                                                className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded-md cursor-pointer"
                                              >
                                                <Table className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">{table}</span>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear logs
            </button>
            <button
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
              className="p-1 hover:bg-gray-800 rounded transition-colors cursor-pointer"
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
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Connection Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                  <span className="text-xs text-gray-500 ml-1">
                    (A friendly name to identify this connection)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production MySQL, Local PostgreSQL"
                />
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Type
                  <span className="text-xs text-gray-500 ml-1">
                    (The type of database you're connecting to)
                  </span>
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
                    (The server address where your database is running)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.host}
                  onChange={(e) => {
                    console.log('Setting host:', e.target.value);
                    setNewConnection({ ...newConnection, host: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={DATABASE_TYPES[newConnection.type].hostPlaceholder}
                />
                <p className="mt-1 text-xs text-gray-500">
                  For local databases, use "localhost" or "127.0.0.1". For remote servers, use the IP address or domain name.
                </p>
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                  <span className="text-xs text-gray-500 ml-1">
                    (The port number your database is listening on)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ 
                    ...newConnection, 
                    port: parseInt(e.target.value) || DATABASE_TYPES[newConnection.type].defaultPort 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={String(DATABASE_TYPES[newConnection.type].defaultPort)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Common default ports: MySQL (3306), PostgreSQL (5432), SQL Server (1433), MongoDB (27017), Oracle (1521)
                </p>
              </div>

              {/* Database Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                  <span className="text-xs text-gray-500 ml-1">
                    (The name of the database you want to connect to)
                  </span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newConnection.showAllDatabases ? 'mysql' : newConnection.database}
                    onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      newConnection.showAllDatabases ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder={DATABASE_TYPES[newConnection.type].databasePlaceholder}
                    disabled={newConnection.showAllDatabases}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showAllDatabases"
                      checked={newConnection.showAllDatabases}
                      onChange={(e) => {
                        setNewConnection({
                          ...newConnection,
                          showAllDatabases: e.target.checked,
                          database: e.target.checked ? 'mysql' : newConnection.database
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showAllDatabases" className="text-sm text-gray-700">
                      Show all databases
                    </label>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {newConnection.showAllDatabases 
                    ? "When checked, you'll see all databases you have access to."
                    : "This is the specific database you want to access. For some database types, this might be called a 'schema' or 'service name'."}
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                  <span className="text-xs text-gray-500 ml-1">
                    (The database user account)
                  </span>
                </label>
                <input
                  type="text"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., admin, root, postgres"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The username must have appropriate permissions to access the database.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                  <span className="text-xs text-gray-500 ml-1">
                    (The password for the database user)
                  </span>
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
                <p className="mt-1 text-xs text-gray-500">
                  Your password is stored securely and encrypted.
                </p>
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
                    (Encrypts the connection for security)
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Recommended for production environments and when connecting to remote databases.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                disabled={savingConnection}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnection}
                className={`px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 cursor-pointer ${
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