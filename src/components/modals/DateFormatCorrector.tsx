import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, ChevronDown, Check } from 'lucide-react';
import { parse, isValid, format } from 'date-fns';

interface DateFormatCorrectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (sourceFormat: string, targetFormat: string) => void;
  columns: { name: string; type: string }[];
  selectedColumn: string;
  onColumnSelect: (columnName: string) => void;
  previewData?: { headers: string[]; rows: string[][] };
}

const DateFormatCorrector: React.FC<DateFormatCorrectorProps> = ({
  isOpen,
  onClose,
  onConvert,
  columns,
  selectedColumn,
  onColumnSelect,
  previewData
}) => {
  const [sourceFormat, setSourceFormat] = useState<string | undefined>(undefined);
  const [targetFormat, setTargetFormat] = useState('yyyy-MM-dd');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<{
    success: boolean;
    message: string;
    duration: number;
    recordsModified: number;
  } | null>(null);
  const [previewRows, setPreviewRows] = useState<Array<{
    originalValue: string;
    convertedValue: string;
    rowIndex: number;
    isValid: boolean;
    error?: string;
  }>>([]);
  const [isSourceFormatOpen, setIsSourceFormatOpen] = useState(false);
  const [isTargetFormatOpen, setIsTargetFormatOpen] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  const commonFormats = [
    { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy', example: '03/20/2024' },
    { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy', example: '20/03/2024' },
    { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd', example: '2024-03-20' },
    { value: 'MM-dd-yyyy', label: 'MM-dd-yyyy', example: '03-20-2024' },
    { value: 'dd-MM-yyyy', label: 'dd-MM-yyyy', example: '20-03-2024' },
    { value: 'yyyy/MM/dd', label: 'yyyy/MM/dd', example: '2024/03/20' }
  ] as const;

  const parseDate = (dateStr: string, format: string): { date: Date | null; error?: string } => {
    if (!dateStr || dateStr.trim() === '') {
      return { date: null, error: 'Empty date value' };
    }

    // Clean the input string and normalize separators
    const cleanedStr = dateStr.trim()
      .replace(/[\/\-]/g, match => match === '/' ? '/' : '-');

    try {
      // Try parsing with the provided format
      const date = parse(cleanedStr, format, new Date());
      
      if (!isValid(date)) {
        // If parsing fails, try some common fallback formats
        const fallbackFormats = [
          'MM/dd/yyyy',
          'dd/MM/yyyy',
          'yyyy-MM-dd',
          'MM-dd-yyyy',
          'dd-MM-yyyy',
          'yyyy/MM/dd'
        ];

        for (const fallbackFormat of fallbackFormats) {
          const fallbackDate = parse(cleanedStr, fallbackFormat, new Date());
          if (isValid(fallbackDate)) {
            return { date: fallbackDate };
          }
        }

        return { 
          date: null, 
          error: `Invalid date: ${cleanedStr} does not match format ${format}` 
        };
      }

      // Additional validation to ensure the parsed date makes sense
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        return { 
          date: null, 
          error: `Invalid year: ${year} is outside reasonable range (1900-2100)` 
        };
      }

      return { date };
    } catch (error) {
      console.error('Date parsing error:', error);
      return { 
        date: null, 
        error: `Failed to parse date: ${cleanedStr} with format ${format}` 
      };
    }
  };

  const detectDateFormat = (values: string[]): string | null => {
    // Filter out empty values
    const nonEmptyValues = values.filter(v => v && v.trim() !== '');
    if (nonEmptyValues.length === 0) return null;

    // Analyze the pattern of the first valid date
    const firstValidDate = nonEmptyValues.find(value => {
      // Try to parse with any format first
      for (const format of commonFormats) {
        const { date } = parseDate(value, format.value);
        if (date) return true;
      }
      return false;
    });

    if (!firstValidDate) return null;

    // Analyze the separators and positions
    const hasSlash = firstValidDate.includes('/');
    const hasDash = firstValidDate.includes('-');
    const parts = firstValidDate.split(/[\/\-]/);
    
    if (parts.length !== 3) return null;

    // Determine the format based on the pattern
    const firstPart = parts[0];
    const secondPart = parts[1];
    const thirdPart = parts[2];

    // Check if it's a year (4 digits)
    const isFirstYear = /^\d{4}$/.test(firstPart);
    const isSecondYear = /^\d{4}$/.test(secondPart);
    const isThirdYear = /^\d{4}$/.test(thirdPart);

    // Determine the format based on year position and separators
    if (isFirstYear) {
      return hasDash ? 'yyyy-MM-dd' : 'yyyy/MM/dd';
    } else if (isThirdYear) {
      if (hasSlash) {
        // Check if first part is month (1-12)
        const firstNum = parseInt(firstPart);
        return firstNum <= 12 ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
      } else {
        // Check if first part is month (1-12)
        const firstNum = parseInt(firstPart);
        return firstNum <= 12 ? 'MM-dd-yyyy' : 'dd-MM-yyyy';
      }
    }

    return null;
  };

  // Detect source format when column is selected
  useEffect(() => {
    if (!previewData || !selectedColumn) return;

    const columnIndex = previewData.headers.findIndex(header => header === selectedColumn);
    if (columnIndex === -1) return;

    // Get all values from the column
    const columnValues = previewData.rows.map(row => row[columnIndex]);
    
    // Try to detect format from all values
    const detectedFormat = detectDateFormat(columnValues);
    if (detectedFormat) {
      setSourceFormat(detectedFormat);
    } else {
      setSourceFormat('Unknown format');
    }
  }, [previewData, selectedColumn]);

  // Generate preview when source format or target format changes
  useEffect(() => {
    if (!previewData || !selectedColumn) return;

    const columnIndex = previewData.headers.findIndex(header => header === selectedColumn);
    if (columnIndex === -1) return;

    const preview = previewData.rows.map((row, rowIndex) => {
      const dateValue = row[columnIndex];
      const { date, error } = parseDate(dateValue, sourceFormat || 'MM/dd/yyyy');
      
      let convertedValue = dateValue;
      let isValid = true;

      if (date) {
        try {
          convertedValue = format(date, targetFormat);
        } catch (error) {
          isValid = false;
          error = `Failed to format date: ${error}`;
        }
      } else {
        isValid = false;
      }

      return {
        originalValue: dateValue,
        convertedValue,
        rowIndex,
        isValid,
        error
      };
    }).filter(row => row.originalValue && row.originalValue.trim() !== '');

    setPreviewRows(preview);
  }, [previewData, selectedColumn, sourceFormat, targetFormat]);

  const handleConvert = async () => {
    if (!selectedColumn) {
      setConversionResult({
        success: false,
        message: 'Please select a column to convert',
        duration: 0,
        recordsModified: 0
      });
      return;
    }

    // Check if there are any invalid dates in the preview
    const invalidDates = previewRows.filter(row => !row.isValid);
    if (invalidDates.length > 0) {
      setConversionResult({
        success: false,
        message: `Found ${invalidDates.length} invalid dates. Please check the preview and adjust the format.`,
        duration: 0,
        recordsModified: 0
      });
      return;
    }

    setIsConverting(true);
    const startTime = performance.now();
    
    try {
      await onConvert(sourceFormat || 'MM/dd/yyyy', targetFormat);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setConversionResult({
        success: true,
        message: 'Date format conversion completed successfully',
        duration,
        recordsModified: previewRows.length
      });

      // Remove automatic closing
    } catch (error) {
      setConversionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Conversion failed',
        duration: 0,
        recordsModified: 0
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSourceFormat(undefined);
      setTargetFormat('yyyy-MM-dd');
      setConversionResult(null);
      setPreviewRows([]);
    }
  }, [isOpen]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceFormatOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetFormatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-medium text-gray-900">Date Format Correction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Column
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => onColumnSelect(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select a column</option>
                {columns.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Format
                </label>
                <div className="relative">
                  <div className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-gray-300 rounded-md bg-gray-50">
                    <span className="truncate text-gray-600">
                      {sourceFormat || 'Detecting format...'}
                    </span>
                  </div>
                </div>
              </div>

              <div ref={targetDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Format
                </label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsTargetFormatOpen(!isTargetFormatOpen);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <span className="truncate">
                      {targetFormat || 'Select format'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {isTargetFormatOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {commonFormats.map((format) => (
                        <button
                          key={format.label}
                          onClick={() => {
                            setTargetFormat(format.value);
                            setIsTargetFormatOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{format.label}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{format.example}</span>
                          </div>
                          {targetFormat === format.value && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Game #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Converted Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewRows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {previewData?.rows[row.rowIndex][0]}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {row.originalValue}
                          </td>
                          <td className={`px-4 py-3 text-sm whitespace-nowrap ${
                            row.isValid ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {row.convertedValue}
                            {!row.isValid && row.error && (
                              <span className="ml-2 text-xs text-red-500">({row.error})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {conversionResult && (
              <div className={`p-4 rounded-lg ${
                conversionResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {conversionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {conversionResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleConvert();
                  onClose();
                }}
                disabled={!selectedColumn || !sourceFormat || !targetFormat || isConverting}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert Dates'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFormatCorrector; 