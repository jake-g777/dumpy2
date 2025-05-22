import React from 'react';
import { Database } from 'lucide-react';

interface DatabaseOperationProps {
  onOpen: () => void;
}

const DatabaseOperation: React.FC<DatabaseOperationProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Database className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-900">Database Operations</span>
      </div>
      <p className="text-sm text-gray-600 text-left">
        Create or update database tables and insert data
      </p>
    </button>
  );
};

export default DatabaseOperation; 