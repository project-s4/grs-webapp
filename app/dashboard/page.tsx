'use client';

import { useAuth } from '@/src/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Grievance = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoadingGrievances, setIsLoadingGrievances] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to login with dashboard redirect
        router.replace('/login?redirect=dashboard');
        return;
      }

      // User exists, redirect to role-based dashboard after a brief moment
      // This allows the page to render briefly with the dashboard UI
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true);
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'department' || user.role === 'department_admin') {
          router.replace('/department/dashboard');
        } else {
          router.replace('/user/dashboard');
        }
      }, 500); // Small delay to show dashboard content

      return () => clearTimeout(redirectTimer);
    }

    if (user && !shouldRedirect) {
      // Fetch user's grievances (for display while redirecting)
      const fetchGrievances = async () => {
        try {
          // For now, use mock data - actual API call would go here
          // const response = await api.get('/grievances');
          // setGrievances(response.data);

          // Mock data for display
          setGrievances([
            {
              id: '1',
              title: 'Garbage not collected',
              description: 'Garbage has not been collected for the past 3 days in our area.',
              status: 'pending',
              createdAt: '2023-10-01T10:00:00Z',
              updatedAt: '2023-10-01T10:00:00Z',
            },
            {
              id: '2',
              title: 'Broken street light',
              description: 'Street light near my house is not working for the past week.',
              status: 'in_progress',
              createdAt: '2023-09-28T15:30:00Z',
              updatedAt: '2023-09-30T09:15:00Z',
            },
          ]);
        } catch (error) {
          console.error('Failed to fetch grievances:', error);
        } finally {
          setIsLoadingGrievances(false);
        }
      };

      fetchGrievances();
    }
  }, [user, loading, router, shouldRedirect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    const statusText = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected',
    };

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}
      >
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Grievance Portal</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-4">
                Welcome, {user?.name || 'User'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Grievances</h1>
              <Link
                href="/complaint"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                New Grievance
              </Link>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
            {isLoadingGrievances ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No grievances</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new grievance.
                </p>
                <div className="mt-6">
                  <Link
                    href="/complaint"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    New Grievance
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {grievances.map((grievance) => (
                    <li key={grievance.id}>
                      <Link
                        href={`/track/${grievance.id}`}
                        className="block hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                              {grievance.title}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              {getStatusBadge(grievance.status)}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                {grievance.description.length > 100
                                  ? `${grievance.description.substring(0, 100)}...`
                                  : grievance.description}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                              <p>
                                Created on{' '}
                                <time dateTime={grievance.createdAt}>
                                  {new Date(grievance.createdAt).toLocaleDateString()}
                                </time>
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
