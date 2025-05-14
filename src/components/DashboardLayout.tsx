import React, { useState } from 'react';
import { Menu, X, Home, Database, Link2, Settings, ChevronDown, ChevronRight, FileUp, Globe } from 'lucide-react';
import { X as CloseIcon } from 'lucide-react';

interface DashboardLayoutProps {
  // Remove the children requirement
}

interface Tab {
  id: string;
  title: string;
  type: 'welcome' | 'file-import' | 'api-import';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isActiveJobsOpen, setIsActiveJobsOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'welcome', title: 'Welcome', type: 'welcome' }]);
  const [activeTabId, setActiveTabId] = useState('welcome');

  const handleNewFileImport = () => {
    const newTab: Tab = {
      id: `file-import-${Date.now()}`,
      title: 'File Import',
      type: 'file-import'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleNewApiImport = () => {
    const newTab: Tab = {
      id: `api-import-${Date.now()}`,
      title: 'API Import',
      type: 'api-import'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabId === activeTabId) {
      setActiveTabId('welcome'); // Switch to welcome tab when closing active tab
    }
    setTabs(tabs.filter(tab => tab.id !== tabId));
  };

  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'welcome':
        return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Welcome to Dumpy</h2>
              <p className="mt-2 text-gray-600">Version 1.0</p>
              
              <div className="mt-8 space-y-4">
                <button 
                  onClick={handleNewFileImport}
                  className="w-64 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <FileUp size={20} />
                  <span>New File Import</span>
                </button>
                
                <button 
                  onClick={handleNewApiImport}
                  className="w-64 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors"
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
          <div className="p-8">
            <h2 className="text-2xl font-semibold">File Import</h2>
            {/* File import content will go here */}
          </div>
        );
      case 'api-import':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-semibold">API Import</h2>
            {/* API import content will go here */}
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
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
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
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileUp size={20} />
                  <span>Active Jobs</span>
                </div>
                {isActiveJobsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {isActiveJobsOpen && (
                <div className="ml-8 mt-2 space-y-2">
                  <button className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                    Job 1
                  </button>
                  <button className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                    Job 2
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTabId('connections')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Database size={20} />
              <span>Database Connection</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <Link2 size={20} />
              <span>API Connections</span>
            </button>
          </nav>

          {/* Settings at bottom */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isDrawerOpen ? 'ml-64' : 'ml-0'} transition-margin duration-200 ease-in-out pt-8`}>
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
            <div className="flex space-x-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group px-3 py-1.5 rounded-t-lg transition-colors flex items-center space-x-2 ${
                    activeTabId === tab.id
                      ? 'bg-white text-black border-t border-x border-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.title}</span>
                  {tab.id !== 'welcome' && (
                    <CloseIcon
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full p-0.5"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-200 m-2 shadow-sm ">
          {renderTabContent(tabs.find(tab => tab.id === activeTabId)!)}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;