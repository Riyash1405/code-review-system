import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRepositoryDetails, fetchRepoCommits, triggerRepoAnalysis } from '../api/repos';
import type { GitCommit } from '../api/repos';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const RepoDetails: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const [analyzingCommit, setAnalyzingCommit] = useState<string | null>(null);

  // Stable query key — never changes with polling state
  const repoQueryKey = ['repository', owner, repo];

  // Fetch repository details + past analyses
  const { data, isLoading, error } = useQuery({
    queryKey: repoQueryKey,
    queryFn: () => fetchRepositoryDetails(owner!, repo!),
    refetchInterval: isPolling ? 3000 : false,
    staleTime: 0, // Always refetch on mount to get latest results
  });

  // Fetch commit history from GitHub
  const { data: commits, isLoading: commitsLoading } = useQuery({
    queryKey: ['commits', owner, repo],
    queryFn: () => fetchRepoCommits(owner!, repo!),
  });

  // Trigger analysis mutation
  const mutation = useMutation({
    mutationFn: (commitSha?: string) => triggerRepoAnalysis(owner!, repo!, commitSha),
    onSuccess: (data: any) => {
      if (data.cached) {
        // Result was already cached — refresh UI immediately
        setAnalyzingCommit(null);
        queryClient.invalidateQueries({ queryKey: repoQueryKey });
        return;
      }
      // Start polling for result
      setAnalyzingCommit(data.commitSha);
      setIsPolling(true);
    },
    onError: (err) => {
      console.error('Trigger analysis failed', err);
      setAnalyzingCommit(null);
      alert('Failed to trigger analysis. Please try again.');
    }
  });

  // Stop polling when a new analysis result arrives matching our commit
  useEffect(() => {
    if (!isPolling) return;

    if (data?.recentAnalyses?.length > 0) {
      const analyzedShasInResults = new Set((data.recentAnalyses || []).map((a: any) => a.commit.sha));
      if (analyzingCommit && analyzedShasInResults.has(analyzingCommit)) {
        setIsPolling(false);
        setAnalyzingCommit(null);
        return;
      }
    }

    // Safety: stop polling after 60s
    const timeout = setTimeout(() => {
      setIsPolling(false);
      setAnalyzingCommit(null);
      queryClient.invalidateQueries({ queryKey: repoQueryKey });
    }, 60000);

    return () => clearTimeout(timeout);
  }, [data, isPolling, analyzingCommit]);

  const handleAnalyzeCommit = (sha: string) => {
    setAnalyzingCommit(sha);
    mutation.mutate(sha);
  };

  if (isLoading && !data) {
    return <div className="p-6 text-gray-400">Loading repository details...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-400">Error loading repository details.</div>;
  }

  const { details, recentAnalyses, isTracked } = data;

  // Chart data (chronological)
  const chartData = (recentAnalyses || []).slice().reverse().map((a: any) => ({
    name: a.commit.sha.substring(0, 7),
    score: a.score,
  }));

  // Lookup set of analyzed commits
  const analyzedShas = new Set((recentAnalyses || []).map((a: any) => a.commit.sha));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
        &larr; Back to Dashboard
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{details.full_name}</h1>
          <p className="text-gray-400">{details.description || 'No description provided.'}</p>
        </div>
        <Button 
          size="lg" 
          className="shrink-0 bg-primary-600 hover:bg-primary-500"
          onClick={() => handleAnalyzeCommit('')}
          isLoading={(mutation.isPending && !analyzingCommit) || (isPolling && !analyzingCommit)}
        >
          {isPolling && !analyzingCommit ? 'Analyzing...' : 'Analyze Latest Commit'}
        </Button>
      </div>

      {/* Score Trend Chart + Repo Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass md:col-span-2">
          <CardHeader>
            <CardTitle>Score Trends & History</CardTitle>
          </CardHeader>
          <CardContent>
            {!isTracked || recentAnalyses.length === 0 ? (
              <div className="py-8 text-center text-gray-500 border border-dashed border-border-color rounded-xl">
                No analysis history found. Trigger an analysis to get started.
              </div>
            ) : (
              <div className="space-y-8">
                {recentAnalyses.length > 1 && (
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-2">Past Analyses</h3>
                  {recentAnalyses.map((analysis: any) => (
                    <div key={analysis.id} className="flex justify-between items-center p-4 bg-surface-color rounded-lg border border-border-color">
                      <div>
                        <div className="font-medium text-white">
                          Score: <span className={analysis.score >= 80 ? 'text-green-400' : analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'}>{analysis.score}/100</span>
                        </div>
                        <div className="text-sm text-gray-400">Commit: {analysis.commit.sha.substring(0,7)}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/repo/${owner}/${repo}/analysis/${analysis.commit.sha}`)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Repository Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Visibility</div>
              <div className="text-sm text-white">{details.private ? 'Private' : 'Public'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Language</div>
              <div className="text-sm text-white">{details.language || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Stars</div>
              <div className="text-sm text-white">{details.stargazers_count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Forks</div>
              <div className="text-sm text-white">{details.forks_count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Default Branch</div>
              <div className="text-sm text-white">{details.default_branch}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commit History */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Commit History</CardTitle>
        </CardHeader>
        <CardContent>
          {commitsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading commits from GitHub...</div>
          ) : !commits || commits.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed border-border-color rounded-xl">
              No commits found in this repository.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {commits.map((c: GitCommit) => {
                const isAnalyzed = analyzedShas.has(c.sha);
                const isCurrentlyAnalyzing = analyzingCommit === c.sha;
                return (
                  <div 
                    key={c.sha} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border transition-all ${
                      isAnalyzed 
                        ? 'bg-primary-600/5 border-primary-500/30' 
                        : 'bg-surface-color border-border-color hover:border-gray-500'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                          {c.sha.substring(0, 7)}
                        </code>
                        {isAnalyzed && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                            Analyzed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white truncate" title={c.commit.message}>
                        {c.commit.message.split('\n')[0]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.author?.login || c.commit.author.name} · {new Date(c.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAnalyzed && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/repo/${owner}/${repo}/analysis/${c.sha}`)}
                        >
                          View Results
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-primary-600 hover:bg-primary-500"
                        onClick={() => handleAnalyzeCommit(c.sha)}
                        isLoading={isCurrentlyAnalyzing}
                        disabled={mutation.isPending}
                      >
                        {isCurrentlyAnalyzing ? 'Analyzing...' : isAnalyzed ? 'Re-Analyze' : 'Analyze'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
