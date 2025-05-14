import React from 'react';
import { FileJson, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className={`py-4 px-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'} transition-colors duration-300`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileJson size={24} className="text-blue-500" />
          <h1 className="text-xl font-semibold">JSON Class Generator</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors duration-200`}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;