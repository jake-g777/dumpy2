import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface DataGridProps {
  headers: string[];
  data: string[][];
  isLoading?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ headers, data, isLoading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [columnWidths, setColumnWidths] = useState<number[]>(headers.map(() => 150));
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn === null) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);

      setColumnWidths(prev => {
        const newWidths = [...prev];
        newWidths[resizingColumn] = newWidth;
        return newWidths;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, startX, startWidth]);

  const handleResizeStart = (columnIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnIndex);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnIndex]);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-gray-200 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="h-full w-full bg-white">
      <div className="h-full w-full flex flex-col">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap relative group border-r-2 border-gray-600"
                    style={{ width: columnWidths[index] }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{header}</span>
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 group-hover:bg-blue-500 transition-colors"
                           onMouseDown={(e) => handleResizeStart(index, e)}>
                        <GripVertical className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r-2 border-gray-600"
                      style={{ width: columnWidths[cellIndex] }}
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
    </div>
  );
};

export default DataGrid; 