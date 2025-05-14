import React, { useState, useEffect } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SelectedNode } from '../types';
import { generateTypeScript, generateCSharp, generateJava } from '../utils/codeGenerator';

interface CodeGeneratorProps {
  selectedNode: SelectedNode | null;
  ignoredNodes: Set<string>;
}

type Language = 'typescript' | 'csharp' | 'java';

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ selectedNode, ignoredNodes }) => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState<Language>('typescript');
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!selectedNode) {
      setCode('// Select a node in the JSON tree to generate code');
      return;
    }
    
    if (typeof selectedNode.value !== 'object' || selectedNode.value === null) {
      setCode('// Select an object or array node to generate a class');
      return;
    }
    
    generateCode(selectedNode, language);
  }, [selectedNode, language, ignoredNodes]);
  
  const generateCode = (node: SelectedNode, lang: Language) => {
    switch (lang) {
      case 'typescript':
        setCode(generateTypeScript(node, ignoredNodes));
        break;
      case 'csharp':
        setCode(generateCSharp(node, ignoredNodes));
        break;
      case 'java':
        setCode(generateJava(node, ignoredNodes));
        break;
    }
  };
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setLanguage('typescript')}
            className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
              language === 'typescript'
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setLanguage('csharp')}
            className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
              language === 'csharp'
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            C#
          </button>
          <button
            onClick={() => setLanguage('java')}
            className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
              language === 'java'
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Java
          </button>
        </div>
        
        {code && code !== '// Select a node in the JSON tree to generate code' && 
         code !== '// Select an object or array node to generate a class' && (
          <button
            onClick={copyCode}
            className={`
              flex items-center px-2 py-1 text-sm rounded-md transition-colors duration-200 
              ${theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }
            `}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-1 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <div 
        className={`p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[calc(100vh-360px)] ${
          theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {!selectedNode ? (
          <div className="flex flex-col items-center justify-center text-center h-40 text-gray-500">
            <Code size={40} className="mb-3 opacity-50" />
            <p>Select a node in the JSON tree<br/>to generate code</p>
          </div>
        ) : code ? (
          code
        ) : (
          <div className="text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default CodeGenerator