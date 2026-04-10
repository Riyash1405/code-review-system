import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalysisResult } from '../api/repos';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScoreCard } from '../components/ScoreCard';
import { IssueList } from '../components/IssueList';

export const AnalysisView: React.FC = () => {
  const { owner, repo, commitSha } = useParams<{ owner: string; repo: string; commitSha: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', owner, repo, commitSha],
    queryFn: () => fetchAnalysisResult(owner!, repo!, commitSha!)
  });

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading analysis details...</div>;
  }

  if (error || !data || !data.analysis) {
    return <div className="p-6 text-red-400">Error loading analysis details or no analysis found.</div>;
  }

  const { analysis } = data;
  const issues = analysis.issues || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/repo/${owner}/${repo}`)} className="mb-4">
        &larr; Back to Repository
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analysis Results</h1>
        <p className="text-gray-400">
          Commit: <code className="text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded font-mono text-sm">{commitSha?.substring(0,7)}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ScoreCard score={analysis.score} label="Overall Score" size="lg" />

        <Card className="glass md:col-span-3">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-color leading-relaxed">{analysis.summary || 'No summary provided.'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Detected Issues ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <IssueList issues={issues} />
        </CardContent>
      </Card>
    </div>
  );
};
