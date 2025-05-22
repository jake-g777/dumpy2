import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [sourceFormat, setSourceFormat] = useState('MM/dd/yyyy');
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

  const commonFormats = [
    { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy (e.g., 03/20/2024)' },
    { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy (e.g., 20/03/2024)' },
    { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd (e.g., 2024-03-20)' },
    { value: 'MM-dd-yyyy', label: 'MM-dd-yyyy (e.g., 03-20-2024)' },
    { value: 'dd-MM-yyyy', label: 'dd-MM-yyyy (e.g., 20-03-2024)' },
    { value: 'yyyy/MM/dd', label: 'yyyy/MM/dd (e.g., 2024/03/20)' }
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

  // Generate preview when source format or target format changes
  useEffect(() => {
    if (!previewData || !selectedColumn) return;

    const columnIndex = previewData.headers.findIndex(header => header === selectedColumn);
    if (columnIndex === -1) return;

    const preview = previewData.rows.map((row, rowIndex) => {
      const dateValue = row[columnIndex];
      const { date, error } = parseDate(dateValue, sourceFormat);
      
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
      await onConvert(sourceFormat, targetFormat);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setConversionResult({
        success: true,
        message: 'Date format conversion completed successfully',
        duration,
        recordsModified: previewRows.length
      });

      // Close the modal after successful conversion
      setTimeout(() => {
        onClose();
      }, 2000);
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
      setSourceFormat('MM/dd/yyyy');
      setTargetFormat('yyyy-MM-dd');
      setConversionResult(null);
      setPreviewRows([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Date Format Correction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Column
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => onColumnSelect(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a column...</option>
                {columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Format
              </label>
              <select
                value={sourceFormat}
                onChange={(e) => setSourceFormat(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row) => (
                    <tr key={row.rowIndex} className={!row.isValid ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-sm text-gray-500">{row.rowIndex + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.originalValue}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.convertedValue}</td>
                      <td className="px-4 py-2 text-sm">
                        {row.isValid ? (
                          <span className="text-green-600">Valid</span>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span>{row.error || 'Invalid'}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Result */}
          {conversionResult && (
            <div className={`p-4 rounded-lg ${
              conversionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center">
                {conversionResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span>{conversionResult.message}</span>
              </div>
              {conversionResult.success && (
                <div className="mt-2 text-sm">
                  <p>Duration: {conversionResult.duration.toFixed(2)}ms</p>
                  <p>Records modified: {conversionResult.recordsModified}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={isConverting || previewRows.some(row => !row.isValid)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isConverting || previewRows.some(row => !row.isValid)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Converting...
                </>
              ) : (
                'Convert'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFormatCorrector; 