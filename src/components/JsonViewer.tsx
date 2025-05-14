import React, { useState } from 'react';
import TreeNode from './TreeNode';
import { JsonData, SelectedNode } from '../types';
import { getDisplayValue } from '../utils/jsonUtils';

interface JsonViewerProps {
  data: JsonData;
  onNodeSelect: (node: SelectedNode) => void;
  onNodeIgnore: (path: (string | number)[]) => void;
  ignoredNodes: Set<string>;
  selectedPath: (string | number)[];
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  onNodeSelect, 
  onNodeIgnore,
  ignoredNodes,
  selectedPath 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  
  const toggleNode = (nodePath: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodePath)) {
      newExpandedNodes.delete(nodePath);
    } else {
      newExpandedNodes.add(nodePath);
    }
    setExpandedNodes(newExpandedNodes);
  };
  
  const handleNodeSelect = (path: (string | number)[], value: any, key: string) => {
    onNodeSelect({
      path,
      value,
      key,
      displayValue: getDisplayValue(value),
      type: typeof value,
      isArray: Array.isArray(value),
      isObject: value !== null && typeof value === 'object' && !Array.isArray(value)
    });
  };
  
  const isPathEqual = (path1: (string | number)[], path2: (string | number)[]) => {
    if (path1.length !== path2.length) return false;
    return path1.every((segment, index) => segment === path2[index]);
  };
  
  return (
    <div className="overflow-auto max-h-[calc(100vh-320px)] font-mono text-sm">
      <TreeNode
        nodeKey="root"
        nodeName="root"
        value={data}
        path={['root']}
        level={0}
        isExpanded={expandedNodes.has('root')}
        onToggle={() => toggleNode('root')}
        onSelect={handleNodeSelect}
        onIgnore={onNodeIgnore}
        isSelected={isPathEqual(['root'], selectedPath)}
        isIgnored={ignoredNodes.has('root')}
        expandedNodes={expandedNodes}
        toggleNode={toggleNode}
        selectedPath={selectedPath}
        ignoredNodes={ignoredNodes}
      />
    </div>
  );
};

export default JsonViewer