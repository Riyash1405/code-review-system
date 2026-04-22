import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserSettings, updateUserSettings } from '../api/user';
import type { UserSettings } from '../api/user';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', desc: 'Free tier (250k tokens/min). Model: gemini-2.5-flash', free: true },
  { value: 'openai', label: 'OpenAI', desc: 'Model: gpt-4o-mini. Requires paid API key.', free: false },
  { value: 'anthropic', label: 'Anthropic Claude', desc: 'Model: claude-sonnet-4-20250514. Requires paid API key.', free: false },
  { value: 'groq', label: 'Groq (Llama)', desc: 'Free tier available. Model: llama-3.3-70b-versatile', free: true },
];

interface GitHubAccount {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string | null;
  isPrimary: boolean;
  connectedAt: string;
}

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [useLlm, setUseLlm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: fetchUserSettings,
  });

  // Fetch user profile for connected accounts
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const token = localStorage.getItem('code_review_token');
      const res = await axios.get(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.user;
    },
  });

  const githubAccounts: GitHubAccount[] = profile?.githubAccounts || [];

  useEffect(() => {
    if (settings) {
      setUseLlm(settings.useLlmForReview);
      setApiKey(settings.geminiApiKey || '');
      setProvider(settings.llmProvider || 'gemini');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => updateUserSettings({
      useLlmForReview: useLlm,
      geminiApiKey: apiKey || null,
      llmProvider: provider,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const token = localStorage.getItem('code_review_token');
      await axios.delete(`${BACKEND_URL}/auth/github/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to disconnect account');
    }
  });

  const handleConnectGitHub = () => {
    // Redirect to GitHub OAuth linking flow
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  const selectedProvider = PROVIDERS.find(p => p.value === provider);

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Connected GitHub Accounts */}
      <Card className="glass">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Connected GitHub Accounts</CardTitle>
            <Button
              size="sm"
              onClick={handleConnectGitHub}
              className="bg-surface-color border border-border-color hover:bg-bg-color text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              Connect Account
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {githubAccounts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border-color rounded-xl">
              <div className="text-3xl mb-2">🔗</div>
              <p className="text-gray-400">No GitHub accounts connected yet.</p>
              <p className="text-gray-500 text-sm mt-1">Connect one to start analyzing your repositories.</p>
            </div>
          ) : (
            githubAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-surface-color rounded-lg border border-border-color">
                <div className="flex items-center gap-3">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold">
                      {account.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white flex items-center gap-2">
                      @{account.username}
                      {account.isPrimary && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-600/10 text-primary-400 border border-primary-500/20">Primary</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Connected {new Date(account.connectedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Disconnect @${account.username}? Their repos will be removed from your dashboard.`))
                      disconnectMutation.mutate(account.id);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded border border-red-500/20 hover:border-red-500/40"
                >
                  Disconnect
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Analysis Engine */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Analysis Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-color rounded-lg border border-border-color">
            <div>
              <div className="font-medium text-white">AI-Powered Analysis</div>
              <div className="text-sm text-gray-400 mt-1">
                Use an AI model for deep code reviews. Falls back to rule-based analysis if unavailable.
              </div>
            </div>
            <button
              onClick={() => setUseLlm(!useLlm)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${useLlm ? 'bg-primary-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${useLlm ? 'translate-x-7' : ''}`} />
            </button>
          </div>

          {useLlm && (
            <>
              {/* Provider Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">AI Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setProvider(p.value)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        provider === p.value
                          ? 'border-primary-500 bg-primary-600/10'
                          : 'border-border-color bg-surface-color hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{p.label}</span>
                        {p.free && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Free</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {selectedProvider?.label || 'API'} Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProvider?.label || ''} API key`}
                  className="w-full px-4 py-3 rounded-lg bg-bg-color border border-border-color text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-gray-500">
                  Your API key is encrypted and stored securely. It is never logged or shared.
                </p>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => mutation.mutate()}
              isLoading={mutation.isPending}
              className="bg-primary-600 hover:bg-primary-500"
            >
              Save Settings
            </Button>
            {saved && (
              <span className="text-sm text-green-400 animate-pulse">✓ Settings saved successfully!</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
