import React, { useState, useRef, DragEvent } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import DataGrid from './DataGrid';

interface FileImportProps {
  onFileSelect: (file: File) => void;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

const ALLOWED_FILE_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

const ALLOWED_FILE_EXTENSIONS = ['.xls', '.xlsx', '.csv', '.txt'];

const FileImport: React.FC<FileImportProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileValid = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_FILE_TYPES.includes(file.type) || 
           ALLOWED_FILE_EXTENSIONS.includes(fileExtension);
  };

  const parseExcel = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          resolve({
            headers: jsonData[0] as string[],
            rows: jsonData.slice(1) as string[][],
          });
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
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
          const data = lines.map(line => line.split(delimiter));
          
          resolve({
            headers: data[0],
            rows: data.slice(1),
          });
        } catch (error) {
          reject(new Error('Failed to parse text file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseFile = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      let data: ParsedData;

      if (['.xlsx', '.xls'].includes(fileExtension)) {
        data = await parseExcel(file);
      } else if (fileExtension === '.csv') {
        data = await parseCsv(file);
      } else {
        data = await parseTxt(file);
      }

      setParsedData(data);
    } catch (err) {
      setError('Failed to parse file. Please check the file format and try again.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
        onFileSelect(file);
        await parseFile(file);
      } else {
        setError('Invalid file type. Please select an Excel, CSV, or text file.');
        setSelectedFile(null);
        setParsedData(null);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
        onFileSelect(file);
        await parseFile(file);
      } else {
        setError('Invalid file type. Please select an Excel, CSV, or text file.');
        setSelectedFile(null);
        setParsedData(null);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full">
      {!parsedData ? (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div
            className={`w-full max-w-2xl relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-black bg-gray-50'
                : error 
                  ? 'border-red-300 hover:border-red-400'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg
                  className={`w-12 h-12 ${error ? 'text-red-400' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div className="text-lg font-medium text-gray-900">
                {selectedFile 
                  ? `Selected: ${selectedFile.name}`
                  : 'Drop your file here'}
              </div>

              {error ? (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Allowed file types: .xlsx, .xls, .csv, .txt
                </div>
              )}

              <div className="text-sm text-gray-500">
                or
              </div>

              <button
                type="button"
                onClick={handleClick}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium text-white ${
                  error 
                    ? 'bg-red-600 hover:bg-red-700 border-red-600'
                    : 'bg-black hover:bg-gray-900 border-black'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              >
                Select File
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full">
          <DataGrid
            headers={parsedData.headers}
            data={parsedData.rows}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default FileImport; 