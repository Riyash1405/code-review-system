import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnalysisResult, triggerRepoAnalysis } from '../api/repos';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScoreCard } from '../components/ScoreCard';
import { IssueList } from '../components/IssueList';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const TYPE_COLORS: Record<string, string> = {
  SECURITY: '#ef4444',
  PERFORMANCE: '#06b6d4',
  COMPLEXITY: '#a855f7',
  SMELL: '#eab308',
  STYLE: '#3b82f6',
  ERROR: '#f97316',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#60a5fa',
};

export const AnalysisView: React.FC = () => {
  const { owner, repo, commitSha } = useParams<{ owner: string; repo: string; commitSha: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', owner, repo, commitSha],
    queryFn: () => fetchAnalysisResult(owner!, repo!, commitSha!)
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => triggerRepoAnalysis(owner!, repo!, commitSha, true),
    onSuccess: () => {
      setIsReanalyzing(true);
      // Poll for new results
      const poll = setInterval(async () => {
        const result = await fetchAnalysisResult(owner!, repo!, commitSha!);
        if (result?.analysis) {
          clearInterval(poll);
          setIsReanalyzing(false);
          queryClient.invalidateQueries({ queryKey: ['analysis', owner, repo, commitSha] });
          queryClient.invalidateQueries({ queryKey: ['repository', owner, repo] });
        }
      }, 3000);
      // Safety timeout
      setTimeout(() => {
        clearInterval(poll);
        setIsReanalyzing(false);
        queryClient.invalidateQueries({ queryKey: ['analysis', owner, repo, commitSha] });
      }, 90000);
    },
  });

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading analysis details...</div>;
  }

  if (error || !data || !data.analysis) {
    return <div className="p-6 text-red-400">Error loading analysis details or no analysis found.</div>;
  }

  const { analysis } = data;
  const issues = analysis.issues || [];

  // Category breakdown data
  const typeCounts: Record<string, number> = {};
  issues.forEach((i: any) => {
    const t = i.type || 'OTHER';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const categoryData = Object.entries(typeCounts).map(([name, count]) => ({
    name,
    count,
    color: TYPE_COLORS[name] || '#6b7280',
  }));

  // Severity distribution
  const severityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach((i: any) => {
    const s = i.severity || 'medium';
    if (severityCounts[s] !== undefined) severityCounts[s]++;
  });
  const severityData = Object.entries(severityCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SEVERITY_COLORS[name] || '#6b7280',
    }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/repo/${owner}/${repo}`)} className="mb-4">
          &larr; Back to Repository
        </Button>
        <Button
          variant="secondary"
          onClick={() => reanalyzeMutation.mutate()}
          disabled={isReanalyzing || reanalyzeMutation.isPending}
        >
          {isReanalyzing ? '⏳ Re-analyzing...' : '🔄 Re-analyze'}
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analysis Results</h1>
        <p className="text-gray-400">
          Commit: <code className="text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded font-mono text-sm">{commitSha?.substring(0,7)}</code>
        </p>
      </div>

      {/* Score + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ScoreCard score={analysis.score} label="Overall Score" size="lg" />

        <Card className="glass md:col-span-3">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-color leading-relaxed text-sm">{analysis.summary || 'No summary provided.'}</p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(typeCounts).map(([type, count]) => (
                <span key={type} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border" style={{
                  borderColor: TYPE_COLORS[type] + '40',
                  backgroundColor: TYPE_COLORS[type] + '10',
                  color: TYPE_COLORS[type],
                }}>
                  {type}: {count}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border-color text-gray-400">
                Total: {issues.length} issues
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {issues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8, color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {severityData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {severityData.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}: {s.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues List */}
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
