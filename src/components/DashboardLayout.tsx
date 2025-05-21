import React, { useState, useRef } from 'react';
import { Menu, X, Home, Database, Link2, Settings, ChevronDown, ChevronRight, FileUp, Globe } from 'lucide-react';
import { X as CloseIcon } from 'lucide-react';
import DataImporter from './DataImporter';
import DatabaseConnections from './DatabaseConnections';
import { DatabaseConnection } from './DatabaseConnections';

interface DashboardLayoutProps {
  // Remove the children requirement
}

interface Tab {
  id: string;
  title: string;
  type: 'welcome' | 'file-import' | 'api-import' | 'database-connections';
  fileName?: string;
  file?: File;
  data?: {
    parsedData: any;
    rawData: any;
    originalJsonData: any;
    availablePaths: any[];
    selectedPath: any;
  };
}

interface CreateProjectModalProps {
  isOpen: boolean;
  type: 'file' | 'api';
  onClose: () => void;
  onSubmit: (projectName: string, file?: File) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, type, onClose, onSubmit }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (type === 'file' && !selectedFile) {
      return; // Don't submit if file is required but not selected
    }
    // Use file name if project name is empty, otherwise use project name
    const finalProjectName = projectName.trim() || (selectedFile ? selectedFile.name : 'Untitled Project');
    onSubmit(finalProjectName, selectedFile || undefined);
    setProjectName('');
    setSelectedFile(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New {type === 'file' ? 'File Import' : 'API Import'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-1">
              If left blank, the file name will be used as the project name
            </p>
          </div>

          {type === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select File
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
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
                  <div className="text-gray-500">
                    <FileUp size={24} className="mx-auto mb-2" />
                    <p>Click to select or drag and drop</p>
                    <p className="text-sm">.csv, .txt, .json, .xlsx, .xls</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!projectName.trim() || (type === 'file' && !selectedFile)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isActiveJobsOpen, setIsActiveJobsOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'welcome', title: 'Welcome', type: 'welcome' }]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'api'>('file');

  const handleNewFileImport = () => {
    setModalType('file');
    setIsModalOpen(true);
  };

  const handleNewApiImport = () => {
    setModalType('api');
    setIsModalOpen(true);
  };

  const handleCreateProject = (projectName: string, file?: File) => {
    const finalProjectName = projectName.trim() || (file ? file.name : 'Untitled Project');
    const newTab: Tab = {
      id: `${modalType}-import-${Date.now()}`,
      title: finalProjectName,
      type: `${modalType}-import` as 'file-import' | 'api-import',
      fileName: file?.name,
      file: file
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setIsModalOpen(false);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabId === activeTabId) {
      setActiveTabId('welcome'); // Switch to welcome tab when closing active tab
    }
    setTabs(tabs.filter(tab => tab.id !== tabId));
  };

  const updateTabFileName = (tabId: string, fileName: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, title: fileName, fileName }
        : tab
    ));
  };

  const updateTabData = (tabId: string, data: any) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, data }
        : tab
    ));
  };

  const handleDatabaseConnection = (connection: DatabaseConnection) => {
    // Handle successful database connection
    // You might want to create a new tab or update the current one
    console.log('Connected to database:', connection);
  };

  const handleDatabaseConnectionsClick = () => {
    const newTab: Tab = {
      id: `database-connections-${Date.now()}`,
      title: 'Database Connections',
      type: 'database-connections'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'welcome':
        return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Welcome to Dumpy</h2>
              <p className="mt-2 text-gray-600">Version 1.0</p>
              
              <div className="mt-8 space-y-4">
                <button 
                  onClick={handleNewFileImport}
                  className="w-64 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <FileUp size={20} />
                  <span>New File Import</span>
                </button>
                
                <button 
                  onClick={handleNewApiImport}
                  className="w-64 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Globe size={20} />
                  <span>New API Import</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'file-import':
        return (
          <div className="h-full w-full overflow-hidden">
            <DataImporter 
              onFileSelect={(fileName) => updateTabFileName(activeTabId, fileName)}
              onDataChange={(data) => updateTabData(activeTabId, data)}
              initialData={tab.data}
              initialFile={tab.file}
            />
          </div>
        );
      case 'api-import':
        return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
            {/* API import content will go here */}
          </div>
        );
      case 'database-connections':
        return (
          <div className="flex-1 overflow-auto bg-gray-50">
            <DatabaseConnections onConnect={handleDatabaseConnection} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 w-64 transition-transform duration-200 ease-in-out z-30 mt-8`}
      >
        <div className="h-[calc(100vh-2rem)] flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span className="bg-black text-white px-1.5 py-0.5 rounded">d</span>
              <span>dumpy</span>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTabId('welcome')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            <div>
              <button 
                onClick={() => {
                  setActiveTabId('jobs');
                  setIsActiveJobsOpen(!isActiveJobsOpen);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileUp size={20} />
                  <span>Active Jobs</span>
                </div>
                {isActiveJobsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {isActiveJobsOpen && (
                <div className="ml-8 mt-2 space-y-2">
                  <button className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    Job 1
                  </button>
                  <button className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    Job 2
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleDatabaseConnectionsClick}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <Database size={20} />
              <span>Database Connections</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
              <Link2 size={20} />
              <span>API Connections</span>
            </button>
          </nav>

          {/* Settings at bottom */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isDrawerOpen ? 'ml-64' : 'ml-0'} transition-margin duration-200 ease-in-out pt-8 max-w-[calc(100vw-16rem)]`}>
        {/* Top Bar with Tabs */}
        <div className="sticky top-8 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center h-10 px-4">
            {!isDrawerOpen && (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 hover:bg-gray-100 rounded-md mr-2"
              >
                <Menu size={18} />
              </button>
            )}
            
            {/* Tab Bar */}
            <div className="flex flex-wrap gap-1 flex-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group px-8 py-1.5 rounded-t-xl transition-colors flex items-center space-x-2 relative ${
                    activeTabId === tab.id
                      ? 'bg-gray-200 text-black border-t border-x border-white-400 mb-[-2px]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  {tab.id !== 'welcome' && (
                    <CloseIcon
                      size={16}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      className="p-1 ml-9 rounded-full hover:bg-gray-100 hover:ring-1 hover:ring-gray-300 transition-all"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-200 flex-1 overflow-hidden">
          <div className="h-full w-full overflow-hidden">
            {renderTabContent(tabs.find(tab => tab.id === activeTabId)!)}
          </div>
        </div>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        type={modalType}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default DashboardLayout;