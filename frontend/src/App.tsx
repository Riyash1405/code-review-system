import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { RepoDetails } from './pages/RepoDetails';
import { AnalysisView } from './pages/AnalysisView';
import { Settings } from './pages/Settings';
import { Layout } from './components/layout/Layout';

const ProtectedRoute = () => {
  const token = localStorage.getItem('code_review_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        {/* We'll use the Layout to persistent the navbar & sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:owner/:repo" element={<RepoDetails />} />
          <Route path="/repo/:owner/:repo/analysis/:commitSha" element={<AnalysisView />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;