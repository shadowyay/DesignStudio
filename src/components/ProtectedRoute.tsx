import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (requireAuth && !token) {
    // If authentication is required but user is not logged in, redirect to login
    // Check if user was trying to access volunteer-specific routes
    const currentPath = window.location.pathname;
    if (currentPath.includes('/volunteer') || userRole === 'volunteer') {
      return <Navigate to="/volunteer/auth" replace />;
    }
    return <Navigate to="/user/auth" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;