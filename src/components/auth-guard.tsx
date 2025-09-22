'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login',
  allowedRoles 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated()) {
        router.push(redirectTo);
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, isAuthenticated, requireAuth, allowedRoles, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated()) {
    return null; // Will redirect via useEffect
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
