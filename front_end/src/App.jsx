import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages imports
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import ProfileDetail from './pages/ProfileDetail';
import AttendanceLog from './pages/AttendanceLog';
import LeavesManagement from './pages/LeavesManagement';
import Settings from './pages/Settings';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="dashboard-loader" style={{ margin: '100px' }}>Authenticating user session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Component with AuthProvider and Router
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Main App Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payroll" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute>
                <EmployeeDirectory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={
              <ProtectedRoute>
                <ProfileDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute>
                <AttendanceLog />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaves" 
            element={
              <ProtectedRoute>
                <LeavesManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
