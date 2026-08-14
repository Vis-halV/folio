import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth';
import { getToken } from '../api';

/* Convenience gating only - the API independently enforces every access rule. */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page">
      <p className="label-inline">CHECKING SESSION…</p>
    </div>;
  }
  if (!user || !getToken()) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}
