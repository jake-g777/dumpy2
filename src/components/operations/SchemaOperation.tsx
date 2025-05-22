import React from 'react';
import { Table } from 'lucide-react';

interface SchemaOperationProps {
  onOpen: () => void;
}

const SchemaOperation: React.FC<SchemaOperationProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Table className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-900">Table Schema</span>
      </div>
      <p className="text-sm text-gray-600 text-left">
        View and export table schema definitions
      </p>
    </button>
  );
};

export default SchemaOperation; 