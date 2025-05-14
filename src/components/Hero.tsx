import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Animated Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'moveRight 20s linear infinite',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-44">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The best way to integrate data with zero code
            </h1>
            <p className="text-xl text-gray-500 mb-8">
              Transform your data integration workflow with our no-code solution.
            </p>
            <button className="px-8 py-4 bg-black text-white rounded-lg text-lg font-semibold hover:bg-gray-900 transition-colors">
              Get Started
            </button>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md">
                <img src="https://placehold.co/600x400/png" alt="Data Integration Demo" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 