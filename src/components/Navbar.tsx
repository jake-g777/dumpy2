import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

interface MenuItemProps {
  label: string;
  hasDropdown?: boolean;
}

interface NavbarProps {
  isBannerVisible: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, hasDropdown }) => (
  <div className="relative group">
    <button className="flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-900">
      {label}
      {hasDropdown && <ChevronDown size={14} className="ml-1" />}
    </button>
    {hasDropdown && (
      <div className="absolute hidden group-hover:block w-48 py-2 mt-1 bg-white rounded-md shadow-lg border border-gray-100">
        <a href="#" className="block px-4 py-1.5 text-gray-600 hover:bg-gray-50">Option 1</a>
        <a href="#" className="block px-4 py-1.5 text-gray-600 hover:bg-gray-50">Option 2</a>
        <a href="#" className="block px-4 py-1.5 text-gray-600 hover:bg-gray-50">Option 3</a>
      </div>
    )}
  </div>
);

const Navbar: React.FC<NavbarProps> = ({ isBannerVisible }) => {
  return (
    <nav className={`fixed w-full bg-white shadow-sm border-b border-grey z-40 transition-all duration-200 ${
      isBannerVisible ? 'top-8' : 'top-0'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center flex-1">
            <Link to="/" className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span className="bg-black text-white px-1.5 py-0.5 rounded">d</span>
              <span>dumpy</span>
            </Link>
            
            <div className="hidden md:block ml-8 flex-1">
              <div className="flex items-center space-x-3">
                <MenuItem label="Product" hasDropdown />
                <MenuItem label="Pricing" hasDropdown />
                <MenuItem label="Enterprise" hasDropdown />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">     
            <Link 
              to="/signin" 
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 