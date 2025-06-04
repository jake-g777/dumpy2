import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileWarning, Trash2, GripVertical, X, Edit2, ArrowUpDown, ChevronLeft, ChevronRight, Globe2, FileUp, ChevronDown, History, ChevronUp, Database, Code, Server, Table, Loader2, AlertCircle, Copy, CheckCircle, Calendar, GitBranch, RefreshCw } from 'lucide-react';
import FileImport from './FileImport';
import Papa from 'papaparse';
import { parse, isValid, format } from 'date-fns';
import DateFormatCorrector from './modals/DateFormatCorrector';
import EmptyValueDeleter from './modals/EmptyValueDeleter';
import DatabaseModal from './DatabaseModal';
import * as XLSX from 'xlsx';
import { DatabaseConnectionService } from '../services/DatabaseConnectionService';
import { useAuth } from '../contexts/AuthContext';
//import { readFile } from './utils/fileUtils';
//import { extractJsonPaths } from './utils/jsonUtils';
//import { parseFileData } from './utils/csvUtils';

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
  pipeline?: {
    id: string;
    name: string;
    description: string;
    type: 'file' | 'api' | 'database';
    createdAt: Date;
    lastRun?: Date;
    fileName?: string;
    createdBy: string;
  };
  onBack: () => void;
}

interface AuditLogEntry {
  timestamp: Date;
  action: string;
  details: string;
  data?: {
    type: 'row_deletion';
    rows: string[][];
    indices: number[];
  };
}

interface AuditLogWindowProps {
  logs: AuditLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onRevert?: (entry: AuditLogEntry) => void;
}

const AuditLogWindow: React.FC<AuditLogWindowProps> = ({ logs, isOpen, onClose, onRevert }) => {
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
                  {log.data?.type === 'row_deletion' && onRevert && (
                    <button
                      onClick={() => onRevert(log)}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    >
                      <History className="w-4 h-4 mr-1.5" />
                      Revert Deletion
                    </button>
                  )}
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
  validationStatus?: 'validating' | 'valid' | 'invalid';
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
    'tinyint': { name: 'tinyint', hasLength: false, hasPrecision: false, hasScale: false },
    'smallint': { name: 'smallint', hasLength: false, hasPrecision: false, hasScale: false },
    'int': { name: 'int', hasLength: false, hasPrecision: false, hasScale: false },
    'bigint': { name: 'bigint', hasLength: false, hasPrecision: false, hasScale: false },
    'varchar': { name: 'varchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 255 },
    'nvarchar': { name: 'nvarchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 255 },
    'char': { name: 'char', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 50 },
    'nchar': { name: 'nchar', hasLength: true, hasPrecision: false, hasScale: false, defaultLength: 50 },
    'decimal': { name: 'decimal', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
    'numeric': { name: 'numeric', hasLength: false, hasPrecision: true, hasScale: true, defaultPrecision: 18, defaultScale: 0 },
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
    
    // Determine appropriate integer type based on value ranges
    const maxNumber = Math.max(...numbers);
    const minNumber = Math.min(...numbers);
    
    if (maxNumber <= 255 && minNumber >= 0) {
      return { type: 'tinyint' };
    } else if (maxNumber <= 32767 && minNumber >= -32768) {
      return { type: 'smallint' };
    } else if (maxNumber <= 2147483647 && minNumber >= -2147483648) {
      return { type: 'int' };
    } else {
      return { type: 'bigint' };
    }
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
  onDataChange: (data: {
    parsedData: ParsedData | null;
    rawData: RawFileData | null;
    originalJsonData: any;
    availablePaths: JsonPath[];
    selectedPath: JsonPath | null;
  }) => void;
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

interface ColumnValidationError {
  columnIndex: number;
  columnName: string;
  errors: {
    rowIndex: number;
    value: string;
    message: string;
  }[];
}

const DataImporter: React.FC<DataImporterProps> = ({
  onFileSelect,
  onDataChange,
  initialData,
  initialFile,
  pipeline,
  onBack
}) => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(initialData?.parsedData || null);
  const [rawData, setRawData] = useState<RawFileData | null>(initialData?.rawData || null);
  const [originalJsonData, setOriginalJsonData] = useState<any>(initialData?.originalJsonData || null);
  const [availablePaths, setAvailablePaths] = useState<JsonPath[]>(initialData?.availablePaths || []);
  const [selectedPath, setSelectedPath] = useState<JsonPath | null>(initialData?.selectedPath || null);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHeader, setEditingHeader] = useState<{ index: number; value: string } | null>(null);
  const [sortState, setSortState] = useState<{ column: number | null; direction: 'asc' | 'desc' | null }>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showDateFormatCorrector, setShowDateFormatCorrector] = useState(false);
  const [showEmptyValueDeleter, setShowEmptyValueDeleter] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [selectedColumnForDateCorrection, setSelectedColumnForDateCorrection] = useState<{ name: string; index: number } | null>(null);
  const [selectedColumnForEmptyDeletion, setSelectedColumnForEmptyDeletion] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [originalRows, setOriginalRows] = useState<string[][]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [validationErrors, setValidationErrors] = useState<ColumnValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const { databaseUserId } = useAuth();
  const [isRefreshingConnections, setIsRefreshingConnections] = useState(false);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setParsedData(initialData.parsedData);
      setRawData(initialData.rawData);
      setOriginalJsonData(initialData.originalJsonData);
      setAvailablePaths(initialData.availablePaths);
      setSelectedPath(initialData.selectedPath);
    }
  }, [initialData]);

  const handleFileSelect = async (file: File) => {
    const filePath = file.name;
    onFileSelect(filePath);
    
    try {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      let data: ParsedData;

      if (['.xlsx', '.xls'].includes(fileExtension)) {
        const reader = new FileReader();
        const result = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
        const workbook = XLSX.read(new Uint8Array(result), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        data = {
          headers: jsonData[0] as string[],
          rows: jsonData.slice(1) as string[][]
        };
      } else if (fileExtension === '.csv') {
        const result = await new Promise<Papa.ParseResult<string[]>>((resolve, reject) => {
          Papa.parse(file, {
            complete: resolve,
            error: reject
          });
        });
        data = {
          headers: result.data[0],
          rows: result.data.slice(1)
        };
      } else {
        const reader = new FileReader();
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const parsedData = lines.map(line => line.split(delimiter));
        data = {
          headers: parsedData[0],
          rows: parsedData.slice(1)
        };
      }

      setParsedData(data);
      setRawData({ rows: [data.headers, ...data.rows] });
      onDataChange({
        parsedData: data,
        rawData: { rows: [data.headers, ...data.rows] },
        originalJsonData: null,
        availablePaths: [],
        selectedPath: null
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      setError('Failed to parse file. Please check the file format and try again.');
    }
  };

  const parseDataWithHeaderRow = (data: string[][], headerRowIndex: number) => {
    if (!data || data.length === 0) return;
    const headers = data[headerRowIndex];
    const rows = data.slice(headerRowIndex + 1);
    setParsedData({ headers, rows });
    setSelectedHeaderRow(headerRowIndex);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!parsedData) return;
    
    let content: string;
    if (format === 'csv') {
      content = [parsedData.headers, ...parsedData.rows]
        .map(row => row.join(','))
        .join('\n');
    } else {
      content = JSON.stringify(
        parsedData.rows.map(row => 
          Object.fromEntries(
            parsedData.headers.map((header, i) => [header, row[i]])
          )
        ),
        null,
        2
      );
    }
    
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleColumnDragStart = (index: number) => {
    // Implementation for column drag start
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Implementation for column drag over
  };

  const handleGridDragEnd = () => {
    // Implementation for grid drag end
  };

  const sortRowsByColumn = (columnIndex: number) => {
    if (!parsedData) return;
    
    const newDirection = sortState.column === columnIndex && sortState.direction === 'asc' ? 'desc' : 'asc';
    const sortedRows = [...parsedData.rows].sort((a, b) => {
      const aValue = a[columnIndex]?.toLowerCase() ?? '';
      const bValue = b[columnIndex]?.toLowerCase() ?? '';
      return newDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    
    setSortState({ column: columnIndex, direction: newDirection });
    setParsedData({ ...parsedData, rows: sortedRows });
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

  const removeRow = (rowIndex: number) => {
    if (!parsedData) return;
    
    const newRows = parsedData.rows.filter((_, index) => index !== rowIndex);
    setParsedData({
      ...parsedData,
      rows: newRows
    });
  };

  const generateSql = () => {
    if (!parsedData) return;
    // Generate SQL based on the parsed data
    const sql = `CREATE TABLE ${newTableName} (\n${parsedData.headers.map(header => `  ${header} VARCHAR(255)`).join(',\n')}\n);`;
    setGeneratedSql(sql);
  };

  const handleDatabaseOperation = async (databaseId: string, tableId: string) => {
    try {
      // Since onInsert is not provided in props, we'll just close the modal
      setShowDatabaseModal(false);
    } catch (error) {
      console.error('Error performing database operation:', error);
      setError('Failed to perform database operation');
    }
  };

  const handleGenerateSql = (databaseType: string, tableName: string, columns: ColumnInfo[]) => {
    // Generate SQL based on the provided parameters
    const sql = `CREATE TABLE ${tableName} (\n${columns.map(col => `  ${col.name} ${col.type}${col.isNullable ? '' : ' NOT NULL'}`).join(',\n')}\n);`;
    setGeneratedSql(sql);
  };

  const handleDateFormatConversion = (sourceFormat: string, targetFormat: string) => {
    if (!parsedData || !selectedColumnForDateCorrection) return;
    
    const newRows = parsedData.rows.map(row => {
      const newRow = [...row];
      const dateValue = row[selectedColumnForDateCorrection.index];
      try {
        const parsedDate = parse(dateValue, sourceFormat, new Date());
        if (isValid(parsedDate)) {
          newRow[selectedColumnForDateCorrection.index] = format(parsedDate, targetFormat);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
      return newRow;
    });

    setParsedData({
      ...parsedData,
      rows: newRows
    });
  };

  const handleEmptyValueDeletion = () => {
    if (!parsedData || !selectedColumnForEmptyDeletion) return;
    
    const columnIndex = parsedData.headers.findIndex(h => h === selectedColumnForEmptyDeletion);
    if (columnIndex === -1) return;

    const newRows = parsedData.rows.filter(row => row[columnIndex]?.trim() !== '');
    
    setParsedData({
      ...parsedData,
      rows: newRows
    });
  };

  const handleRevertDeletion = (entry: AuditLogEntry) => {
    if (!parsedData || !entry.data || entry.data.type !== 'row_deletion') return;
    
    const newRows = [...parsedData.rows];
    entry.data.rows.forEach((row, index) => {
      if (entry.data?.indices) {
        newRows.splice(entry.data.indices[index], 0, row);
      }
    });
    
    setParsedData({
      ...parsedData,
      rows: newRows
    });
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handleRefreshConnections = async () => {
    if (!databaseUserId) {
      console.error('No database user ID available');
      return;
    }
    
    setIsRefreshingConnections(true);
    try {
      console.log('Refreshing connections for user:', databaseUserId);
      const connections = await DatabaseConnectionService.getConnections(databaseUserId);
      console.log('Refreshed connections:', connections);
      
      if (!connections || connections.length === 0) {
        console.log('No connections found');
        return;
      }

      // If the database modal is open, update its connections
      if (showDatabaseModal) {
        // You might need to add a prop to DatabaseModal to handle connection updates
        // For now, we'll just close and reopen the modal to refresh
        setShowDatabaseModal(false);
        setTimeout(() => setShowDatabaseModal(true), 100);
      }
    } catch (error) {
      console.error('Failed to refresh database connections:', error);
    } finally {
      setIsRefreshingConnections(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full w-full flex flex-col space-y-4">
        {/* Data Grid */}
        {parsedData && (
          <div className="flex-1 flex flex-col">
            <div className="h-[calc(100vh-22rem)] overflow-hidden">
              <div className="shadow-lg border border-gray-700 rounded-none bg-gray-900 h-full flex flex-col">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800 sticky top-0 z-10">
                        <tr>
                          {isEditMode && (
                            <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider relative group bg-gray-800 border-b border-gray-600 border-r border-gray-600">
                              <span className="sr-only">Delete</span>
                            </th>
                          )}
                          <th colSpan={parsedData.rows[0]?.length || parsedData.headers.length} className="px-6 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {rawData && initialFile && (
                                  <div className="flex items-center text-xs text-gray-400">
                                    <FileUp className="w-3 h-3 mr-1" />
                                    <span>{initialFile.name}</span>
                                  </div>
                                )}
                                {rawData && rawData.rows.length > 0 && (
                                  <div className="relative" ref={headerMenuRef}>
                                    <button
                                      onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none"
                                    >
                                      <ArrowUpDown className="w-3 h-3 mr-1" />
                                      Set Header Row
                                      <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                    {showHeaderMenu && (
                                      <div className="absolute left-0 mt-1 w-48 rounded-none shadow-lg bg-gray-900 ring-1 ring-gray-700 z-50">
                                        <div className="py-1" role="menu">
                                          {rawData.rows.slice(0, 10).map((row, index) => (
                                            <button
                                              key={index}
                                              onClick={() => {
                                                parseDataWithHeaderRow(rawData.rows, index);
                                                setSelectedHeaderRow(index);
                                                setShowHeaderMenu(false);
                                              }}
                                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 flex items-center justify-between ${
                                                selectedHeaderRow === index ? 'bg-gray-800 text-white font-medium' : 'text-gray-300'
                                              }`}
                                              role="menuitem"
                                            >
                                              <span className="truncate mr-2">Row {index + 1}</span>
                                              <span className="text-xs text-gray-400 truncate">
                                                {row.slice(0, 3).join(', ')}...
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {parsedData && (
                                  <button
                                    onClick={() => {
                                      setShowEmptyValueDeleter(true);
                                      setSelectedColumnForEmptyDeletion('');
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete Empty Values
                                  </button>
                                )}
                                {parsedData && (
                                  <button
                                    onClick={() => {
                                      setShowDateFormatCorrector(true);
                                      setSelectedColumnForDateCorrection(null);
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none"
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Format Dates
                                  </button>
                                )}
                                {parsedData && (
                                  <button
                                    onClick={() => setShowAuditLogs(true)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none"
                                  >
                                    <History className="w-3 h-3 mr-1" />
                                    Audit Logs
                                  </button>
                                )}
                                <div className="relative" ref={exportMenuRef}>
                                  <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Export
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                  </button>
                                  {showExportMenu && (
                                    <div className="absolute left-0 mt-1 w-48 rounded-none shadow-lg bg-gray-900 ring-1 ring-gray-700 z-10">
                                      <div className="py-1" role="menu">
                                        <button
                                          onClick={() => {
                                            handleExport('csv');
                                            setShowExportMenu(false);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center"
                                          role="menuitem"
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Export as CSV
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleExport('json');
                                            setShowExportMenu(false);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center"
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
                              {parsedData && (
                                <button
                                  onClick={() => setIsEditMode(!isEditMode)}
                                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-none transition-all duration-200 ${
                                    isEditMode 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md scale-105' 
                                      : 'text-gray-200 hover:text-white hover:bg-gray-700 border-2 border-transparent hover:border-blue-500'
                                  }`}
                                >
                                  <Edit2 className={`w-3 h-3 mr-1 ${isEditMode ? 'animate-pulse' : ''}`} />
                                  {isEditMode ? 'Exit Edit Mode' : 'Edit Grid'}
                                </button>
                              )}
                            </div>
                          </th>
                        </tr>
                        <tr>
                          {isEditMode && (
                            <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider relative group bg-gray-800 border-b border-gray-600 border-r border-gray-600">
                              <span className="sr-only">Delete</span>
                            </th>
                          )}
                          {parsedData.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider relative group bg-gray-800 border-b border-gray-600 border-r border-gray-600 last:border-r-0"
                              draggable={!editingHeader}
                              onDragStart={() => !editingHeader && handleColumnDragStart(index)}
                              onDragOver={(e) => !editingHeader && handleColumnDragOver(e, index)}
                              onDragEnd={handleGridDragEnd}
                              style={{ 
                                minWidth: '150px',
                                cursor: 'move'
                              }}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => sortRowsByColumn(index)}
                                    className={`p-1 hover:bg-gray-700 rounded-none ${
                                      sortState.column === index ? 'text-blue-400' : 'text-gray-400'
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
                                      className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="truncate font-medium">
                                      {header.trim() ? header : 'Empty Header'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-700 overflow-y-auto">
                        {parsedData.rows.map((row: string[], rowIndex: number) => (
                          <tr key={rowIndex} className="group">
                            {isEditMode && (
                              <td className="w-10 px-2">
                                <button
                                  onClick={() => removeRow(rowIndex)}
                                  className="p-1 hover:bg-gray-800 rounded-none"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                                </button>
                              </td>
                            )}
                            {row.map((cell: string, cellIndex: number) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 border-r border-gray-700 last:border-r-0"
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
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">Rows per page:</label>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {Math.ceil(parsedData.rows.length / rowsPerPage)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(parsedData.rows.length / rowsPerPage)))}
                    disabled={currentPage === Math.ceil(parsedData.rows.length / rowsPerPage)}
                    className="inline-flex items-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Operations Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-none p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataOperations.map((operation) => (
              <div key={operation.id} className="relative">
                <button
                  onClick={() => {
                    if (operation.id === 'database') {
                      setShowDatabaseModal(true);
                    }
                  }}
                  className="w-full flex flex-col items-start p-4 bg-gray-800 border border-gray-700 rounded-none hover:border-blue-500 hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                      {operation.icon}
                    </div>
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{operation.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 text-left transition-colors">
                    {operation.description}
                  </p>
                </button>
                {operation.id === 'database' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshConnections();
                    }}
                    disabled={isRefreshingConnections}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh Database Connections"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingConnections ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuditLogWindow
        logs={auditLogs}
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
        onRevert={handleRevertDeletion}
      />

      {showDatabaseModal && (
        <DatabaseModal
          isOpen={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
          onInsert={handleDatabaseOperation}
          onGenerateSql={handleGenerateSql}
          parsedData={parsedData}
        />
      )}

      <DateFormatCorrector
        isOpen={showDateFormatCorrector}
        onClose={() => {
          setShowDateFormatCorrector(false);
          setSelectedColumnForDateCorrection(null);
        }}
        onConvert={(sourceFormat, targetFormat) => {
          if (selectedColumnForDateCorrection) {
            handleDateFormatConversion(sourceFormat, targetFormat);
          }
        }}
        columns={parsedData?.headers.map(header => ({ name: header, type: '' })) || []}
        selectedColumn={selectedColumnForDateCorrection?.name || ''}
        onColumnSelect={(columnName) => {
          setSelectedColumnForDateCorrection({
            name: columnName,
            index: parsedData?.headers.findIndex(h => h === columnName) || -1
          });
        }}
        previewData={parsedData || undefined}
      />

      <EmptyValueDeleter
        isOpen={showEmptyValueDeleter}
        onClose={() => {
          setShowEmptyValueDeleter(false);
          setSelectedColumnForEmptyDeletion('');
        }}
        columns={parsedData?.headers.map(header => ({ name: header, type: '' })) || []}
        selectedColumn={selectedColumnForEmptyDeletion}
        onColumnSelect={setSelectedColumnForEmptyDeletion}
        previewData={parsedData || undefined}
        onDelete={handleEmptyValueDeletion}
      />
    </div>
  );
};

export default DataImporter; 