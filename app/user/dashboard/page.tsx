'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/lib/utils';

interface Complaint {
  _id: string;
  tracking_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  category: string;
  subCategory?: string;
  description: string;
  status: string;
  priority: string;
  dateFiled: string;
  reply?: string;
  adminReply?: string;
  updatedAt: string;
  viewCount?: number;
  satisfaction?: number;
  estimatedResolution?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // ONE-TIME initialization without any dependencies
  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      // Decode token
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', { id: payload.id, name: payload.name, email: payload.email, role: payload.role });
      
      // Check if user is citizen
      if (payload.role !== 'citizen') {
        if (payload.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (payload.role === 'department' || payload.role === 'department_admin') {
          window.location.href = '/department/dashboard';
        } else {
          window.location.href = '/login';
        }
        return;
      }
      
      // Set user data with validation
      const userData = {
        id: payload.id?.toString() || '',
        name: payload.name || 'User',
        email: payload.email || '',
        role: payload.role || 'citizen'
      };
      console.log('Setting user data:', userData);
      setUser(userData);
      
      // Fetch complaints
      if (userData.email) {
        fetchComplaints(userData.email);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Token error:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const fetchComplaints = async (userEmail: string, page = 1, filters = filter) => {
    try {
      const params = new URLSearchParams({
        email: userEmail,
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });
      
      const url = `/api/user/complaints?${params}`;
      console.log('Fetching complaints from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok) {
        console.log('Complaints received:', data.complaints?.length || 0);
        setComplaints(data.complaints || []);
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 10,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 1
        });
        setError('');
      } else {
        console.error('API Error:', data);
        setError(data.error || 'Failed to fetch complaints');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const logout = handleLogout; // Alias for consistency

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilter = { ...filter, [filterType]: value };
    setFilter(newFilter);
    if (user?.email) {
      setLoading(true);
      fetchComplaints(user.email, 1, newFilter);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages && user?.email) {
      setLoading(true);
      fetchComplaints(user.email, newPage, filter);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">
                My Complaints Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Welcome, {user?.name || 'User'}</span>
                <span className="text-xs text-gray-500">{user?.email || 'Loading...'}</span>
              </div>
              <Link href="/complaint" className="btn-primary">
                File New Complaint
              </Link>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filter.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Service">Service</option>
                <option value="Administrative">Administrative</option>
                <option value="Technical">Technical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search complaints..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Complaints ({pagination.total})
            </h2>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter.status || filter.category || filter.search 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by filing your first complaint.'
                }
              </p>
              <div className="mt-6">
                <Link href="/complaint" className="btn-primary">
                  File New Complaint
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {complaint.tracking_id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Department:</span> {complaint.department}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Category:</span> {complaint.category}
                            {complaint.subCategory && ` - ${complaint.subCategory}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Filed:</span> {formatDate(new Date(complaint.dateFiled))}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Updated:</span> {formatDate(new Date(complaint.updatedAt))}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {complaint.description}
                      </p>

                      {complaint.adminReply && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">Official Reply:</p>
                          <p className="text-sm text-blue-800">{complaint.adminReply}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Views: {complaint.viewCount || 0}</span>
                        {complaint.comments && complaint.comments.length > 0 && (
                          <span>Comments: {complaint.comments.length}</span>
                        )}
                        {complaint.attachments && complaint.attachments.length > 0 && (
                          <span>Attachments: {complaint.attachments.length}</span>
                        )}
                        {complaint.satisfaction && (
                          <span>Rating: {complaint.satisfaction}/5</span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/track/${complaint.tracking_id}`}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

