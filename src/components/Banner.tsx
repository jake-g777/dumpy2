import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import RegisterModal from './RegisterModal';

interface BannerProps {
  onVisibilityChange: (isVisible: boolean) => void;
}

const Banner: React.FC<BannerProps> = ({ onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    onVisibilityChange(isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-indigo-900 text-white w-full px-4 py-2">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center relative">
            <p className="text-sm font-medium text-center">
              Welcome to Dumpy v1.0 alpha, we are currently in the early stages of development —
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold ml-2 focus:outline-none"
              >
                Subscribe to our Newsletter!
              </button>
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-0 text-white hover:text-indigo-200 transition-colors"
              aria-label="Close banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <RegisterModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Banner; 