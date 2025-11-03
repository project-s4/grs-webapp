'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge, categories } from '@/src/lib/utils';
import { DashboardLayout, StatCard, FilterBar, EmptyState } from '@/components/dashboard';
import { toast } from 'react-hot-toast';
import { 
  FileText, Home, Inbox, Clock, CheckCircle, Activity, List, Edit, X, Search
} from 'lucide-react';

interface Complaint {
  _id: string;
  id: number;
  trackingId: string;
  title: string;
  description: string;
  name: string;
  email: string;
  department: string;
  category: string;
  status: string;
  dateFiled: string;
  adminReply?: string;
  updatedAt: string;
  user_id: number;
  department_id: number;
  assigned_to: number;
}

interface DepartmentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number;
}

export default function DepartmentComplaintsPage() {
  const [user, setUser] = useState<DepartmentUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({ status: '', adminReply: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDepartmentComplaints();
    }
  }, [filters, pagination.page, user]);

  const initializePage = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/department/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'department' && payload.role !== 'department_admin') {
        window.location.href = '/department/login';
        return;
      }
      
      const userData = {
        id: payload.id || payload.user_id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        department_id: payload.department_id
      };
      setUser(userData);
      loadInitialData(userData);
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/department/login';
    }
  };

  const loadInitialData = async (userData: DepartmentUser) => {
    try {
      await fetchDepartments();
      await fetchDepartmentComplaints(userData);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDepartmentComplaints = async (userData?: DepartmentUser) => {
    const currentUser = userData || user;
    if (!currentUser) return;

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        department_id: currentUser.department_id.toString(),
      });

      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.category) {
        params.append('category', filters.category);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (response.ok) {
        // Transform data to match expected format
        const transformedComplaints = (data.complaints || []).map((c: any) => ({
          _id: c.id || c._id,
          id: c.id || parseInt(c.id),
          trackingId: c.tracking_id || c.reference_no || c.trackingId,
          title: c.title || '',
          description: c.description || '',
          name: c.user_name || c.name || 'Anonymous',
          email: c.user_email || c.email || '',
          department: c.department_name || c.department || '',
          category: c.category || 'General',
          status: c.status || 'Pending',
          dateFiled: c.created_at || c.dateFiled || '',
          adminReply: c.admin_reply || c.adminReply || '',
          updatedAt: c.updated_at || c.created_at || '',
          user_id: c.user_id,
          department_id: c.department_id,
          assigned_to: c.assigned_to,
        }));
        
        setComplaints(transformedComplaints);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || transformedComplaints.length,
          pages: data.pagination?.pages || Math.ceil((data.pagination?.total || transformedComplaints.length) / prev.limit)
        }));
      } else {
        toast.error(data.error || 'Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching department complaints:', error);
      toast.error('Failed to fetch complaints');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/department/login';
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${selectedComplaint._id || selectedComplaint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.adminReply && { admin_reply: updateData.adminReply }),
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to update complaint';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      toast.success('Complaint updated successfully');
      setShowModal(false);
      setSelectedComplaint(null);
      setUpdateData({ status: '', adminReply: '' });
      await fetchDepartmentComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    // Map frontend status to backend enum values
    const statusMapping: { [key: string]: string } = {
      'Pending': 'new',
      'pending': 'new',
      'New': 'new',
      'new': 'new',
      'In Progress': 'in_progress',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'Resolved': 'resolved',
      'resolved': 'resolved',
      'Triaged': 'triaged',
      'triaged': 'triaged',
      'Escalated': 'escalated',
      'escalated': 'escalated',
      'Closed': 'closed',
      'closed': 'closed',
    };
    
    const backendStatus = statusMapping[complaint.status] || complaint.status || 'new';
    
    setUpdateData({
      status: backendStatus,
      adminReply: complaint.adminReply || '',
    });
    setShowModal(true);
  };

  const filteredComplaints = complaints.filter(c => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.trackingId.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const departmentName = departments.find(d => d.id === user.department_id)?.name || 'Department';

  const navItems = [
    { label: 'Dashboard', href: '/department/dashboard', icon: Home },
    { label: 'All Complaints', href: '/department/complaints', icon: Inbox, active: true }
  ];

  const allComplaints = filteredComplaints.length;
  const pendingCount = filteredComplaints.filter(c => c.status === 'Pending' || c.status === 'pending' || c.status === 'new').length;
  const inProgressCount = filteredComplaints.filter(c => c.status === 'In Progress' || c.status === 'in_progress' || c.status === 'in-progress').length;
  const resolvedCount = filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length;

  return (
    <DashboardLayout
      user={{ name: user.name, email: user.email, role: user.role }}
      navItems={navItems}
      onLogout={handleLogout}
      title={`${departmentName} - All Complaints`}
      showSearch={true}
    >
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">All Department Complaints</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage all complaints in {departmentName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Complaints"
          value={allComplaints}
          icon={FileText}
          colorScheme="primary"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          colorScheme="warning"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={Activity}
          colorScheme="info"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          colorScheme="success"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: filters.status,
            onChange: (value: string) => handleFilterChange('status', value),
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'New', value: 'new' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Triaged', value: 'triaged' },
              { label: 'Escalated', value: 'escalated' },
              { label: 'Closed', value: 'closed' },
            ]
          },
          {
            name: 'category',
            label: 'Category',
            value: filters.category,
            onChange: (value: string) => handleFilterChange('category', value),
            options: [
              { label: 'All Categories', value: '' },
              ...categories.map(cat => ({ label: cat, value: cat }))
            ]
          }
        ]}
        searchConfig={{
          value: filters.search,
          onChange: (value: string) => handleFilterChange('search', value),
          placeholder: 'Search complaints...'
        }}
        onReset={() => setFilters({ status: '', category: '', search: '' })}
      />

      {/* Complaints List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {filteredComplaints.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No complaints found"
            description={filters.status || filters.category || filters.search 
              ? "Try adjusting your filters" 
              : `No complaints available in ${departmentName}`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint._id || complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{complaint.trackingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{complaint.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{complaint.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">{complaint.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(new Date(complaint.dateFiled))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${complaint.assigned_to ? 'text-green-600' : 'text-gray-400'}`}>
                        {complaint.assigned_to ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openUpdateModal(complaint)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Update Complaint</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reference: {selectedComplaint.trackingId}</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedComplaint.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedComplaint.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Status</option>
                  <option value="new">New</option>
                  <option value="triaged">Triaged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department Reply
                </label>
                <textarea
                  value={updateData.adminReply}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, adminReply: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter your response..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateComplaint}
                disabled={updating}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

