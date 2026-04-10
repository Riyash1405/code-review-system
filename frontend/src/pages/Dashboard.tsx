import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchRepositories, type Repository } from '../api/repos';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: repositories, isLoading, error } = useQuery<Repository[]>({
    queryKey: ['repositories'],
    queryFn: fetchRepositories
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">Loading repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-400">Error loading repositories. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Your Repositories</h1>
        <Button variant="secondary" onClick={() => fetchRepositories()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repositories?.map((repo) => (
          <Card key={repo.id} className="glass border-border-color hover:border-primary-500/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg truncate pr-2" title={repo.name}>
                  {repo.name}
                </CardTitle>
                <span className="text-xs px-2 py-1 bg-surface-color rounded border border-border-color shrink-0">
                  {repo.private ? 'Private' : 'Public'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 h-10 mb-4 line-clamp-2">
                {repo.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-xs text-gray-500 gap-3">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                      {repo.language}
                    </span>
                  )}
                  <span>★ {repo.stargazers_count}</span>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/repo/${repo.full_name}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!repositories?.length && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-border-color rounded-xl">
            No repositories found on your GitHub account.
          </div>
        )}
      </div>
    </div>
  );
};