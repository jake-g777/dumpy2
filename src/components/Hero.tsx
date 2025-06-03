import React from 'react';
import GrainEffect from './GrainEffect';
import { ArrowRight, Code, Zap, Shield } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Grain Effect */}
      <GrainEffect />

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 animate-gradient-shift" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 mb-4">
              <span className="text-2xl font-bold text-white">d</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Dumpy</span>
            </h1>
          </div>

          {/* Main Description */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Your all-in-one solution for data pipeline automation and management. 
            Build, monitor, and scale your data workflows with ease.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-colors">
              <Code className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Code-Free Pipelines</h3>
              <p className="text-gray-400">Build complex data pipelines without writing a single line of code</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/50 transition-colors">
              <Zap className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Process and transform your data with enterprise-grade performance</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/50 transition-colors">
              <Shield className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Enterprise Ready</h3>
              <p className="text-gray-400">Built with security and scalability in mind from day one</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 