import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchUserSettings, updateUserSettings } from '../api/user';
import type { UserSettings } from '../api/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<UserSettings>>({});
  const [isSaved, setIsSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchUserSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        useLlmForReview: settings.useLlmForReview,
        geminiApiKey: settings.geminiApiKey || '',
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: () => {
      alert('Failed to save settings. Please try again.');
    }
  });

  const handleSave = () => {
    mutation.mutate({
      useLlmForReview: formData.useLlmForReview,
      geminiApiKey: formData.geminiApiKey || null,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your application preferences and integrations.</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Code Review Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-400">
                Use Google Gemini to perform semantic code reviews instead of the static syntax analyzer.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.useLlmForReview || false}
                onChange={(e) => setFormData({ ...formData, useLlmForReview: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {formData.useLlmForReview && (
            <div className="pt-4 border-t border-gray-700">
              <label className="block mb-2 text-sm font-medium text-white">Google Gemini API Key</label>
              <input
                type="password"
                className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              />
              <p className="mt-2 text-sm text-gray-400">
                Your API key is stored securely and only used to analyze your repositories.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end">
             <Button
                onClick={handleSave}
                isLoading={mutation.isPending}
                className="bg-primary-600 hover:bg-primary-500"
              >
                {isSaved ? 'Saved!' : 'Save Settings'}
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
