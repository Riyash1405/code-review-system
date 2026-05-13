/**
 * Shared TypeScript types for the ICR System backend.
 * Use these instead of `as any` throughout the codebase.
 */

// ─── GitHub Account Info ────────────────────────────────────────

export interface GitHubAccountInfo {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  isPrimary: boolean;
  connectedAt: Date;
  userId: string;
}

// ─── Authenticated User (attached to req.user by auth middleware) ─

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  passwordHash: string | null;
  geminiApiKey: string | null;
  llmProvider: string;
  useLlmForReview: boolean;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  githubAccounts: GitHubAccountInfo[];
  /** Convenience: accessToken from primary (or first) GitHub account */
  accessToken: string | null;
  /** Convenience: username from primary (or first) GitHub account */
  githubUsername: string | null;
}

// ─── Analysis Types ─────────────────────────────────────────────

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueType =
  | 'COMPLEXITY'
  | 'SMELL'
  | 'DUPLICATION'
  | 'STYLE'
  | 'SECURITY'
  | 'ERROR';

export interface AnalysisIssue {
  type: IssueType;
  file: string;
  line: number;
  message: string;
  severity?: IssueSeverity;
  suggestion?: string;
  score?: number;
}

export interface AnalysisOutput {
  score: number;
  summary: string;
  issues: AnalysisIssue[];
}

// ─── Source File ─────────────────────────────────────────────────

export interface SourceFile {
  path: string;
  content: string;
}

// ─── GitHub API Types (subset we use) ───────────────────────────

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  [key: string]: unknown;
}
