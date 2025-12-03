'use client';

import { useState, useEffect } from 'react';
import { formatDate, getStatusBadge, categories } from '@/src/lib/utils';
import { DashboardLayout, StatCard, EmptyState } from '@/components/dashboard';
import {
  FileText, Home, Inbox, Clock, CheckCircle, Activity, Users,
  AlertCircle, Download, Filter, Search, Grid, List as ListIcon,
  BarChart3, UserPlus, MoreHorizontal, ChevronLeft, ChevronRight, Eye, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Complaint {
  id: string;
  _id?: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  status: string;
  department_id?: string;
  department_name?: string;
  user_name?: string;
  user_email?: string;
  email?: string;
  phone?: string;
  location?: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

interface DepartmentUser {
  id: string;
  name: string;
  email?: string | null;
  department_id: string | null;
}

export default function AllComplaintsPage() {
  const [admin, setAdmin] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    category: '',
    assigned: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedComplaints, setSelectedComplaints] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignedUser, setAssignedUser] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (admin) {
      fetchComplaints();
    }
  }, [currentPage, filters]);

  const initializePage = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        window.location.href = '/admin/login';
        return;
      }

      setAdmin(payload);
      loadInitialData();
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/admin/login';
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchDepartments(),
        fetchDepartmentUsers(),
        fetchComplaints()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to load departments');
      }
      const data = await response.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (error: any) {
      console.error('Error:', error);
    }
  };

  const fetchDepartmentUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/department-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load department users');
      }
      const data = await response.json();
      console.log('[Admin Complaints] Fetched department users:', data.length, data);
      if (Array.isArray(data)) {
        setDepartmentUsers(data);
        if (data.length === 0) {
          console.warn('[Admin Complaints] No department users found. Make sure users with role "department" or "department_admin" exist.');
        }
      } else {
        console.error('[Admin Complaints] Invalid response format:', data);
      }
    } catch (error: any) {
      console.error('[Admin Complaints] Error fetching department users:', error);
      toast.error('Failed to load department users. Please refresh the page.');
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) {
        const dept = departments.find(d => d.name === filters.department);
        if (dept) queryParams.append('department_id', dept.id);
      }
      if (filters.category) queryParams.append('category', filters.category);

      const response = await fetch(`/api/complaints?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load complaints');
      }
      const data = await response.json();
      if (data.complaints) {
        setComplaints(data.complaints);
        setTotal(data.pagination?.total || data.complaints.length);
        setTotalPages(data.pagination?.pages || 1);
      } else if (Array.isArray(data)) {
        setComplaints(data);
        setTotal(data.length);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load complaints. Please refresh the page.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const filteredComplaints = complaints.filter(c => {
    if (filters.assigned === 'assigned' && !c.assigned_to) return false;
    if (filters.assigned === 'unassigned' && c.assigned_to) return false;
    if (filters.search && !c.tracking_id.toLowerCase().includes(filters.search.toLowerCase()) &&
      !c.description.toLowerCase().includes(filters.search.toLowerCase()) &&
      !(c.title || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const groupedByStatus = {
    Pending: filteredComplaints.filter(c => c.status.toLowerCase() === 'pending'),
    'In Progress': filteredComplaints.filter(c => c.status.toLowerCase() === 'in progress'),
    Resolved: filteredComplaints.filter(c => c.status.toLowerCase() === 'resolved'),
  };

  const openAssignModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignedUser(complaint.assigned_to || '');
    setShowAssignModal(true);
  };

  const handleAssignComplaint = async () => {
    if (!selectedComplaint || !assignedUser) {
      toast.error('Please select a user to assign');
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_to: assignedUser
        }),
      });

      if (response.ok) {
        toast.success('Complaint assigned successfully!');
        setShowAssignModal(false);
        setSelectedComplaint(null);
        setAssignedUser('');
        fetchComplaints(); // Refresh the list
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to assign complaint' }));
        const errorMessage = error.message || error.error || 'Failed to assign complaint. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error assigning complaint:', error);
      const errorMessage = error.message || 'An unexpected error occurred while assigning the complaint. Please try again.';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Complaints</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching all complaints...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'All Complaints', href: '/admin/complaints', icon: Inbox, active: true },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
  ];

  return (
    <DashboardLayout
      user={{ name: admin.name || 'Admin', email: admin.email, role: 'admin' }}
      navItems={navItems}
      onLogout={handleLogout}
      title="All Complaints"
      showSearch={false}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">All Complaints</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor all grievances</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-ghost btn-sm inline-flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Complaints"
          value={total}
          icon={FileText}
          colorScheme="primary"
        />
        <StatCard
          title="Pending"
          value={complaints.filter(c => c.status.toLowerCase() === 'pending').length}
          icon={Clock}
          colorScheme="warning"
        />
        <StatCard
          title="In Progress"
          value={complaints.filter(c => c.status.toLowerCase() === 'in progress').length}
          icon={Activity}
          colorScheme="info"
        />
        <StatCard
          title="Resolved"
          value={complaints.filter(c => c.status.toLowerCase() === 'resolved').length}
          icon={CheckCircle}
          colorScheme="success"
        />
      </div>

      {/* Filters */}
      <div className="card-glass mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Filter className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              Filters & View
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-select"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="form-select"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filters.assigned}
              onChange={(e) => handleFilterChange('assigned', e.target.value)}
              className="form-select"
            >
              <option value="">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Board/List View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(groupedByStatus).map(([status, items]) => (
            <div key={status} className="card-glass">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>{status}</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {items.length}
                  </span>
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {items.map(complaint => (
                  <div key={complaint.id || complaint._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-primary-600 dark:text-primary-400">
                        {complaint.tracking_id}
                      </span>
                      {complaint.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {complaint.title || complaint.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(new Date(complaint.created_at))}</span>
                      {complaint.assigned_to ? (
                        <span className="text-green-600 dark:text-green-400">Assigned</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">Unassigned</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/track/${complaint.tracking_id}`}>
                        <button className="w-full btn-ghost btn-sm text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No complaints in {status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
              All Complaints
              <span className="ml-3 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                {filteredComplaints.length}
              </span>
            </h2>
          </div>

          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No complaints found"
              description="Try adjusting your filters"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Complainant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredComplaints.map(complaint => (
                      <tr key={complaint.id || complaint._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-primary-600 dark:text-primary-400">
                            {complaint.tracking_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={complaint.title || complaint.description}>
                            {complaint.title || complaint.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{complaint.user_name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{complaint.user_email || complaint.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {complaint.department_name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {complaint.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {complaint.priority ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {complaint.assigned_to ?
                            departmentUsers.find(u => u.id === complaint.assigned_to)?.name || 'Unknown'
                            : <span className="text-orange-600 dark:text-orange-400">Unassigned</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatDate(new Date(complaint.created_at))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link href={`/track/${complaint.tracking_id}`}>
                              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </Link>
                            {!complaint.assigned_to && (
                              <button
                                onClick={() => openAssignModal(complaint)}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 inline-flex items-center"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Assign
                              </button>
                            )}
                            {complaint.assigned_to && (
                              <button
                                onClick={() => openAssignModal(complaint)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Reassign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn-ghost btn-sm disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-ghost btn-sm disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border dark:border-gray-700 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Assign Complaint: {selectedComplaint.tracking_id}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedComplaint(null);
                  setAssignedUser('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{selectedComplaint.title || selectedComplaint.description}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedComplaint.department_name || 'No Department'} - {selectedComplaint.category || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {selectedComplaint.description}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Department User
              </label>
              <select
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
                className="form-select w-full"
              >
                <option value="">Select a user...</option>
                {departmentUsers.length === 0 ? (
                  <option value="" disabled>No department users available. Please create department users first.</option>
                ) : (
                  // Show ALL department users regardless of department
                  departmentUsers.map((user) => {
                    const deptName = user.department_id 
                      ? departments.find(d => d.id === user.department_id)?.name || 'Unknown Dept'
                      : 'No Department';
                    const displayName = user.name || user.email || 'Unnamed User';
                    
                    return (
                      <option key={user.id} value={user.id}>
                        {displayName} - {deptName}
                      </option>
                    );
                  })
                )}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {departmentUsers.length > 0 ? (
                  <>
                    {departmentUsers.length} department user{departmentUsers.length !== 1 ? 's' : ''} available (all departments)
                  </>
                ) : (
                  'No department users found. Please create department users in the Users section.'
                )}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedComplaint(null);
                  setAssignedUser('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignComplaint}
                disabled={assigning || !assignedUser}
                className="btn-primary disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

