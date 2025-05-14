import React from 'react';
import { ChevronRight, ChevronDown, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getDisplayValue } from '../utils/jsonUtils';

interface TreeNodeProps {
  nodeKey: string | number;
  nodeName: string | number;
  value: any;
  path: (string | number)[];
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isIgnored: boolean;
  onToggle: () => void;
  onSelect: (path: (string | number)[], value: any, key: string) => void;
  onIgnore: (path: (string | number)[]) => void;
  expandedNodes: Set<string>;
  toggleNode: (nodePath: string) => void;
  selectedPath: (string | number)[];
  ignoredNodes: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  nodeKey,
  nodeName,
  value,
  path,
  level,
  isExpanded,
  isSelected,
  isIgnored,
  onToggle,
  onSelect,
  onIgnore,
  expandedNodes,
  toggleNode,
  selectedPath,
  ignoredNodes
}) => {
  const { theme } = useTheme();
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const displayValue = getDisplayValue(value);
  const pathString = path.join('.');
  
  const indent = level * 16;
  const hasChildren = isObject && Object.keys(value).length > 0;
  const fullPath = [...path];
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(fullPath, value, String(nodeName));
  };

  const handleIgnore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIgnore(fullPath);
  };
  
  const getNodeTypeIndicator = () => {
    if (isArray) return <span className="text-purple-500 dark:text-purple-400">[{Object.keys(value).length}]</span>;
    if (isObject) return <span className="text-blue-500 dark:text-blue-400">{'{ }'}</span>;
    if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400">"{displayValue}"</span>;
    if (typeof value === 'number') return <span className="text-amber-600 dark:text-amber-400">{displayValue}</span>;
    if (typeof value === 'boolean') return <span className="text-red-500 dark:text-red-400">{displayValue.toString()}</span>;
    if (value === null) return <span className="text-gray-500 dark:text-gray-400">null</span>;
    return <span className="text-gray-500 dark:text-gray-400">{displayValue}</span>;
  };
  
  return (
    <div>
      <div 
        className={`
          py-1 px-2 flex items-center rounded-md cursor-pointer transition-colors duration-150 group
          ${isSelected 
            ? theme === 'dark' 
              ? 'bg-blue-900/40 text-blue-200' 
              : 'bg-blue-100 text-blue-800' 
            : theme === 'dark' 
              ? 'hover:bg-gray-700/50' 
              : 'hover:bg-gray-100'
          }
          ${isIgnored ? 'line-through opacity-50' : ''}
        `}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <span 
            className="flex items-center justify-center w-5 h-5 mr-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-5 mr-1"></span>
        )}
        
        <span className={`mr-1 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {nodeName === 'root' ? '' : nodeName}
          {nodeName !== 'root' && isObject ? ': ' : ''}
        </span>
        
        {(!isObject || !isExpanded || nodeName === 'root') && getNodeTypeIndicator()}

        <button
          onClick={handleIgnore}
          className={`
            ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200
            p-1 rounded-full
            ${theme === 'dark' 
              ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }
          `}
          title={isIgnored ? "Include in generation" : "Ignore in generation"}
        >
          <EyeOff size={14} />
        </button>
      </div>
      
      {isExpanded && isObject && (
        <div>
          {Object.entries(value).map(([key, val]) => {
            const childPath = [...fullPath, key];
            const childPathString = childPath.join('.');
            const isChildExpanded = expandedNodes.has(childPathString);
            const isChildSelected = JSON.stringify(childPath) === JSON.stringify(selectedPath);
            const isChildIgnored = ignoredNodes.has(childPathString);
            
            return (
              <TreeNode
                key={`${pathString}-${key}`}
                nodeKey={key}
                nodeName={key}
                value={val}
                path={childPath}
                level={level + 1}
                isExpanded={isChildExpanded}
                isSelected={isChildSelected}
                isIgnored={isChildIgnored}
                onToggle={() => toggleNode(childPathString)}
                onSelect={onSelect}
                onIgnore={onIgnore}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                selectedPath={selectedPath}
                ignoredNodes={ignoredNodes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TreeNode