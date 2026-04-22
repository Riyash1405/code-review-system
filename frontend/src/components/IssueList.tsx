import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Issue {
  type?: string;
  ruleId?: string;
  severity?: string;
  message: string;
  suggestion?: string;
  path?: string;
  file?: string;
  line?: number;
}

interface IssueListProps {
  issues: Issue[];
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const ISSUE_TYPES = ['All', 'SECURITY', 'PERFORMANCE', 'COMPLEXITY', 'SMELL', 'STYLE'];

const severityBadge = (severity?: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-600/20 text-red-300 border-red-500/40';
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'low':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const typeIcon = (type?: string) => {
  switch (type) {
    case 'SECURITY':    return '🔒';
    case 'COMPLEXITY':  return '🧩';
    case 'SMELL':       return '💨';
    case 'PERFORMANCE': return '⚡';
    case 'STYLE':       return '🎨';
    case 'ERROR':       return '🚨';
    default:            return '📋';
  }
};

const typeColor = (type?: string) => {
  switch (type) {
    case 'SECURITY':    return 'text-red-400';
    case 'COMPLEXITY':  return 'text-purple-400';
    case 'SMELL':       return 'text-yellow-400';
    case 'PERFORMANCE': return 'text-cyan-400';
    case 'STYLE':       return 'text-blue-400';
    default:            return 'text-gray-400';
  }
};

export const IssueList: React.FC<IssueListProps> = ({ issues }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!issues || issues.length === 0) {
    return (
      <div className="py-10 text-center text-green-400 border border-dashed border-green-500/20 rounded-xl bg-green-500/5">
        <span className="text-3xl block mb-2">✨</span>
        No issues detected! Excellent code quality.
      </div>
    );
  }

  const filtered = activeFilter === 'All' 
    ? issues 
    : issues.filter(i => i.type === activeFilter);

  // Sort by severity
  const sorted = [...filtered].sort(
    (a, b) => (SEVERITY_ORDER[a.severity || 'low'] ?? 4) - (SEVERITY_ORDER[b.severity || 'low'] ?? 4)
  );

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {ISSUE_TYPES.map(t => {
          const count = t === 'All' ? issues.length : issues.filter(i => i.type === t).length;
          if (t !== 'All' && count === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                activeFilter === t
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                  : 'bg-surface-color text-gray-400 border-border-color hover:border-gray-500'
              }`}
            >
              {t === 'All' ? 'All' : `${typeIcon(t)} ${t}`}
              <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Issue Cards */}
      <div className="space-y-3">
        {sorted.map((issue, index) => {
          const isExpanded = expandedIdx === index;
          return (
            <div 
              key={index} 
              className="bg-surface-color rounded-lg border border-border-color hover:border-gray-500 transition-colors overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{typeIcon(issue.type)}</span>
                    <span className={`font-semibold truncate ${typeColor(issue.type)}`}>
                      {issue.type || 'Issue'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border shrink-0 uppercase font-semibold tracking-wider ${severityBadge(issue.severity)}`}>
                    {issue.severity || 'info'}
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed">{issue.message}</p>

                {(issue.path || issue.file) && (
                  <div className="text-xs text-gray-500 font-mono bg-bg-color p-2 rounded flex items-center gap-1">
                    <span className="text-gray-600">📁</span>
                    {issue.path || issue.file}{issue.line ? `:${issue.line}` : ''}
                  </div>
                )}

                {/* Suggestion Toggle */}
                {issue.suggestion && (
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : index)}
                    className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors mt-1 font-medium"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Hide suggestion' : 'Show suggested fix'}
                  </button>
                )}
              </div>

              {/* Expanded Suggestion */}
              {isExpanded && issue.suggestion && (
                <div className="px-4 pb-4 pt-0">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/15 text-sm text-green-300 leading-relaxed whitespace-pre-wrap">
                    💡 {issue.suggestion}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
