'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authService } from '@/src/services/auth';

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'department_admin' | 'citizen';
}) {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // If a specific role is required, check it here
    // You'll need to fetch the user's role from your auth context or API
    // For now, we'll just redirect to login if not authenticated
  }, [router]);

  if (!authService.isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
