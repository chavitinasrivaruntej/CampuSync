import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authStore, UserSession } from '@/lib/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  const [isValid, setIsValid] = useState<boolean>(() => authStore.validateSession());
  const [session, setSession] = useState<UserSession | null>(() => authStore.getSession());

  useEffect(() => {
    const handleAuthChange = () => {
      const valid = authStore.validateSession();
      setIsValid(valid);
      setSession(valid ? authStore.getSession() : null);
    };

    // Immediate check on location change
    handleAuthChange();

    window.addEventListener('campusync_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('campusync_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [location.pathname]);

  if (!isValid || !session || !session.user) {
    const targetUrl = location.pathname + location.search + location.hash;
    return <Navigate to="/login" state={{ from: targetUrl }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
