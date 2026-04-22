import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { RepoDetails } from './pages/RepoDetails';
import { AnalysisView } from './pages/AnalysisView';
import { Settings } from './pages/Settings';
import { Organizations } from './pages/Organizations';
import { OrgDetails } from './pages/OrgDetails';
import { Layout } from './components/layout/Layout';

/**
 * Decode JWT without a library — returns null if invalid/expired
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const ProtectedRoute = () => {
  const token = localStorage.getItem('code_review_token');
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('code_review_token');
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

/**
 * If already logged in, redirect to dashboard instead of showing landing/login
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('code_review_token');
  if (token && isTokenValid(token)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes — redirect to dashboard if already logged in */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:owner/:repo" element={<RepoDetails />} />
          <Route path="/repo/:owner/:repo/analysis/:commitSha" element={<AnalysisView />} />
          <Route path="/settings" element={<Settings />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/org/:orgId" element={<OrgDetails />} />
          </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;