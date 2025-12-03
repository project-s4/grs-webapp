'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    // For demo purposes, automatically create an admin session
    // This bypasses authentication since it's a demo system
    const demoAdminToken = createDemoAdminToken();
    localStorage.setItem('token', demoAdminToken);

    // Redirect to admin dashboard or specified redirect
    router.push(redirect || '/admin/dashboard');
  }, [router, redirect]);

  // Create a demo JWT token for admin access
  function createDemoAdminToken() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'demo-admin',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 year expiry
    }));
    const signature = btoa('demo-signature');
    return `${header}.${payload}.${signature}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Accessing Admin Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Setting up demo access...
        </p>
      </div>
    </div>
  );
}
