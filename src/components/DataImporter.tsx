import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileWarning, Trash2, GripVertical, X, Edit2, ArrowUpDown, ChevronLeft, ChevronRight, Globe2, FileUp, ChevronDown, History, ChevronUp, Database, Code, Server, Table, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import FileImport from './FileImport';
import Papa from 'papaparse';

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface RawFileData {
  rows: string[][];
}

interface JsonPath {
  path: string[];
  type: 'array' | 'object';
}

type DataSource = 'file' | 'api';

interface DataImporterProps {
  onFileSelect: (fileName: string) => void;
  onDataChange: (data: {
    parsedData: ParsedData | null;
    rawData: RawFileData | null;
    originalJsonData: any;
    availablePaths: JsonPath[];
    selectedPath: JsonPath | null;
  }) => void;
  initialData?: {
    parsedData: ParsedData | null;
    rawData: RawFileData | null;
    originalJsonData: any;
    availablePaths: JsonPath[];
    selectedPath: JsonPath | null;
  };
  initialFile?: File;
}

interface AuditLogEntry {
  timestamp: Date;
  action: string;
  details: string;
}

interface AuditLogWindowProps {
  logs: AuditLogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogWindow: React.FC<AuditLogWindowProps> = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-3/4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{log.action}</span>
                    <span className="text-sm text-gray-500">
                      {log.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExpanderProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  fileName?: string;
  showFileInfo?: boolean;
}

const Expander: React.FC<ExpanderProps> = ({ title, defaultExpanded = true, children, fileName, showFileInfo }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg border-b border-gray-200"
      >
        <div className="flex items-center gap-6">
          <span className="font-medium text-gray-900">{title}</span>
          {showFileInfo && fileName && (
            <div className="flex items-center text-sm text-gray-600">
              <FileUp className="w-4 h-4 mr-1" />
              <span>{fileName}</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

interface DataOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const dataOperations: DataOperation[] = [
  {
    id: 'api',
    name: 'Send to API',
    description: 'Send the data to a specified API endpoint',
    icon: <Server className="w-5 h-5" />
  },
  {
    id: 'database',
    name: 'Database Operations',
    description: 'Create or update database tables and insert data',
    icon: <Database className="w-5 h-5" />
  },
  {
    id: 'code',
    name: 'Generate Code',
    description: 'Generate class structures and database models',
    icon: <Code className="w-5 h-5" />
  },
  {
    id: 'schema',
    name: 'Table Schema',
    description: 'View and export table schema definitions',
    icon: <Table className="w-5 h-5" />
  }
];

interface DatabaseInfo {
  id: string;
  name: string;
  type: 'sqlserver' | 'mysql' | 'postgresql' | 'oracle';
  tables: TableInfo[];
}

interface TableInfo {
  id: string;
  name: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
}

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'sqlserver' | 'mysql' | 'postgresql' | 'oracle';
  connectionString: string;
}

interface EditableColumn {
  name: string;
  type: string;
  nullable: boolean;
  originalName: string;
  length?: number;
  precision?: number;
  scale?: number;
  validationError?: string;
  isNullable: boolean;
}

interface DataTypeOption {
  name: string;
  hasLength: boolean;
  hasPrecision: boolean;
  hasScale: boolean;
  defaultLength?: number;
  defaultPrecision?: number;
  defaultScale?: number;
}

const dataTypeOptions: Record<string, Record<string, DataTypeOption>> = {
  sqlserver: {
    'varchar': { name: 'varchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 255 },
    'nvarchar': { name: 'nvarchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 255 },
    'char': { name: 'char', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 50 },
    'nchar': { name: 'nchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 50 },
    'decimal': { name: 'decimal', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
    'numeric': { name: 'numeric', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
    'int': { name: 'int', hasLength: false, hasPrecision: false, hasScale: false },
    'bigint': { name: 'bigint', hasLength: false, hasPrecision: false, hasScale: false },
    'datetime': { name: 'datetime', hasLength: false, hasPrecision: false, hasScale: false },
    'datetime2': { name: 'datetime2', hasLength: false, hasPrecision: false, hasScale: false },
    'date': { name: 'date', hasLength: false, hasPrecision: false, hasScale: false },
    'time': { name: 'time', hasLength: false, hasPrecision: false, hasScale: false },
    'bit': { name: 'bit', hasLength: false, hasPrecision: false, hasScale: false },
    'money': { name: 'money', hasLength: false, hasPrecision: false, hasScale: false },
    'smallmoney': { name: 'smallmoney', hasLength: false, hasPrecision: false, hasScale: false }
  },
  postgresql: {
    'varchar': { name: 'varchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 255 },
    'char': { name: 'char', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 50 },
    'text': { name: 'text', hasLength: false, hasPrecision: false, hasScale: false },
    'integer': { name: 'integer', hasLength: false, hasPrecision: false, hasScale: false },
    'bigint': { name: 'bigint', hasLength: false, hasPrecision: false, hasScale: false },
    'numeric': { name: 'numeric', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
    'decimal': { name: 'decimal', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
    'timestamp': { name: 'timestamp', hasLength: false, hasPrecision: false, hasScale: false },
    'date': { name: 'date', hasLength: false, hasPrecision: false, hasScale: false },
    'time': { name: 'time', hasLength: false, hasPrecision: false, hasScale: false },
    'boolean': { name: 'boolean', hasLength: false, hasPrecision: false, hasScale: false },
    'money': { name: 'money', hasLength: false, hasPrecision: false, hasScale: false }
  }
  // Add other database types as needed
};

const inferColumnType = (values: string[]): { type: string; length?: number; precision?: number; scale?: number } => {
  // Remove empty values
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
  if (nonEmptyValues.length === 0) return { type: 'varchar', length: 255 };

  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)));
  if (allNumbers) {
    const numbers = nonEmptyValues.map(v => Number(v));
    const hasDecimals = numbers.some(n => n % 1 !== 0);
    if (hasDecimals) {
      const maxPrecision = Math.max(...numbers.map(n => n.toString().replace('.', '').length));
      return { type: 'decimal', precision: maxPrecision, scale: 2 };
    }
    // Only use int if the numbers are within a reasonable range
    const maxNumber = Math.max(...numbers);
    const minNumber = Math.min(...numbers);
    if (maxNumber <= 2147483647 && minNumber >= -2147483648) {
      return { type: 'int' };
    }
    return { type: 'bigint' };
  }

  // Check if all values are dates
  const allDates = nonEmptyValues.every(v => {
    const date = new Date(v);
    return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
  });
  if (allDates) {
    const hasTime = nonEmptyValues.some(v => v.includes(':'));
    return { type: hasTime ? 'datetime' : 'date' };
  }

  // Default to varchar with appropriate length
  const maxLength = Math.max(...nonEmptyValues.map(v => v.length));
  return { type: 'varchar', length: Math.min(Math.max(maxLength, 50), 4000) };
};

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (databaseId: string, tableId: string) => void;
  onGenerateSql: (databaseType: string, tableName: string, columns: ColumnInfo[]) => void;
  parsedData: ParsedData | null;
}

const mockDatabases: DatabaseInfo[] = [
  {
    id: '1',
    name: 'Production DB',
    type: 'sqlserver',
    tables: [
      {
        id: '1',
        name: 'Customers',
        columns: [
          { name: 'CustomerId', type: 'int', isNullable: false },
          { name: 'Name', type: 'varchar(100)', isNullable: false },
          { name: 'Email', type: 'varchar(100)', isNullable: true }
        ]
      },
      {
        id: '2',
        name: 'Orders',
        columns: [
          { name: 'OrderId', type: 'int', isNullable: false },
          { name: 'CustomerId', type: 'int', isNullable: false },
          { name: 'OrderDate', type: 'datetime', isNullable: false }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Development DB',
    type: 'postgresql',
    tables: [
      {
        id: '3',
        name: 'Users',
        columns: [
          { name: 'UserId', type: 'serial', isNullable: false },
          { name: 'Username', type: 'varchar(50)', isNullable: false },
          { name: 'CreatedAt', type: 'timestamp', isNullable: false }
        ]
      }
    ]
  }
];

const mockConnections: DatabaseConnection[] = [
  {
    id: '1',
    name: 'Production SQL Server',
    type: 'sqlserver',
    connectionString: 'Server=prod-server;Database=prod-db;...'
  },
  {
    id: '2',
    name: 'Development PostgreSQL',
    type: 'postgresql',
    connectionString: 'Host=dev-server;Database=dev-db;...'
  }
];

const commonDataTypes = {
  sqlserver: [
    'int', 'bigint', 'decimal', 'numeric', 'money', 'smallmoney',
    'varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext',
    'datetime', 'datetime2', 'date', 'time',
    'bit', 'binary', 'varbinary', 'image'
  ],
  postgresql: [
    'integer', 'bigint', 'numeric', 'decimal', 'money',
    'varchar', 'char', 'text',
    'timestamp', 'date', 'time',
    'boolean', 'bytea'
  ],
  mysql: [
    'int', 'bigint', 'decimal', 'numeric',
    'varchar', 'char', 'text',
    'datetime', 'date', 'time',
    'boolean', 'blob'
  ],
  oracle: [
    'number', 'float', 'decimal',
    'varchar2', 'char', 'clob',
    'date', 'timestamp',
    'raw', 'blob'
  ]
};

const DatabaseModal: React.FC<DatabaseModalProps> = ({ 
  isOpen, 
  onClose, 
  onInsert, 
  onGenerateSql,
  parsedData 
}) => {
  // State declarations
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [operationType, setOperationType] = useState<'select' | 'create'>('select');
  const [newTableName, setNewTableName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([]);
  const [editableColumns, setEditableColumns] = useState<EditableColumn[]>([]);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [showCaseMenu, setShowCaseMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHeader, setEditingHeader] = useState<{ index: number; value: string } | null>(null);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [sortState, setSortState] = useState<{ column: number | null; direction: 'asc' | 'desc' | null }>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastGeneratedSql, setLastGeneratedSql] = useState<string>('');
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);
  const caseMenuRef = useRef<HTMLDivElement>(null);
  const sqlPreviewRef = useRef<HTMLDivElement>(null);

  // Initialize editable columns with type inference
  useEffect(() => {
    if (parsedData && operationType !== 'select') {
      const columns: EditableColumn[] = parsedData.headers.map((header, index) => {
        const values = parsedData.rows.map(row => row[index]);
        const inferredType = inferColumnType(values);
        return {
          name: header,
          type: inferredType.type,
          nullable: true,
          isNullable: true,
          originalName: header,
          length: inferredType.length,
          precision: inferredType.precision,
          scale: inferredType.scale
        };
      });
      setEditableColumns(columns);
    }
  }, [parsedData, operationType]);

  // Handle click outside case menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (caseMenuRef.current && !caseMenuRef.current.contains(event.target as Node)) {
        setShowCaseMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset SQL preview when table name changes
  useEffect(() => {
    if (operationType === 'create') {
      setShowSqlPreview(false);
      setGeneratedSql('');
      setHasUnsavedChanges(true);
    }
  }, [newTableName, operationType]);

  // Reset SQL preview when database connection changes
  useEffect(() => {
    setShowSqlPreview(false);
    setGeneratedSql('');
    setHasUnsavedChanges(true);
  }, [selectedConnection]);

  // Reset SQL preview when operation type changes
  useEffect(() => {
    setShowSqlPreview(false);
    setGeneratedSql('');
    setHasUnsavedChanges(true);
  }, [operationType]);

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setSelectedTable('');
    setNewTableName('');
    setAvailableTables(mockDatabases.find(db => db.id === connectionId)?.tables || []);
  };

  // Get available data types for the selected database
  const getAvailableDataTypes = (): string[] => {
    if (!selectedConnectionInfo) return [];
    const dbType = selectedConnectionInfo.type;
    return Object.keys(dataTypeOptions[dbType] || {});
  };

  const saveHeaderEdit = () => {
    if (!editingHeader) return;
    
    setEditableColumns((prev: EditableColumn[]) => prev.map((col, index) => 
      index === editingHeader.index 
        ? { 
            ...col, 
            name: editingHeader.value, 
            originalName: editingHeader.value,
            validationError: validateColumn({ ...col, name: editingHeader.value })
          }
        : col
    ));
    
    setEditingHeader(null);
    setHasUnsavedChanges(true);
  };

  const handleColumnChange = (index: number, field: keyof EditableColumn, value: string | boolean | number) => {
    setEditableColumns(prev => {
      const newColumns = prev.map((col, i) => {
        if (i !== index) return col;
        
        const updatedColumn = { ...col, [field]: value };
        
        if (field === 'type') {
          const typeOption = dataTypeOptions[selectedConnectionInfo?.type || 'sqlserver'][value as string];
          if (typeOption) {
            updatedColumn.length = typeOption.defaultLength;
            updatedColumn.precision = typeOption.defaultPrecision;
            updatedColumn.scale = typeOption.defaultScale;
          }
        }
        
        updatedColumn.validationError = validateColumn(updatedColumn);
        return updatedColumn;
      });
      return newColumns;
    });
    setShowSqlPreview(false);
    setGeneratedSql('');
    setHasUnsavedChanges(true);
  };

  const handleOperation = async () => {
    if (!selectedConnection) return;
    
    setIsLoading(true);
    try {
      const connection = mockConnections.find(c => c.id === selectedConnection);
      if (!connection) return;

      switch (operationType) {
        case 'select':
          if (!selectedTable) return;
          await onInsert(selectedConnection, selectedTable);
          onClose();
          break;
        case 'create':
          if (!newTableName) return;
          generateSql();
          break;
      }
    } catch (error) {
      console.error('Error performing operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformColumnNames = (format: 'camel' | 'pascal' | 'snake' | 'kebab' | 'screaming_snake' | 'title') => {
    setEditableColumns(prev => prev.map(col => {
      // Always use the original name for transformation
      const words = col.originalName
        .toLowerCase()
        .split(/[\s_-]+/)
        .filter(word => word.length > 0);

      if (words.length === 0) return col;

      let transformedName: string;
      switch (format) {
        case 'camel':
          transformedName = words.map((word, index) => 
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          break;
        case 'pascal':
          transformedName = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          break;
        case 'snake':
          transformedName = words.join('_');
          break;
        case 'kebab':
          transformedName = words.join('-');
          break;
        case 'screaming_snake':
          transformedName = words.map(word => word.toUpperCase()).join('_');
          break;
        case 'title':
          transformedName = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        default:
          transformedName = col.name;
      }

      return {
        ...col,
        name: transformedName,
        validationError: validateColumn({ ...col, name: transformedName })
      };
    }));
    setShowCaseMenu(false);
    setShowSqlPreview(false);
    setGeneratedSql('');
    setHasUnsavedChanges(true);
  };

  const caseOptions = [
    { id: 'camel', label: 'camelCase', example: 'firstName' },
    { id: 'pascal', label: 'PascalCase', example: 'FirstName' },
    { id: 'snake', label: 'snake_case', example: 'first_name' },
    { id: 'kebab', label: 'kebab-case', example: 'first-name' },
    { id: 'screaming_snake', label: 'SCREAMING_SNAKE', example: 'FIRST_NAME' },
    { id: 'title', label: 'Title Case', example: 'First Name' }
  ];

  if (!isOpen) return null;

  const selectedConnectionInfo = mockConnections.find(c => c.id === selectedConnection);
  const availableDataTypes = selectedConnectionInfo ? commonDataTypes[selectedConnectionInfo.type] : [];

  const validateColumn = (column: EditableColumn): string | undefined => {
    if (!column.name.trim()) {
      return 'Column name is required';
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
      return 'Column name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }
    if (column.name.length > 128) {
      return 'Column name must be 128 characters or less';
    }
    return undefined;
  };

  const handleDragStart = (index: number) => {
    setDraggedColumnIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === index) return;
    setEditableColumns((prev: EditableColumn[]) => {
      const newColumns = [...prev];
      const draggedColumn = newColumns[draggedColumnIndex as number];
      newColumns.splice(draggedColumnIndex as number, 1);
      newColumns.splice(index, 0, draggedColumn);
      return newColumns;
    });
    setDraggedColumnIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedColumnIndex(null);
    setShowSqlPreview(false);
    setGeneratedSql('');
    setHasUnsavedChanges(true);
  };

  const sortRowsByColumn = (columnIndex: number) => {
    if (!parsedData) return;

    let newDirection: 'asc' | 'desc' | null;
    let sortedRows: string[][];

    // Determine new sort direction
    if (sortState.column !== columnIndex) {
      newDirection = 'asc';
    } else {
      switch (sortState.direction) {
        case 'asc':
          newDirection = 'desc';
          break;
        case 'desc':
          newDirection = null;
          break;
        default:
          newDirection = 'asc';
      }
    }

    // Sort the rows based on the new direction
    if (newDirection === null) {
      sortedRows = [...parsedData.rows];
    } else {
      sortedRows = [...parsedData.rows].sort((a, b) => {
        const valueA = a[columnIndex]?.trim() ?? '';
        const valueB = b[columnIndex]?.trim() ?? '';

        if (!valueA && !valueB) return 0;
        if (!valueA) return 1;
        if (!valueB) return -1;

        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return newDirection === 'asc' ? numA - numB : numB - numA;
        }

        return newDirection === 'asc' 
          ? valueA.toLowerCase().localeCompare(valueB.toLowerCase())
          : valueB.toLowerCase().localeCompare(valueA.toLowerCase());
      });
    }

    setSortState({ column: columnIndex, direction: newDirection });
    // Remove setParsedData call here as it's not needed in DatabaseModal
  };

  const removeRow = (rowIndex: number) => {
    if (!parsedData) return;
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    
    setEditableColumns((prev: EditableColumn[]) => prev.filter((_: EditableColumn, index: number) => index !== actualIndex));
    setHasUnsavedChanges(true);
  };

  const handleDatabaseOperation = async (databaseId: string, tableId: string) => {
    // TODO: Implement actual database insertion
    console.log('Inserting data into database:', databaseId, 'table:', tableId);
  };

  const handleGenerateSql = (databaseType: string, tableName: string, columns: ColumnInfo[]) => {
    // TODO: Implement SQL generation
    console.log('Generating SQL for:', databaseType, 'table:', tableName, 'columns:', columns);
  };

  const generateSql = () => {
    if (!selectedConnectionInfo || !newTableName || !editableColumns.length) return;

    const dbType = selectedConnectionInfo.type;
    const columns = editableColumns.map(col => {
      const typeDef = dataTypeOptions[dbType][col.type];
      let typeString = col.type;
      
      if (typeDef.hasLength && col.length) {
        typeString += `(${col.length})`;
      } else if (typeDef.hasPrecision && col.precision) {
        if (typeDef.hasScale && col.scale) {
          typeString += `(${col.precision},${col.scale})`;
        } else {
          typeString += `(${col.precision})`;
        }
      }

      return `    [${col.name}] ${typeString} ${col.isNullable ? 'NULL' : 'NOT NULL'}`;
    });

    const sql = `CREATE TABLE [${newTableName}] (\n${columns.join(',\n')}\n);`;
    setGeneratedSql(sql);
    setLastGeneratedSql(sql);
    setShowSqlPreview(true);
    setShowSuccessNotification(true);
    setHasUnsavedChanges(false);

    // Add a small delay to ensure the SQL preview is rendered before scrolling
    setTimeout(() => {
      scrollToSqlPreview();
    }, 100);

    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleResetChanges = () => {
    setShowConfirmDialog(true);
  };

  const confirmReset = () => {
    setGeneratedSql(lastGeneratedSql);
    setShowSqlPreview(true);
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
  };

  const cancelReset = () => {
    setShowConfirmDialog(false);
  };

  // Add function to copy SQL to clipboard
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(generatedSql);
    setShowCopyAnimation(true);
    setTimeout(() => setShowCopyAnimation(false), 2000);
  };

  // Add scroll function
  const scrollToSqlPreview = () => {
    if (sqlPreviewRef.current) {
      sqlPreviewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Database Operations</h2>
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
                onChange={(e) => handleConnectionChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a connection</option>
                {mockConnections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </option>
                ))}
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
                  {availableTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
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

            {/* Table Schema Preview/Editor */}
            {(selectedTable || operationType === 'create') && parsedData && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      {operationType === 'select' ? 'Table Schema' : 'Column Definitions'}
                    </h3>
                    {hasUnsavedChanges && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  {operationType === 'create' && (
                    <div className="flex items-center space-x-2">
                      <div className="relative" ref={caseMenuRef}>
                        <button
                          onClick={() => setShowCaseMenu(!showCaseMenu)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300"
                        >
                          <span>Transform Headers</span>
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        {showCaseMenu && (
                          <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1" role="menu">
                              {caseOptions.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => transformColumnNames(option.id as any)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                                  role="menuitem"
                                >
                                  <span>{option.label}</span>
                                  <span className="text-xs text-gray-500">{option.example}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                        {/* Add more headers for length, precision, scale, etc. if needed */}
                      </tr>
                    </thead>
                    <tbody>
                      {editableColumns.map((col, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={col.name}
                              onChange={e => handleColumnChange(index, 'name', e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={col.type}
                              onChange={e => handleColumnChange(index, 'type', e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {getAvailableDataTypes().map((type: string) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.nullable}
                              onChange={e => handleColumnChange(index, 'nullable', e.target.checked)}
                            />
                          </td>
                          {/* Add more cells for length, precision, scale, etc. if needed */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SQL Preview Section */}
            {showSqlPreview && (
              <div className="mt-6" ref={sqlPreviewRef}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Generated SQL</h3>
                  <div className="flex items-center space-x-2">
                    {hasUnsavedChanges && (
                      <button
                        onClick={handleResetChanges}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300"
                      >
                        <History className="w-4 h-4 mr-1.5" />
                        Reset Changes
                      </button>
                    )}
                    <button
                      onClick={copySqlToClipboard}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-all duration-200"
                    >
                      {showCopyAnimation ? (
                        <>
                          <svg 
                            className="w-4 h-4 mr-1.5 text-green-500 animate-checkmark" 
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1.5" />
                          Copy SQL
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement create table functionality
                        console.log('Create table functionality to be implemented');
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                    >
                      <Table className="w-4 h-4 mr-1.5" />
                      Create Table
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {generatedSql}
                  </pre>
                </div>
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
                isLoading ||
                editableColumns.some(col => col.validationError)
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Changes?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will discard your current changes and restore the last generated SQL. Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Reset Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => (
  <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white transition-opacity duration-300`}>
    {message}
  </div>
);

const DataImporter: React.FC<DataImporterProps> = ({ onFileSelect, onDataChange, initialData, initialFile }) => {
  const [dataSource, setDataSource] = useState<DataSource>('file');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<RawFileData | null>(initialData?.rawData || null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(initialData?.parsedData || null);
  const [error, setError] = useState<string>('');
  const [editingHeader, setEditingHeader] = useState<{ index: number; value: string } | null>(null);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [originalJsonData, setOriginalJsonData] = useState<any>(initialData?.originalJsonData || null);
  const [availablePaths, setAvailablePaths] = useState<JsonPath[]>(initialData?.availablePaths || []);
  const [selectedPath, setSelectedPath] = useState<JsonPath | null>(initialData?.selectedPath || null);
  const [showFileUploader, setShowFileUploader] = useState(!initialFile && !initialData);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [sortState, setSortState] = useState<{ column: number | null; direction: 'asc' | 'desc' | null }>({ column: null, direction: null });
  const [originalRows, setOriginalRows] = useState<string[][]>([]);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const sqlPreviewRef = useRef<HTMLDivElement>(null);
  const [selectedConnectionInfo, setSelectedConnectionInfo] = useState<DatabaseConnection | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [editableColumns, setEditableColumns] = useState<Array<{
    name: string;
    type: string;
    length?: number;
    precision?: number;
    scale?: number;
    isNullable: boolean;
  }>>([]);
  const [generatedSql, setGeneratedSql] = useState('');
  const [lastGeneratedSql, setLastGeneratedSql] = useState('');
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setShowHeaderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (parsedData || rawData || originalJsonData || availablePaths.length > 0 || selectedPath) {
      onDataChange({
        parsedData,
        rawData,
        originalJsonData,
        availablePaths,
        selectedPath
      });
    }
  }, [parsedData, rawData, originalJsonData, availablePaths, selectedPath]);

  // Use initialFile if provided
  useEffect(() => {
    if (initialFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  // All the functions from your original code remain the same
  const findJsonPaths = (obj: any, currentPath: string[] = []): JsonPath[] => {
    let paths: JsonPath[] = [];
    
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        paths.push({ path: currentPath, type: 'array' });
      }
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          paths = [...paths, ...findJsonPaths(item, [...currentPath, index.toString()])];
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      paths.push({ path: currentPath, type: 'object' });
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          paths = [...paths, ...findJsonPaths(value, [...currentPath, key])];
        }
      });
    }
    
    return paths;
  };

  const getValueAtPath = (obj: any, path: string[]): any => {
    return path.reduce((current, key) => current?.[key], obj);
  };

  const parseJsonData = (data: any, path?: JsonPath): string[][] => {
    let targetData = path ? getValueAtPath(data, path.path) : data;
    let rows: string[][] = [];
    
    if (Array.isArray(targetData)) {
      if (targetData.length > 0 && typeof targetData[0] === 'object') {
        const headers = Object.keys(targetData[0]);
        rows = [
          headers,
          ...targetData.map(item => headers.map(header => String(item[header] ?? '')))
        ];
      }
      else if (targetData.length > 0 && Array.isArray(targetData[0])) {
        rows = targetData.map(row => row.map((cell: unknown) => String(cell ?? '')));
      }
    }
    else if (typeof targetData === 'object' && targetData !== null) {
      const headers = Object.keys(targetData);
      rows = [
        headers,
        headers.map(header => String(targetData[header] ?? ''))
      ];
    }

    return rows;
  };

  const parseCsv = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve({
            headers: results.data[0] as string[],
            rows: results.data.slice(1) as string[][],
          });
        },
        error: () => {
          reject(new Error('Failed to parse CSV file'));
        },
      });
    });
  };

  const parseTxt = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          
          // Use Papa Parse for consistent parsing
          Papa.parse(content, {
            delimiter: delimiter,
            complete: (results) => {
              resolve({
                headers: results.data[0] as string[],
                rows: results.data.slice(1) as string[][],
              });
            },
            error: () => {
              reject(new Error('Failed to parse text file'));
            }
          });
        } catch (error) {
          reject(new Error('Failed to parse text file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const addAuditLog = (action: string, details: string) => {
    setAuditLogs(prev => [{
      timestamp: new Date(),
      action,
      details
    }, ...prev]);
  };

  const handleFileSelect = (file: File) => {
    setShowFileUploader(false);
    addAuditLog('File Selected', `Selected file: ${file.name}`);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type === 'application/json') {
          const jsonData = JSON.parse(e.target?.result as string);
          setOriginalJsonData(jsonData);
          
          const paths = findJsonPaths(jsonData);
          setAvailablePaths(paths);
          
          if (paths.length > 0) {
            const firstPath = paths[0];
            setSelectedPath(firstPath);
            const rows = parseJsonData(jsonData, firstPath);
            if (rows.length === 0) {
              throw new Error('No valid data found in selected JSON path');
            }
            setRawData({ rows });
            parseDataWithHeaderRow(rows, 0);
          } else {
            const rows = parseJsonData(jsonData);
            if (rows.length === 0) {
              throw new Error('No valid data found in JSON file');
            }
            setRawData({ rows });
            parseDataWithHeaderRow(rows, 0);
          }
        } else {
          const text = e.target?.result as string;
          Papa.parse(text, {
            complete: (results) => {
              const rows = results.data as string[][];
              setRawData({ rows });
              parseDataWithHeaderRow(rows, 0);
            },
            error: () => {
              setError('Error parsing file. Please check the format.');
            }
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const handleFileUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    let file: File;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      const selectedFile = fileOrEvent.target.files?.[0];
      if (!selectedFile) return;
      file = selectedFile;
    }

    setError('');
    setParsedData(null);
    setCurrentPage(1);
    setOriginalJsonData(null);
    setAvailablePaths([]);
    setSelectedPath(null);
    
    if (!file) return;

    if (!['text/csv', 'text/plain', 'application/json'].includes(file.type)) {
      setError('Please upload a CSV, TXT, or JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type === 'application/json') {
          const jsonData = JSON.parse(e.target?.result as string);
          setOriginalJsonData(jsonData);
          
          const paths = findJsonPaths(jsonData);
          setAvailablePaths(paths);
          
          if (paths.length > 0) {
            const firstPath = paths[0];
            setSelectedPath(firstPath);
            const rows = parseJsonData(jsonData, firstPath);
            if (rows.length === 0) {
              throw new Error('No valid data found in selected JSON path');
            }
            setRawData({ rows });
            parseDataWithHeaderRow(rows, 0);
          } else {
            const rows = parseJsonData(jsonData);
            if (rows.length === 0) {
              throw new Error('No valid data found in JSON file');
            }
            setRawData({ rows });
            parseDataWithHeaderRow(rows, 0);
          }
        } else {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const rows = lines
            .filter(line => line.trim())
            .map(line => line.split(',').map(cell => cell.trim()));

          setRawData({ rows });
          parseDataWithHeaderRow(rows, 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const handleApiFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setParsedData(null);
    setCurrentPage(1);
    setIsLoading(true);
    setOriginalJsonData(null);
    setAvailablePaths([]);
    setSelectedPath(null);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOriginalJsonData(data);
      
      const paths = findJsonPaths(data);
      setAvailablePaths(paths);
      
      if (paths.length > 0) {
        const firstPath = paths[0];
        setSelectedPath(firstPath);
        const rows = parseJsonData(data, firstPath);
        if (rows.length === 0) {
          throw new Error('No valid data found in selected JSON path');
        }
        setRawData({ rows });
        parseDataWithHeaderRow(rows, 0);
      } else {
        const rows = parseJsonData(data);
        if (rows.length === 0) {
          throw new Error('No data found in API response');
        }
        setRawData({ rows });
        parseDataWithHeaderRow(rows, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data from API');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePathChange = (path: JsonPath) => {
    if (!originalJsonData) return;
    
    setSelectedPath(path);
    const rows = parseJsonData(originalJsonData, path);
    if (rows.length > 0) {
      setRawData({ rows });
      parseDataWithHeaderRow(rows, 0);
      setCurrentPage(1);
    } else {
      setError('No valid data found in selected JSON path');
    }
  };

  const formatPathDisplay = (path: string[]): string => {
    return path.length === 0 ? 'root' : path.join(' → ');
  };

  const parseDataWithHeaderRow = (rows: string[][], headerRowIndex: number) => {
    if (rows.length <= headerRowIndex) {
      setError('Selected header row index is out of bounds');
      return;
    }

    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);

    setOriginalRows(dataRows); // Store original order
    setParsedData({
      headers,
      rows: dataRows
    });
  };

  const handleHeaderRowChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newHeaderRow = parseInt(event.target.value, 10);
    setSelectedHeaderRow(newHeaderRow);
    setCurrentPage(1);
    if (rawData) {
      parseDataWithHeaderRow(rawData.rows, newHeaderRow);
    }
  };

  const handleExport = () => {
    if (!parsedData) return;

    const csvContent = [
      parsedData.headers.join(','),
      ...parsedData.rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const removeColumn = (columnIndex: number) => {
    if (!parsedData) return;
    const columnName = parsedData.headers[columnIndex];
    
    setParsedData({
      headers: parsedData.headers.filter((_, index) => index !== columnIndex),
      rows: parsedData.rows.map(row => row.filter((_, index) => index !== columnIndex))
    });
    
    addAuditLog('Column Removed', `Removed column: "${columnName}"`);
  };

  const removeRow = (rowIndex: number) => {
    if (!parsedData) return;
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    
    setParsedData({
      headers: parsedData.headers,
      rows: parsedData.rows.filter((_, index) => index !== actualIndex)
    });
    setCurrentPage(1);
  };

  const removeNullRows = () => {
    if (!parsedData) return;

    setParsedData({
      headers: parsedData.headers,
      rows: parsedData.rows.filter(row => row.every(cell => cell.trim() !== ''))
    });
    setCurrentPage(1);
  };

  const startEditingHeader = (index: number) => {
    if (!parsedData) return;
    setEditingHeader({ index, value: parsedData.headers[index] });
  };

  const handleColumnDragStart = (index: number) => {
    setDraggedColumnIndex(index);
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === index) return;
    if (!parsedData) return;
    const newHeaders = [...parsedData.headers];
    const newRows = parsedData.rows.map(row => [...row]);
    const moveColumn = (arr: any[], from: number, to: number) => {
      const element = arr[from];
      arr.splice(from, 1);
      arr.splice(to, 0, element);
    };
    moveColumn(newHeaders, draggedColumnIndex, index);
    newRows.forEach(row => moveColumn(row, draggedColumnIndex, index));
    setParsedData({ headers: newHeaders, rows: newRows });
    setDraggedColumnIndex(index);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
  };

  const sortRowsByColumn = (columnIndex: number) => {
    if (!parsedData) return;

    let newDirection: 'asc' | 'desc' | null;
    let sortedRows: string[][];

    // Determine new sort direction
    if (sortState.column !== columnIndex) {
      newDirection = 'asc';
    } else {
      switch (sortState.direction) {
        case 'asc':
          newDirection = 'desc';
          break;
        case 'desc':
          newDirection = null;
          break;
        default:
          newDirection = 'asc';
      }
    }

    // Sort the rows based on the new direction
    if (newDirection === null) {
      sortedRows = [...parsedData.rows];
    } else {
      sortedRows = [...parsedData.rows].sort((a, b) => {
        const valueA = a[columnIndex]?.trim() ?? '';
        const valueB = b[columnIndex]?.trim() ?? '';

        if (!valueA && !valueB) return 0;
        if (!valueA) return 1;
        if (!valueB) return -1;

        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return newDirection === 'asc' ? numA - numB : numB - numA;
        }

        return newDirection === 'asc' 
          ? valueA.toLowerCase().localeCompare(valueB.toLowerCase())
          : valueB.toLowerCase().localeCompare(valueA.toLowerCase());
      });
    }

    setSortState({ column: columnIndex, direction: newDirection });
    // Remove setParsedData call here as it's not needed in DatabaseModal
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleDatabaseOperation = async (databaseId: string, tableId: string) => {
    // TODO: Implement actual database insertion
    console.log('Inserting data into database:', databaseId, 'table:', tableId);
  };

  const handleGenerateSql = (databaseType: string, tableName: string, columns: ColumnInfo[]) => {
    // TODO: Implement SQL generation
    console.log('Generating SQL for:', databaseType, 'table:', tableName, 'columns:', columns);
  };

  const saveHeaderEdit = () => {
    if (!editingHeader || !parsedData) return;
    
    const newHeaders = [...parsedData.headers];
    newHeaders[editingHeader.index] = editingHeader.value;
    
    setParsedData({
      ...parsedData,
      headers: newHeaders
    });
    
    setEditingHeader(null);
  };

  // Add notification component
  const Notification: React.FC<NotificationProps> = ({ message, type }) => (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white transition-opacity duration-300`}>
      {message}
    </div>
  );

  // Add scroll function
  const scrollToSqlPreview = () => {
    if (sqlPreviewRef.current) {
      sqlPreviewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add generateSql function
  const generateSql = () => {
    if (!selectedConnectionInfo || !newTableName || !editableColumns.length) return;

    const dbType = selectedConnectionInfo.type;
    const columns = editableColumns.map(col => {
      const typeDef = dataTypeOptions[dbType][col.type];
      let typeString = col.type;
      
      if (typeDef.hasLength && col.length) {
        typeString += `(${col.length})`;
      } else if (typeDef.hasPrecision && col.precision) {
        if (typeDef.hasScale && col.scale) {
          typeString += `(${col.precision},${col.scale})`;
        } else {
          typeString += `(${col.precision})`;
        }
      }

      return `    [${col.name}] ${typeString} ${col.isNullable ? 'NULL' : 'NOT NULL'}`;
    });

    const sql = `CREATE TABLE [${newTableName}] (\n${columns.join(',\n')}\n);`;
    setGeneratedSql(sql);
    setLastGeneratedSql(sql);
    setShowSqlPreview(true);
    setShowSuccessNotification(true);
    setHasUnsavedChanges(false);

    // Add a small delay to ensure the SQL preview is rendered before scrolling
    setTimeout(() => {
      scrollToSqlPreview();
    }, 100);

    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  // Add copy function
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(generatedSql);
    setShowCopyAnimation(true);
    setTimeout(() => setShowCopyAnimation(false), 2000);
  };

  // Add create table function
  const handleCreateTable = () => {
    // TODO: Implement actual table creation
    setNotification({ message: 'Create table SQL executed', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add handleResetChanges function
  const handleResetChanges = () => {
    if (lastGeneratedSql) {
      setGeneratedSql(lastGeneratedSql);
      setHasUnsavedChanges(false);
      setNotification({ message: 'Changes reset to last generated SQL', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="h-full w-full">
      {showFileUploader ? (
        <div className="h-full flex items-center justify-center">
          <FileImport onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div className="h-full w-full bg-white flex flex-col space-y-4 p-4">
          {/* Data Grid Section */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center space-x-2">
                  {rawData && initialFile && (
                    <div className="flex items-center text-sm text-gray-600 mr-4">
                      <FileUp className="w-4 h-4 mr-1" />
                      <span>{initialFile.name}</span>
                    </div>
                  )}
                  {rawData && rawData.rows.length > 0 && (
                    <div className="relative" ref={headerMenuRef}>
                      <button
                        onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                      >
                        <ArrowUpDown className="w-4 h-4 mr-1.5" />
                        Set Header Row
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      {showHeaderMenu && (
                        <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                          <div className="py-1" role="menu">
                            {rawData.rows.slice(0, 10).map((row, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  parseDataWithHeaderRow(rawData.rows, index);
                                  setSelectedHeaderRow(index);
                                  setShowHeaderMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                                  selectedHeaderRow === index ? 'bg-gray-50 text-black font-medium' : 'text-gray-700'
                                }`}
                                role="menuitem"
                              >
                                <span className="truncate mr-2">Row {index + 1}</span>
                                <span className="text-xs text-gray-500 truncate">
                                  {row.slice(0, 3).join(', ')}...
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={removeNullRows}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Remove Null Rows
                  </button>
                  {parsedData && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                        isEditMode 
                          ? 'bg-gray-900 text-white hover:bg-gray-800' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Edit2 className="w-4 h-4 mr-1.5" />
                      {isEditMode ? 'Exit Edit Mode' : 'Edit Grid'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAuditLogs(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <History className="w-4 h-4 mr-1.5" />
                    Audit Logs
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  {error && (
                    <div className="flex items-center text-red-600">
                      <FileWarning className="w-4 h-4 mr-1.5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Export
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu">
                          <button
                            onClick={() => {
                              handleExport();
                              setShowExportMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export as CSV
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement JSON export
                              setShowExportMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export as JSON
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-white">
              {/* JSON Path Selection */}
              {availablePaths.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-200 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select JSON Path
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availablePaths.map((path, index) => (
                      <button
                        key={index}
                        onClick={() => handlePathChange(path)}
                        className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md ${
                          selectedPath?.path.join('.') === path.path.join('.')
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        } border`}
                      >
                        <span className="truncate">
                          {formatPathDisplay(path.path)}
                        </span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                          {path.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              {parsedData && (
                <div className="flex-1 flex flex-col mt-6">
                  <div className="h-[400px] overflow-hidden">
                    <div className="shadow-lg border border-gray-200 rounded-lg bg-white h-full flex flex-col">
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                              <tr>
                                {isEditMode && (
                                  <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group bg-gray-100 border-b border-gray-200 border-r border-gray-200">
                                    <span className="sr-only">Delete</span>
                                  </th>
                                )}
                                <th colSpan={parsedData.headers.length} className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-gray-700">Headers</span>
                                  </div>
                                </th>
                              </tr>
                              <tr>
                                {isEditMode && (
                                  <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group bg-gray-100 border-b border-gray-200 border-r border-gray-200">
                                    <span className="sr-only">Delete</span>
                                  </th>
                                )}
                                {parsedData.headers.map((header, index) => (
                                  <th
                                    key={index}
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group bg-gray-100 border-b border-gray-200 border-r border-gray-200 last:border-r-0"
                                    draggable={!editingHeader}
                                    onDragStart={() => !editingHeader && handleColumnDragStart(index)}
                                    onDragOver={(e) => !editingHeader && handleColumnDragOver(e, index)}
                                    onDragEnd={handleColumnDragEnd}
                                    style={{ 
                                      minWidth: '150px',
                                      width: columnWidths[index] ? `${columnWidths[index]}px` : undefined
                                    }}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => sortRowsByColumn(index)}
                                          className={`p-1 hover:bg-gray-200 rounded ${
                                            sortState.column === index ? 'text-blue-600' : 'text-gray-500'
                                          }`}
                                          title={`Sort ${sortState.column === index ? 
                                            sortState.direction === 'asc' ? 'descending' : 
                                            sortState.direction === 'desc' ? 'reset' : 'ascending' 
                                            : 'ascending'}`}
                                        >
                                          <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                        {editingHeader?.index === index ? (
                                          <input
                                            type="text"
                                            value={editingHeader.value}
                                            onChange={(e) => setEditingHeader({ ...editingHeader, value: e.target.value })}
                                            onBlur={saveHeaderEdit}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                saveHeaderEdit();
                                              } else if (e.key === 'Escape') {
                                                setEditingHeader(null);
                                              }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="truncate">
                                            {header.trim() ? header : 'Empty Header'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto">
                              {parsedData.rows.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex} className="group">
                                  {isEditMode && (
                                    <td className="w-10 px-2">
                                      <button
                                        onClick={() => removeRow(rowIndex)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Delete row"
                                      >
                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                      </button>
                                    </td>
                                  )}
                                  {row.map((cell: string, cellIndex: number) => (
                                    <td
                                      key={cellIndex}
                                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 last:border-r-0"
                                      style={{ 
                                        minWidth: '150px',
                                        width: columnWidths[cellIndex] ? `${columnWidths[cellIndex]}px` : undefined
                                      }}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
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
                        <option value={-1}>All</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {Math.ceil(parsedData.rows.length / rowsPerPage)}
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
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(parsedData.rows.length / rowsPerPage)))}
                          disabled={currentPage === Math.ceil(parsedData.rows.length / rowsPerPage)}
                          className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Operations Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dataOperations.map((operation) => (
                <button
                  key={operation.id}
                  onClick={() => {
                    if (operation.id === 'database') {
                      setShowDatabaseModal(true);
                    }
                  }}
                  className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-blue-600">
                      {operation.icon}
                    </div>
                    <span className="font-medium text-gray-900">{operation.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 text-left">
                    {operation.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <AuditLogWindow
            logs={auditLogs}
            isOpen={showAuditLogs}
            onClose={() => setShowAuditLogs(false)}
          />

          <DatabaseModal
            isOpen={showDatabaseModal}
            onClose={() => setShowDatabaseModal(false)}
            onInsert={handleDatabaseOperation}
            onGenerateSql={handleGenerateSql}
            parsedData={parsedData}
          />
        </div>
      )}

      {/* SQL Preview Section */}
      {showSqlPreview && (
        <div className="mt-6" ref={sqlPreviewRef}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Generated SQL</h3>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <button
                  onClick={handleResetChanges}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  <History className="w-4 h-4 mr-1.5" />
                  Reset Changes
                </button>
              )}
              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-all duration-200"
              >
                {showCopyAnimation ? (
                  <>
                    <svg 
                      className="w-4 h-4 mr-1.5 text-green-500 animate-checkmark" 
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {generatedSql}
            </pre>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
};

// Add this at the end of the file, before the export
const styles = `
  @keyframes checkmark {
    0% {
      stroke-dashoffset: 100;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  .animate-checkmark {
    stroke-dasharray: 100;
    animation: checkmark 0.3s ease-in-out forwards;
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default DataImporter; 