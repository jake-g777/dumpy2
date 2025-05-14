import React, { useState } from 'react';
import JsonInput from './JsonInput';
import JsonViewer from './JsonViewer';
import CodeGenerator from './CodeGenerator';
import { useTheme } from '../context/ThemeContext';
import { validateJson } from '../utils/jsonUtils';
import { JsonData, SelectedNode, TreeNodeState } from '../types';

const JsonProcessor: React.FC = () => {
  const { theme } = useTheme();
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [ignoredNodes, setIgnoredNodes] = useState<Set<string>>(new Set());
  
  const handleJsonInput = (input: string) => {
    try {
      setErrorMessage(null);
      const result = validateJson(input);
      setJsonData(result);
      setIgnoredNodes(new Set());
    } catch (error) {
      setJsonData(null);
      setErrorMessage((error as Error).message);
    }
  };
  
  const handleNodeSelect = (node: SelectedNode) => {
    setSelectedNode(node);
  };

  const handleNodeIgnore = (path: (string | number)[]) => {
    const pathString = path.join('.');
    const newIgnoredNodes = new Set(ignoredNodes);
    
    if (newIgnoredNodes.has(pathString)) {
      newIgnoredNodes.delete(pathString);
    } else {
      newIgnoredNodes.add(pathString);
    }
    
    setIgnoredNodes(newIgnoredNodes);
  };
  
  return (
    <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`}>
      <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <JsonInput onJsonInput={handleJsonInput} />
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
            <p className="text-sm font-medium">Error parsing JSON:</p>
            <p className="mt-1 text-sm font-mono whitespace-pre-wrap">{errorMessage}</p>
          </div>
        )}
      </div>
      
      {jsonData && (
        <div className="grid md:grid-cols-2 gap-0 border-t border-gray-200 dark:border-gray-700">
          <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}`}>
            <h2 className="text-lg font-medium mb-3">JSON Structure</h2>
            <JsonViewer 
              data={jsonData} 
              onNodeSelect={handleNodeSelect}
              onNodeIgnore={handleNodeIgnore}
              ignoredNodes={ignoredNodes}
              selectedPath={selectedNode?.path || []}
            />
          </div>
          
          <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-medium mb-3">Generated Class</h2>
            <CodeGenerator 
              selectedNode={selectedNode}
              ignoredNodes={ignoredNodes}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonProcessor