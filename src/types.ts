export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export interface RawFileData {
  rows: string[][];
}

export interface JsonPath {
  path: string[];
  type: 'array' | 'object';
}

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  details: string;
  data?: {
    type: 'row_deletion';
    rows: string[][];
    indices: number[];
  };
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'sqlserver' | 'mysql' | 'postgresql' | 'oracle';
  connectionString: string;
}

export interface TableInfo {
  id: string;
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
}

export interface EditableColumn {
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