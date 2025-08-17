import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // Redirect to role-based landing if user is already authenticated
    const destination = user.role === 'employee' ? '/app/my-tickets' : '/app/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
