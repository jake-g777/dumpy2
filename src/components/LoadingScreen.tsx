import React from 'react';
import { Loader2, User } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Logging in User", 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-950 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-30">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 flex flex-col items-center space-y-6 min-w-[300px] fade-in">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-2">
          <div className="bg-gray-800 text-white px-2 py-1 rounded text-lg font-bold">
            d
          </div>
          <span className="text-2xl font-bold text-white">dumpy</span>
        </div>

        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin pulse-glow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          
          {/* Message with typing animation */}
          <div className="text-center">
            <p className="text-gray-300 text-lg font-medium mb-2 typing-animation">{message}</p>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Please wait while we authenticate your account...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 