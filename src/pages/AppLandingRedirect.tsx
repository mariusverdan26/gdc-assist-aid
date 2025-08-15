import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

export default function AppLandingRedirect() {
  const { user, loading } = useUser();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const destination = user.role === 'employee' ? '/app/my-tickets' : '/app/dashboard';
  return <Navigate to={destination} replace />;
}


