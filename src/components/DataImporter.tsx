import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileWarning, Trash2, GripVertical, X, Edit2, ArrowUpDown, ChevronLeft, ChevronRight, Globe2, FileUp, ChevronDown } from 'lucide-react';
import FileImport from './FileImport';

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
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

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
      handleFileUpload(initialFile);
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

  const handleFileSelect = (file: File) => {
    setShowFileUploader(false);
    onFileSelect(file.name);
    
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

  const handleFileUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    let file: File;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      const selectedFile = fileOrEvent.target.files?.[0];
      if (!selectedFile) return;
      file = selectedFile;
    }

    onFileSelect(file.name);
    
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

    setParsedData({
      headers: parsedData.headers.filter((_, index) => index !== columnIndex),
      rows: parsedData.rows.map(row => row.filter((_, index) => index !== columnIndex))
    });
  };

  const removeRow = (rowIndex: number) => {
    if (!parsedData) return;

    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    setParsedData({
      headers: parsedData.headers,
      rows: parsedData.rows.filter((_, index) => index !== actualIndex)
    });
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

  const saveHeaderEdit = () => {
    if (!parsedData || !editingHeader) return;

    setParsedData({
      ...parsedData,
      headers: parsedData.headers.map((header, index) => 
        index === editingHeader.index ? editingHeader.value : header
      )
    });
    setEditingHeader(null);
  };

  const handleColumnDragStart = (columnIndex: number) => {
    setDraggedColumnIndex(columnIndex);
  };

  const handleColumnDragOver = (event: React.DragEvent, columnIndex: number) => {
    event.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === columnIndex) return;

    if (!parsedData) return;

    const newHeaders = [...parsedData.headers];
    const newRows = parsedData.rows.map(row => [...row]);

    const moveColumn = (arr: any[], from: number, to: number) => {
      const element = arr[from];
      arr.splice(from, 1);
      arr.splice(to, 0, element);
    };

    moveColumn(newHeaders, draggedColumnIndex, columnIndex);
    newRows.forEach(row => moveColumn(row, draggedColumnIndex, columnIndex));

    setParsedData({ headers: newHeaders, rows: newRows });
    setDraggedColumnIndex(columnIndex);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
  };

  const sortRowsByColumn = (columnIndex: number) => {
    if (!parsedData) return;

    const sortedRows = [...parsedData.rows].sort((a, b) => {
      const valueA = a[columnIndex].toLowerCase();
      const valueB = b[columnIndex].toLowerCase();
      return valueA.localeCompare(valueB);
    });

    setParsedData({
      headers: parsedData.headers,
      rows: sortedRows
    });
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    if (!parsedData) return { paginatedRows: [], totalPages: 0 };

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRows = parsedData.rows.slice(startIndex, endIndex);
    const totalPages = Math.ceil(parsedData.rows.length / rowsPerPage);

    return { paginatedRows, totalPages };
  };

  const { paginatedRows, totalPages } = getPaginatedData();

  return (
    <div className="h-full w-full">
      {showFileUploader ? (
        <div className="h-full flex items-center justify-center">
          <FileImport onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <div className="h-full w-full bg-white flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-2">
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
                      <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
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
                <div className="flex-1 overflow-auto">
                  <div className="shadow-lg border border-gray-200 rounded-lg bg-white">
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {parsedData.headers.map((header, index) => (
                                <th
                                  key={index}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group bg-gray-50"
                                  draggable
                                  onDragStart={() => handleColumnDragStart(index)}
                                  onDragOver={(e) => handleColumnDragOver(e, index)}
                                  onDragEnd={handleColumnDragEnd}
                                  style={{ minWidth: '150px' }}
                                >
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100" />
                                    {editingHeader?.index === index ? (
                                      <input
                                        type="text"
                                        value={editingHeader.value}
                                        onChange={(e) => setEditingHeader({ ...editingHeader, value: e.target.value })}
                                        onBlur={saveHeaderEdit}
                                        onKeyPress={(e) => e.key === 'Enter' && saveHeaderEdit()}
                                        className="border rounded px-2 py-1 text-sm w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 flex-1">
                                        <span>{header}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                          <button
                                            onClick={() => startEditingHeader(index)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                          >
                                            <Edit2 className="w-3 h-3 text-gray-500" />
                                          </button>
                                          <button
                                            onClick={() => sortRowsByColumn(index)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                          >
                                            <ArrowUpDown className="w-3 h-3 text-gray-500" />
                                          </button>
                                          <button
                                            onClick={() => removeColumn(index)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                          >
                                            <X className="w-3 h-3 text-gray-500" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedRows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="group">
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    style={{ minWidth: '150px' }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                                <td className="opacity-0 group-hover:opacity-100 px-2">
                                  <button
                                    onClick={() => removeRow(rowIndex)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                  </button>
                                </td>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImporter; 