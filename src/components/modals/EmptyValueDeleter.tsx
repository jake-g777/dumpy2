import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface EmptyValueDeleterProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { name: string; type: string }[];
  selectedColumn: string;
  onColumnSelect: (columnName: string) => void;
  previewData?: { headers: string[]; rows: string[][] };
  onDelete: (rowIndices: number[]) => void;
}

const EmptyValueDeleter: React.FC<EmptyValueDeleterProps> = ({
  isOpen,
  onClose,
  columns,
  selectedColumn,
  onColumnSelect,
  previewData,
  onDelete
}) => {
  console.log('EmptyValueDeleter props:', {
    isOpen,
    selectedColumn,
    columnsCount: columns.length,
    hasPreviewData: !!previewData
  });
  
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [emptyRows, setEmptyRows] = useState<Array<{
    rowIndex: number;
    row: string[];
  }>>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState<{
    success: boolean;
    message: string;
    rowsDeleted: number;
  } | null>(null);

  // Find empty rows when column selection changes
  useEffect(() => {
    console.log('EmptyValueDeleter useEffect - column selection changed:', {
      selectedColumn,
      hasPreviewData: !!previewData,
      emptyRowsCount: emptyRows.length
    });
    
    if (!previewData || !selectedColumn) {
      setEmptyRows([]);
      setSelectedRows(new Set());
      return;
    }

    const columnIndex = previewData.headers.findIndex(header => header === selectedColumn);
    if (columnIndex === -1) return;

    const empty = previewData.rows
      .map((row, index) => ({ rowIndex: index, row }))
      .filter(({ row }) => !row[columnIndex] || row[columnIndex].trim() === '');

    setEmptyRows(empty);
    setSelectedRows(new Set());
  }, [previewData, selectedColumn]);

  const handleSelectAll = () => {
    if (selectedRows.size === emptyRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(emptyRows.map(row => row.rowIndex)));
    }
  };

  const handleSelectRow = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedRows));
      setDeletionResult({
        success: true,
        message: `Successfully deleted ${selectedRows.size} rows`,
        rowsDeleted: selectedRows.size
      });

      // Close the modal after successful deletion
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setDeletionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete rows',
        rowsDeleted: 0
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    console.log('EmptyValueDeleter useEffect - modal state changed:', {
      isOpen,
      selectedRowsCount: selectedRows.size,
      hasDeletionResult: !!deletionResult
    });
    
    if (isOpen) {
      setSelectedRows(new Set());
      setDeletionResult(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log('EmptyValueDeleter returning null - modal is closed');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Delete Empty Values</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
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

          {emptyRows.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Found {emptyRows.length} rows with empty values
                </h4>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === emptyRows.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Select All</span>
                  </label>
                  <button
                    onClick={handleDelete}
                    disabled={selectedRows.size === 0 || isDeleting}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium text-white rounded-md ${
                      selectedRows.size === 0 || isDeleting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete Selected ({selectedRows.size})
                  </button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === emptyRows.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      {previewData?.headers.map((header, index) => (
                        <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emptyRows.map(({ rowIndex, row }) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowIndex)}
                            onChange={() => handleSelectRow(rowIndex)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {emptyRows.length === 0 && selectedColumn && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                No empty values found in the selected column.
              </p>
            </div>
          )}

          {/* Deletion Result */}
          {deletionResult && (
            <div className={`p-4 rounded-lg ${
              deletionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center">
                {deletionResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span>{deletionResult.message}</span>
              </div>
              {deletionResult.success && (
                <div className="mt-2 text-sm">
                  <p>Rows deleted: {deletionResult.rowsDeleted}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyValueDeleter; 