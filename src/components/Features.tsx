import React from 'react';
import { 
  Database, 
  FileUp, 
  Globe, 
  Zap, 
  Lock, 
  Code, 
  BarChart2, 
  RefreshCw,
  Shield,
  Clock
} from 'lucide-react';

const features = [
  {
    title: 'Multi-Database Support',
    description: 'Connect to any major database system including MySQL, PostgreSQL, SQL Server, and Oracle. Seamlessly manage multiple database connections.',
    icon: Database,
    color: 'purple'
  },
  {
    title: 'File Processing',
    description: 'Process and transform data from various file formats including CSV, Excel, JSON, and XML. Automate your file-based workflows.',
    icon: FileUp,
    color: 'blue'
  },
  {
    title: 'API Integration',
    description: 'Connect to any REST or GraphQL API. Transform and sync data between your databases and external services.',
    icon: Globe,
    color: 'green'
  },
  {
    title: 'Real-time Processing',
    description: 'Process and transform data in real-time with minimal latency. Keep your systems in sync with instant updates.',
    icon: Zap,
    color: 'yellow'
  },
  {
    title: 'Secure Connections',
    description: 'Enterprise-grade security with encrypted connections, role-based access control, and audit logging.',
    icon: Lock,
    color: 'red'
  },
  {
    title: 'No-Code Interface',
    description: 'Build complex data workflows without writing a single line of code. Intuitive drag-and-drop interface.',
    icon: Code,
    color: 'indigo'
  },
  {
    title: 'Advanced Analytics',
    description: 'Monitor your data flows with real-time analytics and insights. Track performance and usage metrics.',
    icon: BarChart2,
    color: 'pink'
  },
  {
    title: 'Automated Scheduling',
    description: 'Schedule your data workflows to run automatically. Set up recurring jobs and get notified of results.',
    icon: Clock,
    color: 'orange'
  },
  {
    title: 'Data Validation',
    description: 'Ensure data quality with built-in validation rules. Catch errors before they affect your systems.',
    icon: Shield,
    color: 'teal'
  }
];

const Features: React.FC = () => {
  return (
    <div className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Powerful Features for Modern Data Teams
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to connect, transform, and automate your data workflows without writing code.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative group bg-gray-800/50 p-6 rounded-2xl hover:bg-gray-800 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-${feature.color}-500/10 to-${feature.color}-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-lg bg-${feature.color}-900/50`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-800/50 p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold text-white">99.9%</div>
            <div className="mt-2 text-gray-400">Uptime</div>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold text-white">5+</div>
            <div className="mt-2 text-gray-400">Database Types</div>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold text-white">10x</div>
            <div className="mt-2 text-gray-400">Faster Development</div>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold text-white">24/7</div>
            <div className="mt-2 text-gray-400">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features; 