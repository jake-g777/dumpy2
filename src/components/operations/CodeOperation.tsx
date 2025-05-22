import React from 'react';
import { Code } from 'lucide-react';

interface CodeOperationProps {
  onOpen: () => void;
}

const CodeOperation: React.FC<CodeOperationProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">
          <Code className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-900">Generate Code</span>
      </div>
      <p className="text-sm text-gray-600 text-left">
        Generate class structures and database models
      </p>
    </button>
  );
};

export default CodeOperation; 