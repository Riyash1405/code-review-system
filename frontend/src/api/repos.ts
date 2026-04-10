import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api',
});

// Add interceptor to inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('code_review_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  language: string;
  stargazers_count: number;
  updated_at: string;
}

export interface GitCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export const fetchRepositories = async (): Promise<Repository[]> => {
  const res = await api.get('/repos');
  return res.data.repos;
};

export const fetchRepositoryDetails = async (owner: string, repo: string, nocache: boolean = false) => {
  const url = nocache ? `/repos/${owner}/${repo}?nocache=true` : `/repos/${owner}/${repo}`;
  const res = await api.get(url);
  return res.data;
};

export const fetchRepoCommits = async (owner: string, repo: string): Promise<GitCommit[]> => {
  const res = await api.get(`/repos/${owner}/${repo}/commits`);
  return res.data.commits;
};

export const fetchAnalysisResult = async (owner: string, repo: string, commitSha: string) => {
  const res = await api.get(`/repos/${owner}/${repo}/analysis/${commitSha}`);
  return res.data;
};

export const triggerRepoAnalysis = async (owner: string, repo: string, commitSha?: string) => {
  const res = await api.post(`/repos/${owner}/${repo}/analyze`, { commitSha });
  return res.data;
};

