import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Home, Database, Link2, Settings, ChevronDown, ChevronRight, FileUp, Globe, GitBranch, Search, Filter, RefreshCw, Sun, Moon, Github, Twitter, Linkedin, HelpCircle, Wrench, ChevronLeft } from 'lucide-react';
import { X as CloseIcon } from 'lucide-react';
import DataImporter from './DataImporter';
import DatabaseConnections from './DatabaseConnections';
import { DatabaseConnection } from './DatabaseConnections';

interface DashboardLayoutProps {
  // Remove the children requirement
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectName: string, type: 'file' | 'api' | 'database', file?: File, description?: string, pipelineId?: string) => void;
  isDarkMode: boolean;
  editingPipeline?: Pipeline;
}

interface DataImporterProps {
  pipeline?: Pipeline;
  onBack: () => void;
  initialData: {
    parsedData?: any;
    rawData?: any;
    originalJsonData?: any;
    availablePaths?: string[];
    selectedPath?: string | null;
  };
  initialFile?: File | undefined;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: 'file' | 'api' | 'database';
  createdAt: Date;
  lastRun?: Date;
  fileName?: string;
  createdBy: string;
  data?: {
    parsedData: ParsedData | null;
    rawData: RawFileData | null;
    originalJsonData: any;
    availablePaths: JsonPath[];
    selectedPath: JsonPath | null;
  };
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface RawFileData {
  rows: string[][];
}

interface JsonPath {
  path: string[];
  type: 'object' | 'array';
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit, isDarkMode, editingPipeline }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<'file' | 'api' | 'database'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or editingPipeline changes
  useEffect(() => {
    if (isOpen && editingPipeline) {
      setProjectName(editingPipeline.name);
      setDescription(editingPipeline.description);
      setSelectedType(editingPipeline.type);
    } else if (!isOpen) {
      setProjectName('');
      setDescription('');
      setSelectedFile(null);
      setSelectedType('file');
    }
  }, [isOpen, editingPipeline]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedType === 'file' && !selectedFile && !editingPipeline) {
      return; // Don't submit if file is required but not selected (only for new pipelines)
    }
    // Use file name if project name is empty, otherwise use project name
    const finalProjectName = projectName.trim() || (selectedFile ? selectedFile.name : 'Untitled Project');
    onSubmit(finalProjectName, selectedType, selectedFile || undefined, description.trim(), editingPipeline?.id);
    setProjectName('');
    setDescription('');
    setSelectedFile(null);
    setSelectedType('file');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-lg p-6 w-[500px]`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Pipeline</h2>
          <button onClick={onClose} className={`p-1 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full`}>
            <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Import Type Selection */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Import Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedType('file')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedType === 'file'
                    ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : isDarkMode 
                      ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileUp size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">File Import</span>
              </button>
              <button
                onClick={() => setSelectedType('api')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedType === 'api'
                    ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : isDarkMode 
                      ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">API Import</span>
              </button>
              <button
                onClick={() => setSelectedType('database')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedType === 'database'
                    ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : isDarkMode 
                      ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Database size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">Database Import</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="projectName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Pipeline Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter pipeline name"
              autoFocus
            />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              {selectedType === 'file' && "If left blank, the file name will be used as the pipeline name"}
              {selectedType === 'api' && "Enter a name for your API pipeline"}
              {selectedType === 'database' && "Enter a name for your database pipeline"}
            </p>
          </div>

          <div>
            <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter a description for your pipeline"
              rows={3}
            />
          </div>

          {selectedType === 'file' && (
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Select File
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  ${selectedFile 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : isDarkMode 
                      ? 'border-gray-700 hover:border-gray-600 text-gray-400' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-500'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".csv,.txt,.json,.xlsx,.xls"
                />
                {selectedFile ? (
                  <div className="text-green-700 flex items-center justify-center gap-2">
                    <FileUp size={20} />
                    <span>{selectedFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <FileUp size={24} className="mx-auto mb-2" />
                    <p>Click to select or drag and drop</p>
                    <p className="text-sm">.csv, .txt, .json, .xlsx, .xls</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedType === 'api' && (
            <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                API import configuration will be available in the next step.
              </p>
            </div>
          )}

          {selectedType === 'database' && (
            <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Database connection configuration will be available in the next step.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!projectName.trim() || (selectedType === 'file' && !selectedFile)}
            className="px-4 py-2 bg-cyan-400 text-white rounded-md hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isActiveJobsOpen, setIsActiveJobsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | undefined>();
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<{ name: string; icon: React.ReactNode; breadcrumb?: string[] }>({ 
    name: 'Home', 
    icon: <Home size={14} />
  });
  const [subscriptionType] = useState('Pro'); // This would come from your auth/subscription system
  const [selectedPipelineData, setSelectedPipelineData] = useState<{
    parsedData: ParsedData | null;
    rawData: RawFileData | null;
    originalJsonData: any;
    availablePaths: JsonPath[];
    selectedPath: JsonPath | null;
  }>({
    parsedData: null,
    rawData: null,
    originalJsonData: null,
    availablePaths: [],
    selectedPath: null
  });
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  const handleCreateProject = (projectName: string, type: 'file' | 'api' | 'database', file?: File, description?: string, pipelineId?: string) => {
    const finalProjectName = projectName.trim() || (file ? file.name : 'Untitled Project');
    
    if (pipelineId) {
      // Update existing pipeline
      setPipelines(prev => prev.map(p => 
        p.id === pipelineId 
          ? { ...p, name: finalProjectName, description: description || '', type, fileName: file?.name }
          : p
      ));
    } else {
      // Create new pipeline
      const newPipeline: Pipeline = {
        id: Math.random().toString(36).substr(2, 9),
        name: finalProjectName,
        description: description || '',
        type,
        createdAt: new Date(),
        fileName: file?.name,
        createdBy: 'Jake Gerold' // This would come from your auth system
      };
      setPipelines(prev => [...prev, newPipeline]);
    }
    
    setIsModalOpen(false);
    setEditingPipeline(undefined);
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setIsModalOpen(true);
  };

  const handleDatabaseConnection = (connection: DatabaseConnection) => {
    console.log('Connected to database:', connection);
  };

  const handleConfigurePipeline = (pipeline: Pipeline) => {
    setSelectedDrawerItem({
      name: 'DataImporter',
      icon: <FileUp size={14} />,
      breadcrumb: [pipeline.name]
    });
    setSelectedPipeline(pipeline);
    setSelectedPipelineData({
      parsedData: pipeline.data?.parsedData || null,
      rawData: pipeline.data?.rawData || null,
      originalJsonData: pipeline.data?.originalJsonData || null,
      availablePaths: pipeline.data?.availablePaths || [],
      selectedPath: pipeline.data?.selectedPath || null
    });
  };

  const renderContent = () => {
    switch (selectedDrawerItem?.name) {
      case 'Home':
        return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to Dumpy</h2>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Version 1.0</p>
              
              <div className="mt-8">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Get started by creating a new pipeline using the button in the navigation bar above.
                </p>
              </div>

              <div className="mt-12">
                <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  New Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
                    <FileUp size={24} className="text-cyan-400 mb-2" />
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>File Import</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                      Import data from CSV, TXT, JSON, or Excel files
                    </p>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
                    <Globe size={24} className="text-cyan-400 mb-2" />
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>API Import</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                      Import data directly from REST APIs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Pipelines':
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className={`rounded-lg border ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                {pipelines.length === 0 ? (
                  // Empty State
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <GitBranch size={24} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-1`}>
                      No pipelines yet
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                      Create your first pipeline to get started
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-cyan-400 hover:bg-cyan-500 rounded-md transition-colors"
                    >
                      <GitBranch size={16} className="mr-2" />
                      Create Pipeline
                    </button>
                  </div>
                ) : (
                  // Pipeline List
                  <div className="divide-y divide-gray-200">
                    {pipelines.map((pipeline) => (
                      <div className="flex items-center group">
                        <div key={pipeline.id} className={`flex-1 px-4 py-3 transition-colors border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="min-w-[100px]">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-2.5 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <GitBranch size={24} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                  </div>
                                  <div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} truncate block`}>
                                      {pipeline.name}
                                    </span>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate mt-0.5`}>
                                      {pipeline.description || '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                pipeline.type === 'file' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : pipeline.type === 'api'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {pipeline.type === 'file' 
                                  ? 'File Import'
                                  : pipeline.type === 'api'
                                  ? 'API Import'
                                  : 'Database Import'}
                              </span>

