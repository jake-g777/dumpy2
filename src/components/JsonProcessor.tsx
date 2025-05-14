import React from 'react';
import { FileUp, Globe } from 'lucide-react';

const JsonProcessor: React.FC = () => {
  return (
    <div>
      <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Dumpy</h2>
          <p className="mt-2 text-gray-600">Version 1.0</p>
          
          <div className="mt-8 space-y-4">
            <button className="w-64 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors">
              <FileUp size={20} />
              <span>New File Import</span>
            </button>
            
            <button className="w-64 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors">
              <Globe size={20} />
              <span>New API Import</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonProcessor;