'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/lib/utils';

interface Complaint {
  _id: string;
  trackingId: string;
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
  statusHistory?: Array<{
    status: string;
    updatedAt: string;
    updatedBy?: string;
    notes?: string;
  }>;
  comments?: Array<{
    _id: string;
    text: string;
    author: string;
    authorType: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    _id: string;
    filename: string;
    originalName: string;
    url: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
}

export default function UserDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    // Get email from localStorage or prompt user
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      fetchComplaints(savedEmail);
    } else {
      const userEmail = prompt('Please enter your email to view your complaints:');
      if (userEmail) {
        setEmail(userEmail);
        localStorage.setItem('userEmail', userEmail);
        fetchComplaints(userEmail);
      } else {
        setError('Email is required to view complaints');
        setLoading(false);
      }
    }
  }, []);

  const fetchComplaints = async (userEmail: string, page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        email: userEmail,
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await fetch(`/api/user/complaints?${params}`);
      const data = await response.json();

      if (response.ok) {
        setComplaints(data.complaints);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch complaints');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    fetchComplaints(email, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchComplaints(email, newPage);
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-danger-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-danger-100 mb-6">
            <svg className="h-8 w-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-primary-600">
                My Complaints Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Logged in as: {email}</span>
              <Link href="/complaint" className="btn-primary">
                File New Complaint
              </Link>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                          {complaint.trackingId}
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
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-primary-900 mb-1">Official Reply:</p>
                          <p className="text-sm text-primary-800">{complaint.adminReply}</p>
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
                        href={`/track/${complaint.trackingId}`}
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

