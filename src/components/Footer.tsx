import React from 'react';
import { Github } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <footer className={`py-4 px-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-t border-gray-200'} transition-colors duration-300`}>
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
        <p>&copy; {new Date().getFullYear()} JSON Class Generator</p>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}
          >
            <Github size={16} />
            <span>Source Code</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;