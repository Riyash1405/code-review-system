import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-color px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-4">
            <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">
            {sent ? 'Check your inbox' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {sent ? (
            <div className="text-center space-y-4">
              {/* Email sent icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 mx-auto">
                <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div>
                <p className="text-white font-semibold text-lg mb-1">Email Sent!</p>
                <p className="text-gray-400 text-sm">
                  We've sent a password reset link to{' '}
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-surface-color border border-border-color text-left space-y-2">
                <p className="text-gray-300 text-sm font-medium">📌 Next steps:</p>
                <ul className="text-gray-400 text-sm space-y-1 ml-4 list-disc">
                  <li>Open the email from <strong className="text-gray-300">ICR System</strong></li>
                  <li>Click the <strong className="text-gray-300">"Reset Password"</strong> button</li>
                  <li>Choose your new password</li>
                </ul>
              </div>

              <p className="text-gray-500 text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setError(''); }}
                  className="text-primary-500 hover:text-primary-400 underline underline-offset-2"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-bg-color border border-border-color text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
