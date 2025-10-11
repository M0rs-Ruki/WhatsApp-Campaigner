import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isTokenValid } from '../../utils/Auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const tokenValid = isTokenValid();
  
  // If no token or expired, redirect to login
  if (!tokenValid) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
