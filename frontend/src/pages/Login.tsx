import React from 'react';
import { GithubIcon as Github } from '../components/icons/GithubIcon';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const Login: React.FC = () => {
  const handleGithubLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-color p-4">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none" />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-color border border-border-color mb-4">
            <Github className="w-6 h-6 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-color mb-2">
            Intelligent Code Review
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to automate repository analysis and scoring
          </p>
        </div>

        <Card className="glass shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome back</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 hover:bg-surface-color border-opacity-50"
              onClick={handleGithubLogin}
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </Button>
            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, you agree to grant us access to your repositories for codebase analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};