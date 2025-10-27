'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge, categories } from '@/src/lib/utils';
import { DashboardLayout, StatCard, FilterBar, EmptyState } from '@/components/dashboard';
import { toast } from 'react-hot-toast';
import { 
  FileText, Home, Inbox, Clock, CheckCircle, Activity, List, Edit, X
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

export default function DepartmentDashboardPage() {
  const [user, setUser] = useState<DepartmentUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({ status: '', adminReply: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

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
      await fetchAssignedComplaints(userData);
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

  const fetchAssignedComplaints = async (userData?: DepartmentUser) => {
    const currentUser = userData || user;
    if (!currentUser) return;

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        assigned_to: currentUser.id.toString(),
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (response.ok) {
        setComplaints(data.complaints || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching assigned complaints:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/department/login';
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updateData,
          updated_by: user?.id
        }),
      });

      if (response.ok) {
        toast.success('Complaint updated successfully!');
        setShowModal(false);
        setSelectedComplaint(null);
        setUpdateData({ status: '', adminReply: '' });
        fetchAssignedComplaints();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Error updating complaint');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      adminReply: complaint.adminReply || '',
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching assigned complaints...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const departmentName = departments.find(d => d.id === user.department_id)?.name || 'Department';
  const filteredComplaints = complaints.filter(c => {
    if (filters.status && c.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    if (filters.category && c.category !== filters.category) return false;
    return true;
  });

  const navItems = [
    { label: 'Dashboard', href: '/department/dashboard', icon: Home, active: true },
    { label: 'All Complaints', href: '/department/complaints', icon: Inbox }
  ];

  return (
    <DashboardLayout
      user={{ name: user.name, email: user.email, role: user.role }}
      navItems={navItems}
      onLogout={handleLogout}
      title={`${departmentName} Dashboard`}
      showSearch={false}
    >
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome, {user.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">{departmentName} - Assigned Complaints</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Assigned to Me"
          value={pagination.total}
          icon={FileText}
          colorScheme="primary"
        />
        <StatCard
          title="Pending"
          value={complaints.filter(c => c.status === 'Pending' || c.status === 'pending').length}
          icon={Clock}
          colorScheme="warning"
        />
        <StatCard
          title="In Progress"
          value={complaints.filter(c => c.status === 'In Progress' || c.status === 'in_progress').length}
          icon={Activity}
          colorScheme="info"
        />
        <StatCard
          title="Resolved"
          value={complaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length}
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
            onChange: (value) => handleFilterChange('status', value),
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' }
            ]
          },
          {
            name: 'category',
            label: 'Category',
            value: filters.category,
            onChange: (value) => handleFilterChange('category', value),
            options: [
              { label: 'All Categories', value: '' },
              ...categories.map(cat => ({ label: cat, value: cat }))
            ]
          }
        ]}
        onReset={() => setFilters({ status: '', category: '' })}
      />

      {/* Complaints Table */}
      <div className="card-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <List className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
            My Assigned Complaints
            <span className="ml-3 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
              {filteredComplaints.length}
            </span>
          </h2>
        </div>

        {filteredComplaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No complaints assigned"
            description="You don't have any complaints assigned to you at the moment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Complainant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Filed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint._id || complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-primary-600 dark:text-primary-400">
                        {complaint.trackingId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{complaint.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{complaint.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{complaint.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{complaint.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {complaint.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(new Date(complaint.dateFiled))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openUpdateModal(complaint)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border dark:border-gray-700 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Update Complaint: {selectedComplaint.trackingId}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reply</label>
                <textarea
                  value={updateData.adminReply}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, adminReply: e.target.value }))}
                  rows={4}
                  className="form-input w-full"
                  placeholder="Enter your reply..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateComplaint}
                disabled={updating}
                className="btn-primary disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
