import React, { useState, useEffect, useRef } from 'react';
import { Database, Plus, Edit2, Trash2, X, Eye, EyeOff, ChevronDown, AlertCircle, ChevronUp, ChevronRight, Table, Copy, History, Settings, RefreshCw } from 'lucide-react';
import secureStorage from '../services/secureStorage';
import databaseService from '../services/databaseService';
import { DatabaseConnectionService } from '../services/DatabaseConnectionService';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseConnection as BackendDatabaseConnection, DatabaseConnectionResponse } from '../models/DatabaseConnection';
import { EncryptionService } from '../services/EncryptionService';

export interface DatabaseConnectionInput {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface FrontendDatabaseConnection extends DatabaseConnectionInput {
  id: string;
  name: string;
  status?: 'success' | 'error' | 'testing' | 'untested';
}

export interface DatabaseConnectionFormState extends DatabaseConnectionInput {
  name: string;
  showAllDatabases: boolean;
}

interface DatabaseConnectionsProps {
  onConnect?: (connection: FrontendDatabaseConnection) => void;
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

type DatabaseType = 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle';

interface DatabaseTypeInfo {
  name: string;
  defaultPort: number;
  hostPlaceholder: string;
  databasePlaceholder: string;
  icon: string;
}

const DATABASE_TYPES: Record<DatabaseType, DatabaseTypeInfo> = {
  mysql: {
    name: 'MySQL',
    defaultPort: 3306,
    hostPlaceholder: 'localhost',
    databasePlaceholder: 'database_name',
    icon: '🐬'
  },
  postgresql: {
    name: 'PostgreSQL',
    defaultPort: 5432,
    hostPlaceholder: 'localhost',
    databasePlaceholder: 'database_name',
    icon: '🐘'
  },
  mongodb: {
    name: 'MongoDB',
    defaultPort: 27017,
    hostPlaceholder: 'localhost',
    databasePlaceholder: 'database_name',
    icon: '🍃'
  },
  sqlserver: {
    name: 'SQL Server',
    defaultPort: 1433,
    hostPlaceholder: 'localhost',
    databasePlaceholder: 'database_name',
    icon: '💾'
  },
  oracle: {
    name: 'Oracle',
    defaultPort: 1521,
    hostPlaceholder: 'localhost',
    databasePlaceholder: 'service_name',
    icon: '🔷'
  }
};

// Update the CSS animation at the top of the file
const styles = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.2; }
    100% { opacity: 1; }
  }
