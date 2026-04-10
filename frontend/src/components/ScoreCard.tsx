import React from 'react';

interface ScoreCardProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoreBgGlow = (score: number): string => {
  if (score >= 80) return 'shadow-green-500/20';
  if (score >= 50) return 'shadow-yellow-500/20';
  return 'shadow-red-500/20';
};

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, label = 'Score', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-color border border-border-color shadow-lg ${getScoreBgGlow(score)}`}>
      <span className={`${sizeClasses[size]} font-extrabold tabular-nums ${getScoreColor(score)}`}>
        {score}
      </span>
      <span className="text-xs text-gray-500 mt-2 uppercase tracking-widest">{label}</span>
    </div>
  );
};
