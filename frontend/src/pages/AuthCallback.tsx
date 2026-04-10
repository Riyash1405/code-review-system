import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token to localStorage for JWT authentication in subsequent requests
      localStorage.setItem('code_review_token', token);
      
      // Setup default axios header
      // ... usually done in an axios interceptor, we'll implement that in api.ts

      navigate('/dashboard', { replace: true });
    } else {
      // If no token, return to login with error
      navigate('/login?error=no_token', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-color">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
      <p className="text-text-color font-medium animate-pulse">Authenticating securely...</p>
    </div>
  );
};
