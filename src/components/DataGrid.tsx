import React from 'react';

interface DataGridProps {
  headers: string[];
  data: string[][];
  isLoading?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ headers, data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-gray-200 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow">
      <div className="h-full flex flex-col">
        {/* Header - Always visible */}
        <div className="border-b border-gray-200">
          <div className="min-w-full">
            <div className="bg-gray-50">
              <div className="flex">
                {headers.map((header, index) => (
                  <div
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    style={{ minWidth: '150px' }}
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200"
                    style={{ minWidth: '150px' }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataGrid; 