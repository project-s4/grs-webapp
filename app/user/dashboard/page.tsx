'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/src/lib/utils';
import { DashboardLayout, StatCard, FilterBar, EmptyState } from '@/components/dashboard';
import { 
  FileText, Plus, Home, Inbox, Clock, CheckCircle, Activity,
  Calendar, Eye, MessageCircle, Paperclip, Star, ArrowRight, AlertCircle, RefreshCw
} from 'lucide-react';

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
  adminReply?: string;
  updatedAt: string;
  viewCount?: number;
  satisfaction?: number;
  comments?: Array<{ id: string; message: string; date: string }>;
  attachments?: Array<{ id: string; name: string; url: string }>;
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

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
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
      
      const userData = {
        id: payload.id?.toString() || '',
        name: payload.name || 'User',
        email: payload.email || '',
        role: payload.role || 'citizen'
      };
      setUser(userData);
      
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
      
      const response = await fetch(`/api/user/complaints?${params}`);
      const data = await response.json();

      if (response.ok) {
        setComplaints(data.complaints || []);
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 10,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 1
        });
        setError('');
      } else {
        const errorMessage = data.message || data.error || 'Failed to fetch complaints. Please try again.';
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Network error. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

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
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950 dark:via-gray-900 dark:to-red-900 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900 mb-8 animate-pulse">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{error}</p>
          <div className="space-x-4">
            <Link href="/" className="btn-primary btn-lg inline-flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary btn-lg inline-flex items-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', href: '/user/dashboard', icon: Home, active: true },
    { label: 'New Complaint', href: '/complaint', icon: Plus },
    { label: 'All Complaints', href: '/user/complaints', icon: Inbox }
  ];

  return (
    <DashboardLayout
      user={user}
      navItems={navItems}
      onLogout={handleLogout}
      title="Dashboard"
      actions={
        <Link
          href="/complaint"
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Complaint
        </Link>
      }
    >
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back, {user.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's an overview of your complaints</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Complaints"
          value={pagination.total}
          icon={FileText}
          colorScheme="primary"
        />
        <StatCard
          title="Pending"
          value={complaints.filter(c => c.status === 'Pending').length}
          icon={Clock}
          colorScheme="warning"
        />
        <StatCard
          title="Resolved"
          value={complaints.filter(c => c.status === 'Resolved').length}
          icon={CheckCircle}
          colorScheme="success"
        />
        <StatCard
          title="In Progress"
          value={complaints.filter(c => c.status === 'In Progress').length}
          icon={Activity}
          colorScheme="info"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: filter.status,
            onChange: (value) => handleFilterChange('status', value),
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'Pending' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' },
              { label: 'Escalated', value: 'Escalated' },
              { label: 'Closed', value: 'Closed' },
              { label: 'Rejected', value: 'Rejected' }
            ]
          },
          {
            name: 'category',
            label: 'Category',
            value: filter.category,
            onChange: (value) => handleFilterChange('category', value),
            options: [
              { label: 'All Categories', value: '' },
              { label: 'Infrastructure', value: 'Infrastructure' },
              { label: 'Service', value: 'Service' },
              { label: 'Administrative', value: 'Administrative' },
              { label: 'Technical', value: 'Technical' },
              { label: 'Other', value: 'Other' }
            ]
          }
        ]}
        searchConfig={{
          value: filter.search,
          onChange: (value) => setFilter(prev => ({ ...prev, search: value })),
          placeholder: "Search complaints..."
        }}
        onReset={() => {
          setFilter({ status: '', category: '', search: '' });
          if (user.email) {
            setLoading(true);
            fetchComplaints(user.email, 1, { status: '', category: '', search: '' });
          }
        }}
      />

      {/* Complaints List */}
      <div className="card-glass">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
              Your Complaints
              <span className="ml-3 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                {pagination.total}
              </span>
            </h2>
          </div>
        </div>

        {complaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No complaints found"
            description={
              filter.status || filter.category || filter.search
                ? "Try adjusting your filters or search terms."
                : "Get started by filing your first complaint."
            }
            action={{
              label: "File New Complaint",
              onClick: () => window.location.href = '/complaint',
              icon: Plus
            }}
            secondaryAction={
              (filter.status || filter.category || filter.search) ? {
                label: "Clear Filters",
                onClick: () => {
                  setFilter({ status: '', category: '', search: '' });
                  if (user.email) {
                    setLoading(true);
                    fetchComplaints(user.email, 1, { status: '', category: '', search: '' });
                  }
                }
              } : undefined
            }
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {complaint.tracking_id}
                      </h3>
                      <span className={`badge ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`badge ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white mr-2">Department:</span>
                        {complaint.department}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white mr-2">Category:</span>
                        {complaint.category}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white mr-2">Filed:</span>
                        {formatDate(new Date(complaint.dateFiled))}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2 text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white mr-2">Updated:</span>
                        {formatDate(new Date(complaint.updatedAt))}
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {complaint.description}
                    </p>

                    {complaint.adminReply && (
                      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-3">
                        <div className="flex items-center mb-1">
                          <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                          <p className="text-sm font-medium text-primary-900 dark:text-primary-100">Official Reply:</p>
                        </div>
                        <p className="text-sm text-primary-800 dark:text-primary-200">{complaint.adminReply}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {complaint.viewCount || 0} views
                      </div>
                      {complaint.comments && complaint.comments.length > 0 && (
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {complaint.comments.length} comments
                        </div>
                      )}
                      {complaint.attachments && complaint.attachments.length > 0 && (
                        <div className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-1" />
                          {complaint.attachments.length} attachments
                        </div>
                      )}
                      {complaint.satisfaction && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-500" />
                          {complaint.satisfaction}/5 rating
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    <Link
                      href={`/track/${complaint.tracking_id}`}
                      className="btn-primary btn-lg inline-flex items-center group-hover:shadow-glow-primary"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${
                          pageNum === pagination.page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