`;

const DatabaseConnections: React.FC<DatabaseConnectionsProps> = ({ onConnect = () => {} }) => {
  const { user, databaseUserId } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [connections, setConnections] = useState<FrontendDatabaseConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingConnection, setEditingConnection] = useState<FrontendDatabaseConnection | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [savingConnection, setSavingConnection] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [databaseInfo, setDatabaseInfo] = useState<Record<string, DatabaseInfo[]>>({});
  const [loadingDatabases, setLoadingDatabases] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDatabaseTypeDropdown, setShowDatabaseTypeDropdown] = useState(false);
  const sqlPreviewRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConnection, setDeletingConnection] = useState<FrontendDatabaseConnection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add useEffect to fetch connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      if (!databaseUserId) return;
      
      setIsLoading(true);
      try {
        const userConnections = await DatabaseConnectionService.getConnections(databaseUserId);
        console.log('Fetched connections:', userConnections);
        
        const transformedConnections = userConnections.map((conn: DatabaseConnectionResponse) => {
          const transformed = {
            id: conn.dbInfoId?.toString() || '',
            name: conn.connectionName || '',
            type: (conn.type?.toLowerCase() || 'mysql') as DatabaseType,
            host: conn.host || '',
            port: conn.port || 0,
            database: conn.database || '',
            username: conn.username || '',
            password: conn.password || '',
            ssl: conn.ssl === true,
            status: 'untested' as const
          };
          console.log('Transformed connection:', transformed);
          return transformed;
        });
        
        setConnections(transformedConnections);
      } catch (error) {
        console.error('Failed to fetch connections:', error);
        addLog('Failed to fetch database connections', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, [databaseUserId]);

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

  const databaseTypes: { value: DatabaseType; label: string }[] = [
    { value: 'mysql', label: 'MySQL' },
    { value: 'sqlserver', label: 'SQL Server' },
    { value: 'oracle', label: 'Oracle' }
  ];

  // Add this useEffect to handle dark mode
  useEffect(() => {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
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
  const handleEditClick = (connection: FrontendDatabaseConnection) => {
    console.log('Original connection data:', connection);
    
    const formData = {
      ...connection,
      showAllDatabases: connection.database.toLowerCase() === 'mysql'
    };

    console.log('Form data being set:', formData);

    setEditingConnection(connection);
    setNewConnection(formData);
    setShowModal(true);
  };

  const handleSaveConnection = async () => {
    if (!newConnection.name || !newConnection.host || !newConnection.database) {
      return;
    }

    setIsSaving(true);
    try {
      const connectionData: BackendDatabaseConnection = {
        connectionName: newConnection.name.trim(),
        databaseType: newConnection.type,
        hostName: newConnection.host,
        portId: newConnection.port,
        serviceName: newConnection.database,
        username: newConnection.username,
        password: newConnection.password,
        sslRequired: newConnection.ssl,
        optionsJson: undefined
      };

      if (editingConnection) {
        // Update existing connection
        const updatedConnection = await DatabaseConnectionService.updateConnection(
          parseInt(editingConnection.id),
          connectionData
        );
        
        setConnections(connections.map(conn => 
          conn.id === editingConnection.id ? { 
            ...conn, 
            ...newConnection,
            database: newConnection.database,
            status: 'untested' as const
          } : conn
        ));
        addLog(`Connection "${newConnection.name}" updated successfully`, 'success');
      } else {
        // Add new connection
        const savedConnection = await DatabaseConnectionService.saveConnection(connectionData);
        
        const newConn: FrontendDatabaseConnection = {
          ...newConnection,
          id: savedConnection.dbInfoId.toString(),
          name: newConnection.name,
          database: newConnection.database,
          status: 'untested' as const
        };
        
        setConnections([...connections, newConn]);
        addLog(`Connection "${newConnection.name}" added successfully`, 'success');
      }

      handleCloseModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      addLog(`Failed to save connection: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChange = (type: FrontendDatabaseConnection['type']) => {
    setNewConnection({
      ...newConnection,
      type,
      port: DATABASE_TYPES[type].defaultPort
    });
  };

  const handleDeleteClick = (connection: FrontendDatabaseConnection) => {
    setDeletingConnection(connection);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConnection) return;

    setIsDeleting(true);
    try {
      await DatabaseConnectionService.deleteConnection(parseInt(deletingConnection.id));
      setConnections(connections.filter(conn => conn.id !== deletingConnection.id));
      addLog(`Connection "${deletingConnection.name}" deleted successfully`, 'success');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting connection:', error);
      addLog(`Failed to delete connection "${deletingConnection.name}"`, 'error');
    } finally {
      setIsDeleting(false);
      setDeletingConnection(null);
    }
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

  const loadTables = async (connection: FrontendDatabaseConnection, databaseName: string) => {
    const connectionId = connection.id;
    
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

  // Add notification component
  const Notification = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-none ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {message}
    </div>
  );

  // Add scroll function
  const scrollToSqlPreview = () => {
    sqlPreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add test connection function
  const handleTestConnection = async (connection: FrontendDatabaseConnection) => {
    try {
      setTestingConnectionId(connection.id);
      addLog(`Testing connection to ${connection.name}...`, 'info', connection.name);
      
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
        addLog(`Successfully connected to ${connection.name}`, 'success', connection.name);
        setConnections(prev => prev.map(c => 
          c.id === connection.id ? { ...c, status: 'success' } : c
        ));
      } else {
        const errorMessage = result?.message || 'Connection failed without specific error message';
        addLog(`Connection failed: ${errorMessage}`, 'error', connection.name);
        setConnections(prev => prev.map(c => 
          c.id === connection.id ? { ...c, status: 'error' } : c
        ));
      }
    } catch (error) {
      console.error('Test connection error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Connection error: ${errorMessage}`, 'error', connection.name);
      setConnections(prev => prev.map(c => 
        c.id === connection.id ? { ...c, status: 'error' } : c
      ));
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleEditConnection = (connection: FrontendDatabaseConnection) => {
    setEditingConnection(connection);
    setNewConnection({
      ...connection,
      showAllDatabases: connection.database.toLowerCase() === 'mysql'
    });
    setShowModal(true);
  };

  // Add this type guard function before getDatabaseTypeInfo
  const isDatabaseType = (type: string): type is DatabaseType => {
    const validTypes: DatabaseType[] = ['mysql', 'postgresql', 'mongodb', 'sqlserver', 'oracle'];
    return validTypes.includes(type.toLowerCase() as DatabaseType);
  };

  // Update the getDatabaseTypeInfo function
  const getDatabaseTypeInfo = (type: string): DatabaseTypeInfo => {
    const normalizedType = type.toLowerCase() as DatabaseType;
    return isDatabaseType(normalizedType) ? DATABASE_TYPES[normalizedType] : DATABASE_TYPES.mysql;
  };

  // Add this function before the return statement
  const handleRefreshConnections = async () => {
    try {
      if (!databaseUserId) {
        addLog('No database user ID available', 'error');
        return;
      }

      addLog('Refreshing database connections...', 'info');
      const userConnections = await DatabaseConnectionService.getConnections(databaseUserId);
      
      const transformedConnections = userConnections.map((conn: DatabaseConnectionResponse) => ({
        id: conn.dbInfoId?.toString() || '',
        name: conn.connectionName || '',
        type: (conn.type?.toLowerCase() || 'mysql') as DatabaseType,
        host: conn.host || '',
        port: conn.port || 0,
        database: conn.database || '',
        username: conn.username || '',
        password: conn.password || '',
        ssl: conn.ssl === true,
        status: 'untested' as const
      }));
      
      setConnections(transformedConnections);
      addLog('Database connections refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh connections:', error);
      addLog('Failed to refresh database connections', 'error');
    }
  };

  // Update the uniqueConnections calculation
  const uniqueConnections = Array.from(new Set(connections.map(c => c.id)));

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      <style>{styles}</style>
      {/* Header - Fixed height */}
      <div className="flex-none flex justify-between items-center px-6 py-1.5 border-b border-gray-700 bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-200">Database Connections</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshConnections}
            className="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm rounded-none hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3 py-1.5 bg-cyan-500 text-white text-sm rounded-none hover:bg-cyan-600 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-h-0 bg-gray-950">
        <div className="h-full overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-gray-400 text-lg">Loading databases...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-6">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No database connections yet</p>
              <p className="text-sm text-gray-500">Click "Add Connection" to get started</p>
            </div>
          ) : (
            connections.map(connection => {
              const dbTypeInfo = getDatabaseTypeInfo(connection.type);
              
              return (
                <div
                  key={`connection-${connection.id}`}
                  className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          connection.status === 'success' 
                            ? 'bg-green-500' 
                            : connection.status === 'error'
                            ? 'bg-red-500'
                            : connection.status === 'testing'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ animation: 'blink 2s ease-in-out infinite' }}
                      />
                      <span className={`text-sm ${
                        connection.status === 'success' 
                          ? 'text-green-500' 
                          : connection.status === 'error'
                          ? 'text-red-500'
                          : connection.status === 'testing'
                          ? 'text-yellow-500'
                          : 'text-gray-400'
                      }`}>
                        {connection.status === 'success' 
                          ? 'Connected' 
                          : connection.status === 'error'
                          ? 'Failed'
                          : connection.status === 'testing'
                          ? 'Connecting...'
                          : 'Not Connected'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Database size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {connection.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {dbTypeInfo.name} • {connection.host}:{connection.port}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConnection(connection)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                              isDarkMode 
                                ? 'bg-cyan-900/50 text-cyan-400 hover:bg-cyan-900/70' 
                                : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                            }`}
                          >
                            Test Connection
                          </button>
                          <button
                            onClick={() => handleEditConnection(connection)}
                            className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(connection)}
                            className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {editingConnection ? 'Edit Connection' : 'New Connection'}
            </h2>

            <div className="space-y-4">
              {/* Connection Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500"
                  placeholder="e.g., Production MySQL"
                />
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Database Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatabaseTypeDropdown(!showDatabaseTypeDropdown)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{DATABASE_TYPES[newConnection.type].icon}</span>
                      <span>{DATABASE_TYPES[newConnection.type].name}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showDatabaseTypeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-none shadow-lg">
                      {databaseTypes.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            handleTypeChange(value as FrontendDatabaseConnection['type']);
                            setShowDatabaseTypeDropdown(false);
                          }}
                          className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-gray-700 text-gray-200"
                        >
                          <span className="text-xl">{DATABASE_TYPES[value].icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500"
                  placeholder={DATABASE_TYPES[newConnection.type].hostPlaceholder}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use "localhost" for local databases
                </p>
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ 
                    ...newConnection, 
                    port: parseInt(e.target.value) || DATABASE_TYPES[newConnection.type].defaultPort 
                  })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500"
                  placeholder={String(DATABASE_TYPES[newConnection.type].defaultPort)}
                />
              </div>

              {/* Database Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Database Name
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newConnection.database}
                    onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                    className={`flex-1 px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500`}
                    placeholder={DATABASE_TYPES[newConnection.type].databasePlaceholder}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500"
                  placeholder="Enter username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newConnection.password}
                    onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-800 text-gray-200 placeholder-gray-500"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SSL */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={newConnection.ssl}
                  onChange={(e) => setNewConnection({ ...newConnection, ssl: e.target.checked })}
                  className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-700 rounded-none bg-gray-800"
                />
                <label htmlFor="ssl" className="text-sm text-gray-300">
                  Use SSL
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnection}
                disabled={!newConnection.name || !newConnection.host || !newConnection.database || isSaving}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Connection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Delete Connection
            </h2>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the connection "{deletingConnection.name}"? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingConnection(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Connection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-none ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnections; 