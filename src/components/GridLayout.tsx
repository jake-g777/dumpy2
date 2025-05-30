import React from 'react';

export interface GridLayoutProps {
  headers: string[];
  rows: string[][];
  isEditMode?: boolean;
  sortState?: { column: number | null; direction: 'asc' | 'desc' | null };
  onSort?: (columnIndex: number) => void;
  onRemoveRow?: (rowIndex: number) => void;
  currentPage?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  onEditModeToggle?: () => void;
  onExport?: () => void;
  onShowAuditLogs?: () => void;
  onShowDeleteEmpty?: () => void;
  onShowFormatDates?: () => void;
  fileName?: string;
  error?: string;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  headers,
  rows,
  isEditMode = false,
  sortState,
  onSort,
  onRemoveRow,
  currentPage = 1,
  rowsPerPage = 25,
  onPageChange,
  onRowsPerPageChange,
  onEditModeToggle,
  onExport,
  onShowAuditLogs,
  onShowDeleteEmpty,
  onShowFormatDates,
  fileName,
  error,
}) => {
  // Calculate pagination
  const totalRows = rows.length;
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(totalRows / rowsPerPage);
  const paginatedRows = rowsPerPage === -1
    ? rows
    : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          {fileName && (
            <div className="flex items-center text-sm text-gray-600 mr-4">
              <span role="img" aria-label="file" className="mr-1">📄</span>
              <span>{fileName}</span>
            </div>
          )}
          <button
            onClick={onEditModeToggle}
            className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
              isEditMode
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md scale-105'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent hover:border-blue-500'
            }`}
          >
            <span role="img" aria-label="edit" className="mr-1">✏️</span>
            {isEditMode ? 'Exit Edit Mode' : 'Edit Grid'}
          </button>
          <button
            onClick={onShowDeleteEmpty}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span role="img" aria-label="delete-empty" className="mr-1">🗑️</span>
            Delete Empty Values
          </button>
          <button
            onClick={onShowFormatDates}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span role="img" aria-label="calendar" className="mr-1">📅</span>
            Format Dates
          </button>
          <button
            onClick={onShowAuditLogs}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span role="img" aria-label="audit" className="mr-1">🕑</span>
            Audit Logs
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span role="img" aria-label="export" className="mr-1">⬇️</span>
            Export
          </button>
        </div>
        {error && (
          <div className="flex items-center text-red-600">
            <span role="img" aria-label="error" className="mr-1">⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
      {/* Data Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {isEditMode && <th className="w-10 px-2">Delete</th>}
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    {onSort && (
                      <button
                        onClick={() => onSort(index)}
                        className={`p-1 hover:bg-gray-200 rounded ${sortState?.column === index ? 'text-blue-600' : 'text-gray-500'}`}
                        title="Sort"
                      >
                        <span>⇅</span>
                      </button>
                    )}
                    <span>{header.trim() ? header : 'Empty Header'}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group">
                {isEditMode && (
                  <td className="w-10 px-2">
                    <button
                      onClick={() => onRemoveRow && onRemoveRow((currentPage - 1) * rowsPerPage + rowIndex)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Delete row"
                    >
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </td>
                )}
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 last:border-r-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-700">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange && onRowsPerPageChange(Number(e.target.value))}
            className="rounded border-gray-300 text-sm"
          >
            {[5, 10, 25, 50, 100].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
            <option value={-1}>All</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'<'}
            </button>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridLayout; 