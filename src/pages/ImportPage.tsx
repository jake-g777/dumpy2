import React from 'react';
import FileImport from '../components/FileImport';

const ImportPage: React.FC = () => {
  const handleFileSelect = (file: File) => {
    // Handle the selected file here
    console.log('Selected file:', file.name);
    // You can add your file processing logic here
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Import File</h1>
      <FileImport onFileSelect={handleFileSelect} />
    </div>
  );
};

export default ImportPage; 