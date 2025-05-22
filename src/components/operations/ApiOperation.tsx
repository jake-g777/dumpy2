import React from 'react';
import { Server } from 'lucide-react';

interface ApiOperationProps {
  onOpen: () => void;
}

const ApiOperation: React.FC<ApiOperationProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Server className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-900">Send to API</span>
      </div>
      <p className="text-sm text-gray-600 text-left">
        Send the data to a specified API endpoint
      </p>
    </button>
  );
};

export default ApiOperation; 