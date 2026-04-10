import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('code_review_token');
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface-color border-b border-border-color shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-white tracking-tight">
          <span className="text-primary-400">⚡</span> CodeReview AI
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