                              {pipeline.type === 'file' && pipeline.fileName ? (
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate flex items-center min-w-[200px]`}>
                                  <FileUp size={14} className="mr-1.5" />
                                  {pipeline.fileName}
                                </p>
                              ) : (
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} min-w-[200px]`}>-</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-6">
                              <div className="min-w-[150px] text-right">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Created {pipeline.createdAt.toLocaleDateString()}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  by {pipeline.createdBy}
                                </p>
                              </div>

                              <button 
                                onClick={() => handleConfigurePipeline(pipeline)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${isDarkMode ? 'bg-cyan-900/50 text-cyan-400 hover:bg-cyan-900/70' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}
                                title="Configure Pipeline"
                              >
                                <Wrench size={14} />
                                <span className="text-sm">Configure</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons outside the container */}
                        <div className="flex flex-col space-y-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditPipeline(pipeline)}
                            className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={() => setPipelines(prev => prev.filter(p => p.id !== pipeline.id))}
                            className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'DataImporter':
        return (
          <DataImporter
            onFileSelect={(fileName) => {
              // Update the pipeline with the new file name
              setPipelines(prev => prev.map(p => 
                p.id === selectedPipeline?.id 
                  ? { ...p, fileName } 
                  : p
              ));
            }}
            onDataChange={(data) => {
              // Update the pipeline with the new data
              setPipelines(prev => prev.map(p => 
                p.id === selectedPipeline?.id 
                  ? { 
                      ...p, 
                      data: {
                        parsedData: data.parsedData,
                        rawData: data.rawData,
                        originalJsonData: data.originalJsonData,
                        availablePaths: data.availablePaths,
                        selectedPath: data.selectedPath
                      }
                    } 
                  : p
              ));
            }}
            initialData={selectedPipelineData}
            initialFile={selectedPipeline?.fileName ? new File([], selectedPipeline.fileName) : undefined}
            pipeline={selectedPipeline || undefined}
            onBack={() => {
              setSelectedDrawerItem({ name: 'Pipelines', icon: <GitBranch size={14} />, breadcrumb: [] });
              setSelectedPipeline(null);
              setSelectedPipelineData({
                parsedData: null,
                rawData: null,
                originalJsonData: null,
                availablePaths: [],
                selectedPath: null
              });
            }}
          />
        );
      case 'Active Jobs':
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Jobs</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-gray-600">No active jobs</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Database Connections':
        return (
          <div className="flex-1 overflow-auto bg-gray-50">
            <DatabaseConnections onConnect={handleDatabaseConnection} />
          </div>
        );
      case 'API Connections':
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Connections</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-gray-600">No API connections configured</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-gray-600">Settings content will go here</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Support':
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Support</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-gray-600">Support content will go here</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Top Nav Bar */}
      <div className={`fixed top-0 left-0 right-0 h-12 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b z-40 flex items-center px-4 justify-between`}>
        <div className="flex items-center space-x-4">
          <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center space-x-2`}>
            <span className={`${isDarkMode ? 'bg-gray-800' : 'bg-black'} text-white px-1 py-0.5 rounded text-sm`}>d</span>
            <span>dumpy</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
            {selectedDrawerItem.icon}
            {selectedDrawerItem.breadcrumb ? (
              <div className="flex items-center space-x-1">
                {selectedDrawerItem.breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <span>{item}</span>
                    {index < selectedDrawerItem.breadcrumb!.length - 1 && (
                      <ChevronRight size={14} className="mx-1" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <span>{selectedDrawerItem.name}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex mt-12">
        {/* Slim Drawer */}
        <div 
          className={`fixed inset-y-0 left-0 transform ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r w-12 transition-transform duration-200 ease-in-out z-30 mt-12`}
        >
          <div className="h-[calc(100vh-3.2rem)] flex flex-col justify-between">
            {/* Drawer Content */}
            <nav className="py-2 space-y-1">
              {/* Main Navigation */}
              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Home', icon: <Home size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Home"
              >
                <Home size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Home
                </span>
              </button>

              <div className="flex justify-center">
                <div className={`h-px w-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} my-2`}></div>
              </div>

              {/* Monitoring */}
              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Pipelines', icon: <GitBranch size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Pipelines"
              >
                <GitBranch size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Pipelines
                </span>
              </button>

              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Active Jobs', icon: <FileUp size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Active Jobs"
              >
                <FileUp size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Active Jobs
                </span>
              </button>

              <div className="flex justify-center">
                <div className={`h-px w-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} my-2`}></div>
              </div>

              {/* Connections */}
              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Database Connections', icon: <Database size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Database Connections"
              >
                <Database size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Database Connections
                </span>
              </button>

              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'API Connections', icon: <Link2 size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="API Connections"
              >
                <Link2 size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  API Connections
                </span>
              </button>
            </nav>

            {/* Settings at bottom */}
            <div className="border-t border-gray-200">
              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Settings', icon: <Settings size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Settings"
              >
                <Settings size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Settings
                </span>
              </button>
              <button 
                onClick={() => {
                  setSelectedDrawerItem({ name: 'Support', icon: <HelpCircle size={14} /> });
                }}
                className={`w-full flex items-center justify-center p-2 ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md cursor-pointer group relative`}
                title="Support"
              >
                <HelpCircle size={16} />
                <span className={`absolute left-full ml-2 px-2 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap`}>
                  Support
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${isDrawerOpen ? 'ml-12' : 'ml-0'} transition-margin duration-200 ease-in-out max-w-[calc(100vw-3rem)]`}>
          {!isDrawerOpen && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className={`fixed top-14 left-0 p-1 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-md m-2 z-20`}
            >
              <Menu size={14} />
            </button>
          )}
          
          {/* Content Area */}
          <div className={`${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'} flex-1 overflow-hidden`}>
            {selectedDrawerItem.name === 'Pipelines' && (
              <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-cyan-400 hover:bg-cyan-500 rounded-md transition-colors"
                  >
                    <GitBranch size={14} />
                    <span>New Pipeline</span>
                  </button>
                  <button 
                    className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md`}
                  >
                    <Filter size={14} />
                    <span>Filter</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search pipelines..."
                      className={`pl-8 pr-4 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <Search size={14} className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                  </div>
                  <button 
                    className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}
            {selectedDrawerItem.name === 'DataImporter' && (
              <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedDrawerItem({ name: 'Pipelines', icon: <GitBranch size={14} />, breadcrumb: [] })}
                    className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium ${isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} rounded-md`}
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Pipelines</span>
                  </button>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`h-6 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t flex items-center justify-between px-4 text-[10px] ${isDrawerOpen ? 'ml-12' : 'ml-0'} transition-margin duration-200 ease-in-out`}>
        <div className="flex items-center space-x-3">
          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {subscriptionType} Plan
          </span>
          <div className={`h-2.5 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Version 1.0.0
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <Github size={12} />
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <Twitter size={12} />
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <Linkedin size={12} />
          </a>
        </div>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPipeline(undefined);
        }}
        onSubmit={handleCreateProject}
        isDarkMode={isDarkMode}
        editingPipeline={editingPipeline}
      />
    </div>
  );
};

export default DashboardLayout;