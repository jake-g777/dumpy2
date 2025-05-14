import React, { useState, useRef } from 'react';
import { FileUp, Clipboard, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface JsonInputProps {
  onJsonInput: (json: string) => void;
}

const JsonInput: React.FC<JsonInputProps> = ({ onJsonInput }) => {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please upload a JSON file');
      return;
    }
    
    try {
      const text = await file.text();
      setJsonText(text);
      onJsonInput(text);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    if (text.trim()) {
      onJsonInput(text);
    }
  };
  
  const handleClearText = () => {
    setJsonText('');
  };
  
  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonText(text);
        onJsonInput(text);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };
  
  return (
    <div>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative p-4 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : theme === 'dark' 
              ? 'border-gray-600 hover:border-gray-500' 
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex items-center px-4 py-2 rounded-md mr-2 transition-colors duration-200
              ${theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }
            `}
          >
            <FileUp size={18} className="mr-2" />
            Upload JSON
          </button>
          
          <button
            onClick={handlePasteClick}
            className={`
              flex items-center px-4 py-2 rounded-md transition-colors duration-200
              ${theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }
            `}
          >
            <Clipboard size={18} className="mr-2" />
            Paste from Clipboard
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
        
        <div className="relative">
          <textarea
            value={jsonText}
            onChange={handleTextChange}
            placeholder="Paste your JSON here or drop a JSON file..."
            className={`
              w-full h-40 p-3 rounded-md font-mono text-sm resize-y
              ${theme === 'dark' 
                ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                : 'bg-white text-gray-800 placeholder-gray-400 border border-gray-300'
              }
            `}
          />
          
          {jsonText && (
            <button
              onClick={handleClearText}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Clear text"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonInput;