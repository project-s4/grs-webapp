'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, getStatusBadge, categories } from '@/lib/utils';
import { toast } from 'react-hot-toast';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DepartmentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number;
}

export default function DepartmentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DepartmentUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string; }[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminReply: '',
  });
  const [updating, setUpdating] = useState(false);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    
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
      setInitialized(true);
      
      // Load initial data
      loadInitialData(userData);
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/department/login';
    }
  }, [initialized]);

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
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/complaints?${params}`, {
        headers,
      });
      const data = await response.json();

      if (response.ok) {
        setComplaints(data.complaints || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching assigned complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/department/login';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const departmentName = departments.find(d => d.id === user?.department_id)?.name || 'Unknown Department';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                Department Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-gray-600">Welcome, {user?.name}</div>
                <div className="text-sm text-gray-500">
                  {departmentName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">Assigned to Me</h3>
            <p className="text-3xl font-bold text-primary-600">{pagination.total}</p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-warning-600">
              {complaints.filter(c => c.status === 'Pending' || c.status === 'pending').length}
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
            <p className="text-3xl font-bold text-primary-600">
              {complaints.filter(c => c.status === 'In Progress' || c.status === 'in_progress').length}
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">Resolved</h3>
            <p className="text-3xl font-bold text-success-600">
              {complaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="form-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">My Assigned Complaints</h3>
          
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No complaints assigned to you</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complainant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Filed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint._id || complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-primary-600">
                          {complaint.trackingId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{complaint.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{complaint.name}</div>
                          <div className="text-sm text-gray-500">{complaint.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(new Date(complaint.dateFiled || complaint.created_at))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openUpdateModal(complaint)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Update
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
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Update Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Complaint: {selectedComplaint.trackingId}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Complaint Details</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedComplaint.title}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedComplaint.description}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Reply</label>
                  <textarea
                    value={updateData.adminReply}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, adminReply: e.target.value }))}
                    rows={4}
                    className="form-input"
                    placeholder="Enter your response to the complaint..."
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
        </div>
      )}
    </div>
  );
}
