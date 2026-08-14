import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import PublicPortfolio from './pages/PublicPortfolio';
import StudentDashboard from './pages/StudentDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/not-found" element={<NotFound />} />
      {/* Public shareable portfolio URLs, kept last so static routes win. */}
      <Route path="/:studentId" element={<PublicPortfolio />} />
      <Route path="/:collegeSlug/:studentId" element={<PublicPortfolio />} />
    </Routes>
  );
}
