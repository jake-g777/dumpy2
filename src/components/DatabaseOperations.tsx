import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import DatabaseModal from './DatabaseModal';

interface DatabaseOperationsProps {
  parsedData: {
    headers: string[];
    rows: string[][];
  } | null;
  onGenerateSql: (databaseType: string, tableName: string, columns: any[]) => void;
  onInsert: (databaseId: string, tableId: string) => Promise<void>;
}

const DatabaseOperations: React.FC<DatabaseOperationsProps> = ({
  parsedData,
  onGenerateSql,
  onInsert
}) => {
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Database Operations</h2>
      <button
        onClick={() => setShowDatabaseModal(true)}
        className="w-full p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
      >
        Configure Database
      </button>

      <DatabaseModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onInsert={onInsert}
        onGenerateSql={onGenerateSql}
        parsedData={parsedData}
      />
    </div>
  );
};

export default DatabaseOperations;