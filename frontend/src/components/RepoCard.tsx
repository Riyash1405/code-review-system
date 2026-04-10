import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Repository } from '../api/repos';

interface RepoCardProps {
  repo: Repository;
}

const langColor: Record<string, string> = {
  TypeScript:  'bg-blue-500',
  JavaScript:  'bg-yellow-400',
  Python:      'bg-green-500',
  Java:        'bg-orange-500',
  'C++':       'bg-pink-500',
  Go:          'bg-cyan-500',
  Rust:        'bg-orange-600',
  Ruby:        'bg-red-500',
};

export const RepoCard: React.FC<RepoCardProps> = ({ repo }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group relative flex flex-col p-5 rounded-xl bg-surface-color border border-border-color hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/repo/${repo.full_name}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white truncate pr-3 group-hover:text-primary-400 transition-colors" title={repo.name}>
          {repo.name}
        </h3>
        <span className="text-xs px-2 py-1 bg-bg-color rounded border border-border-color shrink-0">
          {repo.private ? '🔒 Private' : '🌐 Public'}
        </span>
      </div>

      <p className="text-sm text-gray-400 h-10 mb-4 line-clamp-2">
        {repo.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-color">
        <div className="flex items-center text-xs text-gray-500 gap-3">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${langColor[repo.language] || 'bg-gray-500'}`}></span>
              {repo.language}
            </span>
          )}
          <span>★ {repo.stargazers_count}</span>
        </div>
        
        <span className="text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
          View →
        </span>
      </div>
    </div>
  );
};
