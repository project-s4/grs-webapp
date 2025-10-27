'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/src/lib/utils';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  LogOut, 
  User, 
  Calendar, 
  Clock, 
  Eye, 
  MessageCircle, 
  Paperclip, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Settings,
  Download,
  RefreshCw,
  Home,
  List,
  Inbox,
  Menu,
  X,
  ChevronDown,
  MoreHorizontal
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
  reply?: string;
  adminReply?: string;
  updatedAt: string;
  viewCount?: number;
  satisfaction?: number;
  estimatedResolution?: string;
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
  const [isVisible, setIsVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
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
    setIsVisible(true);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6"></div>
            <div className="animate-ping absolute top-0 left-0 rounded-full h-16 w-16 border-4 border-primary-400 dark:border-primary-600 opacity-20"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching your complaints and analytics...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Oops! Something went wrong</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{error}</p>
          <div className="space-y-4">
            <Link href="/" className="btn-primary btn-lg inline-flex items-center">
              <ArrowRight className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary btn-lg inline-flex items-center ml-4"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <h2 className="text-lg font-bold text-primary-600 dark:text-primary-400">GRS Portal</h2>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link
            href="/user/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md"
          >
            <Home className="w-5 h-5 mr-3" />
            {sidebarOpen && 'Dashboard'}
          </Link>
          <Link
            href="/complaint"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <Plus className="w-5 h-5 mr-3" />
            {sidebarOpen && 'New Complaint'}
          </Link>
          <button
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <Inbox className="w-5 h-5 mr-3" />
            {sidebarOpen && 'All Complaints'}
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex items-center flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Link
              href="/complaint"
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Complaint
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Home</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Recent
              </h2>
              <div className="space-y-3">
              {complaints.slice(0, 5).map((complaint) => (
                  <Link
                    key={complaint._id}
                    href={`/track/${complaint.tracking_id}`}
                    className="flex items-start text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="truncate font-medium text-left">{complaint.tracking_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-left">in {complaint.department}</p>
                    </div>
                  </Link>
                ))}
                {complaints.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent complaints</p>
                )}
              </div>
            </div>

            {/* Docs/Categories Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Categories
              </h2>
              <div className="space-y-3">
                {['Infrastructure', 'Service', 'Administrative', 'Technical', 'Other'].map((category) => {
                  const count = complaints.filter(c => c.category === category).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={category}
                      onClick={() => handleFilterChange('category', category)}
                      className="flex items-start text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-full text-left"
                    >
                      <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-left">{category}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{count} complaints</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 text-left">Total</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{pagination.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 text-left">Pending</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{complaints.filter(c => c.status === 'Pending').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 text-left">Resolved</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{complaints.filter(c => c.status === 'Resolved').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 text-left">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{complaints.filter(c => c.status === 'In Progress').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Departments/Folders Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Inbox className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
              Departments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(new Set(complaints.map(c => c.department))).map((dept) => {
                const count = complaints.filter(c => c.department === dept).length;
                return (
                  <button
                    key={dept}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                  >
                    <Inbox className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate text-left">{dept}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{count} items</p>
                    </div>
                  </button>
                );
              })}
              {complaints.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-center">No departments yet</p>
                </div>
              )}
            </div>
          </div>

        {/* Statistics Dashboard */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-glass hover-lift group">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          
          <div className="card-glass hover-lift group">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">
                  {complaints.filter(c => c.status === 'Pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900 dark:to-warning-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
          </div>
          
          <div className="card-glass hover-lift group">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                  {complaints.filter(c => c.status === 'Resolved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900 dark:to-success-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </div>
          
          <div className="card-glass hover-lift group">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-info-600 dark:text-info-400">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-info-100 to-info-200 dark:from-info-900 dark:to-info-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-info-600 dark:text-info-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-glass mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Filter className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Filters & Search
              </h2>
              <button 
                onClick={() => {
                  setFilter({ status: '', category: '', search: '' });
                  if (user?.email) {
                    setLoading(true);
                    fetchComplaints(user.email, 1, { status: '', category: '', search: '' });
                  }
                }}
                className="btn-ghost btn-sm inline-flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select w-full"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</label>
                <select
                  value={filter.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-select w-full"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="form-input w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

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
              <div className="flex items-center space-x-2">
                <button className="btn-ghost btn-sm inline-flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
                <button className="btn-ghost btn-sm inline-flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No complaints found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {filter.status || filter.category || filter.search 
                  ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                  : 'Get started by filing your first complaint to track and manage your grievances.'
                }
              </p>
              <div className="space-y-4">
                <Link href="/complaint" className="btn-primary btn-lg inline-flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  File New Complaint
                </Link>
                {(filter.status || filter.category || filter.search) && (
                  <button 
                    onClick={() => {
                      setFilter({ status: '', category: '', search: '' });
                      if (user?.email) {
                        setLoading(true);
                        fetchComplaints(user.email, 1, { status: '', category: '', search: '' });
                      }
                    }}
                    className="btn-ghost btn-lg inline-flex items-center ml-4"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {complaints.map((complaint, index) => (
                <div key={complaint._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-3">
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-white w-20 text-left">Department:</span>
                            <span className="ml-2 text-left">{complaint.department}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-white w-20 text-left">Category:</span>
                            <span className="ml-2 text-left">{complaint.category}{complaint.subCategory && ` - ${complaint.subCategory}`}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                            <span className="font-medium text-gray-900 dark:text-white w-16 text-left">Filed:</span>
                            <span className="ml-2 text-left">{formatDate(new Date(complaint.dateFiled))}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2 text-primary-500" />
                            <span className="font-medium text-gray-900 dark:text-white w-16 text-left">Updated:</span>
                            <span className="ml-2 text-left">{formatDate(new Date(complaint.updatedAt))}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {complaint.description}
                      </p>

                      {complaint.adminReply && (
                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                            <p className="text-sm font-medium text-primary-900 dark:text-primary-100">Official Reply:</p>
                          </div>
                          <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">{complaint.adminReply}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{complaint.viewCount || 0} views</span>
                        </div>
                        {complaint.comments && complaint.comments.length > 0 && (
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>{complaint.comments.length} comments</span>
                          </div>
                        )}
                        {complaint.attachments && complaint.attachments.length > 0 && (
                          <div className="flex items-center">
                            <Paperclip className="w-4 h-4 mr-1" />
                            <span>{complaint.attachments.length} attachments</span>
                          </div>
                        )}
                        {complaint.satisfaction && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            <span>{complaint.satisfaction}/5 rating</span>
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
            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === pagination.page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${
                            isActive
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
                    className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
        </main>
      </div>
    </div>
  );
}

