import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('code_review_token');
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-surface-color border-b border-border-color sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center flex-1">
        <button className="md:hidden text-gray-400 hover:text-white mr-4">
          <Menu className="w-5 h-5" />
        </button>
        {/* Breadcrumb or dynamic title could go here */}
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-bg-color transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 border-2 border-surface-color" />
        </button>

        <div className="h-4 w-px bg-border-color" />

        <button 
          onClick={handleLogout}
          className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};
