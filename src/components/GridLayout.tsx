import React, { useState, useRef } from 'react';
import { Edit2, Trash2, GripVertical, X, ArrowUpDown, Download, ChevronDown, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';

export interface GridLayoutProps {
  headers: string[];
  rows: string[][];
  isEditMode?: boolean;
  sortState?: { column: number | null; direction: 'asc' | 'desc' | null };
  onSort?: (columnIndex: number) => void;
  onRemoveRow?: (rowIndex: number) => void;
  onRemoveColumn?: (columnIndex: number) => void;
  onRenameColumn?: (columnIndex: number, newName: string) => void;
  onReorderColumns?: (fromIndex: number, toIndex: number) => void;
  currentPage?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  onEditModeToggle?: () => void;
  onExport?: (format: 'csv' | 'json') => void;
  onShowAuditLogs?: () => void;
  onShowDeleteEmpty?: () => void;
  onShowFormatDates?: () => void;
  fileName?: string;
  error?: string;
  rawData?: { rows: string[][] };
  selectedHeaderRow?: number;
  onSetHeaderRow?: (headerRowIndex: number) => void;
  showHeaderMenu?: boolean;
  onToggleHeaderMenu?: () => void;
  headerMenuRef?: React.RefObject<HTMLDivElement>;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  headers,
  rows,
  isEditMode = false,
  sortState,
  onSort,
  onRemoveRow,
  onRemoveColumn,
  onRenameColumn,
  onReorderColumns,
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
  rawData,
  selectedHeaderRow,
  onSetHeaderRow,
  showHeaderMenu,
  onToggleHeaderMenu,
  headerMenuRef,
}) => {
  // Local state for editing
  const [editingHeader, setEditingHeader] = useState<{ index: number; value: string } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Calculate pagination
  const totalRows = rows.length;
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(totalRows / rowsPerPage);
  const paginatedRows = rowsPerPage === -1
    ? rows
    : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Handle header editing
  const handleHeaderEdit = (index: number) => {
    setEditingHeader({ index, value: headers[index] });
  };

  const saveHeaderEdit = () => {
    if (!editingHeader || !onRenameColumn) return;
    onRenameColumn(editingHeader.index, editingHeader.value);
    setEditingHeader(null);
  };

  const cancelHeaderEdit = () => {
    setEditingHeader(null);
  };

  // Handle column drag and drop
  const handleColumnDragStart = (index: number) => {
    if (!isEditMode) return;
    setDraggedColumn(index);
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isEditMode || draggedColumn === null) return;
    setDragOverColumn(index);
  };

  const handleColumnDragEnd = () => {
    if (draggedColumn !== null && dragOverColumn !== null && draggedColumn !== dragOverColumn && onReorderColumns) {
      onReorderColumns(draggedColumn, dragOverColumn);
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Handle column deletion
  const handleRemoveColumn = (index: number) => {
    if (onRemoveColumn) {
      onRemoveColumn(index);
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          {fileName && (
            <div className="flex items-center text-sm text-gray-400 mr-4">
              <FileText className="w-4 h-4 mr-1" />
              <span>{fileName}</span>
            </div>
          )}
          {rawData && rawData.rows.length > 0 && (
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={onToggleHeaderMenu}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none transition-all duration-200 hover:scale-105"
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                Set Header Row
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {showHeaderMenu && (
                <div className="absolute left-0 mt-1 w-48 rounded-none shadow-lg bg-gray-900 ring-1 ring-gray-700 z-50">
                  <div className="py-1" role="menu">
                    {rawData.rows.slice(0, 10).map((row, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onSetHeaderRow && onSetHeaderRow(index);
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
          <button
            onClick={onEditModeToggle}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-none transition-all duration-200 hover:scale-105 ${
              isEditMode
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {isEditMode ? 'Exit Edit Mode' : 'Edit Grid'}
          </button>
          <button
            onClick={onShowDeleteEmpty}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none transition-all duration-200 hover:scale-105"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Empty Values
          </button>
          <button
            onClick={onShowFormatDates}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none transition-all duration-200 hover:scale-105"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Format Dates
          </button>
          <button
            onClick={onShowAuditLogs}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none transition-all duration-200 hover:scale-105"
          >
            <Clock className="w-4 h-4 mr-1" />
            Audit Logs
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-none transition-all duration-200 hover:scale-105"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute left-0 mt-1 w-48 rounded-none shadow-lg bg-gray-900 ring-1 ring-gray-700 z-50">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => {
                      onExport && onExport('csv');
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
                      onExport && onExport('json');
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
        {error && (
          <div className="flex items-center text-red-400">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
      
      {/* Data Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              {isEditMode && (
                <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only">Delete</span>
                </th>
              )}
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider relative group bg-gray-800 border-b border-gray-600 border-r border-gray-600 last:border-r-0 ${
                    draggedColumn === index ? 'opacity-50' : ''
                  } ${dragOverColumn === index ? 'border-l-2 border-blue-500' : ''}`}
                  draggable={isEditMode}
                  onDragStart={() => handleColumnDragStart(index)}
                  onDragOver={(e) => handleColumnDragOver(e, index)}
                  onDragEnd={handleColumnDragEnd}
                  style={{ 
                    minWidth: '150px',
                    cursor: isEditMode ? 'move' : 'default'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isEditMode && (
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    )}
                    {onSort && (
                      <button
                        onClick={() => onSort(index)}
                        className={`p-1 hover:bg-gray-700 rounded-none ${
                          sortState?.column === index ? 'text-blue-400' : 'text-gray-400'
                        }`}
                        title="Sort"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    )}
                    {editingHeader?.index === index ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingHeader.value}
                          onChange={(e) => setEditingHeader({ ...editingHeader, value: e.target.value })}
                          onBlur={saveHeaderEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveHeaderEdit();
                            } else if (e.key === 'Escape') {
                              cancelHeaderEdit();
                            }
                          }}
                                                                className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                          autoFocus
                        />
                        <button
                          onClick={saveHeaderEdit}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Save"
                        >
                          <span role="img" aria-label="save">✓</span>
                        </button>
                        <button
                          onClick={cancelHeaderEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="truncate font-medium">
                          {header.trim() ? header : 'Empty Header'}
                        </span>
                        {isEditMode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleHeaderEdit(index)}
                              className="p-1 text-gray-400 hover:text-gray-200"
                              title="Edit column name"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveColumn(index)}
                              className="p-1 text-gray-400 hover:text-red-400"
                              title="Delete column"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group">
                {isEditMode && (
                  <td className="w-10 px-2">
                    <button
                      onClick={() => onRemoveRow && onRemoveRow((currentPage - 1) * rowsPerPage + rowIndex)}
                      className="p-1 hover:bg-gray-800 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                    </button>
                  </td>
                )}
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 border-r border-gray-700 last:border-r-0"
                    style={{ 
                      minWidth: '150px'
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
      
      {/* Pagination Footer */}
      <div className="border-t border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-300">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange && onRowsPerPageChange(Number(e.target.value))}
            className="rounded border-gray-600 text-sm bg-gray-700 text-gray-100"
          >
            {[5, 10, 25, 50, 100].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
            <option value={-1}>All</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center rounded border border-gray-600 bg-gray-700 px-2 py-2 text-sm font-medium text-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'<'}
            </button>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center rounded border border-gray-600 bg-gray-700 px-2 py-2 text-sm font-medium text-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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