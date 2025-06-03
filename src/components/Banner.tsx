import React, { useState } from 'react';
import { X } from 'lucide-react';

interface BannerProps {
  onVisibilityChange: (isVisible: boolean) => void;
}

const Banner: React.FC<BannerProps> = ({ onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onVisibilityChange(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-600 w-full">
      <div className="w-full px-4 py-1">
        <div className="flex items-center justify-center relative">
          <div className="flex items-center">
            <span className="flex p-1 rounded-lg bg-blue-700">
              <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </span>
            <p className="ml-2 text-sm font-medium text-white">
              <span className="md:hidden">We announced a new product!</span>
              <span className="hidden md:inline">Big news! We're excited to announce a new product that will revolutionize your workflow.</span>
              <a href="#" className="ml-2 text-white underline hover:text-blue-100 transition-colors">
                Join our mailing list for updates
              </a>
            </p>
          </div>
          <button
            type="button"
            className="absolute right-0 flex p-1 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={handleClose}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner; 