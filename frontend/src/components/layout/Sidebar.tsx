import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, GitBranch, LogOut } from 'lucide-react';
import { GithubIcon as Github } from '../icons/GithubIcon';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('code_review_token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-surface-color border-r border-border-color hidden md:flex flex-col h-full sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-border-color">
        <Github className="w-6 h-6 text-primary-500 mr-2" />
        <span className="font-bold tracking-tight text-white">ICR System</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-900/30 text-primary-500'
                : 'text-gray-400 hover:bg-bg-color hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mr-3 flex-shrink-0" />
          Dashboard
        </NavLink>

        <NavLink
          to="/repositories"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-900/30 text-primary-500'
                : 'text-gray-400 hover:bg-bg-color hover:text-white'
            }`
          }
        >
          <GitBranch className="w-5 h-5 mr-3 flex-shrink-0" />
          Repositories
        </NavLink>

        <NavLink
          to="/organizations"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-900/30 text-primary-500'
                : 'text-gray-400 hover:bg-bg-color hover:text-white'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Organizations
        </NavLink>
        
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-900/30 text-primary-500'
                : 'text-gray-400 hover:bg-bg-color hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:bg-bg-color hover:text-red-400 mt-auto"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          Logout
        </button>
      </nav>

      <div className="p-4 border-t border-border-color">
        <p className="text-xs text-gray-500 text-center uppercase tracking-wider">
          v1.0.0-beta
        </p>
      </div>
    </aside>
  );
};
