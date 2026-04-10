import React from 'react';

interface Issue {
  type?: string;
  ruleId?: string;
  severity?: string;
  message: string;
  path?: string;
  file?: string;
  line?: number;
}

interface IssueListProps {
  issues: Issue[];
}

const severityBadge = (severity?: string) => {
  switch (severity) {
    case 'error':
    case 'high':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'warning':
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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

export const IssueList: React.FC<IssueListProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="py-10 text-center text-green-400 border border-dashed border-green-500/20 rounded-xl bg-green-500/5">
        <span className="text-3xl block mb-2">✨</span>
        No issues detected! Excellent code quality.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <div 
          key={index} 
          className="p-4 bg-surface-color rounded-lg border border-border-color flex flex-col gap-2 hover:border-gray-500 transition-colors"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{typeIcon(issue.type)}</span>
              <span className="font-semibold text-white truncate">
                {issue.ruleId || issue.type || 'Issue'}
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded border shrink-0 ${severityBadge(issue.severity)}`}>
              {issue.severity || 'info'}
            </span>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">{issue.message}</p>

          {(issue.path || issue.file) && (
            <div className="text-xs text-gray-500 font-mono mt-1 bg-bg-color p-2 rounded flex items-center gap-1">
              <span className="text-gray-600">📁</span>
              {issue.path || issue.file}{issue.line ? `:${issue.line}` : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
