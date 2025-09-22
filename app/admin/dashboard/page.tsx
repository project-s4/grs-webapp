'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, getStatusBadge, categories } from '@/lib/utils';

interface Complaint {
  _id: string;
  tracking_id: string;
  name: string;
  email: string;
  department: string;
  category: string;
  description: string;
  status: string;
  dateFiled: string;
  adminReply?: string;
  assigned_to?: number;
  updatedAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string; }[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<{ id: number; name: string; department_id: number; }[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ assigned_to: '' });
  const [assigning, setAssigning] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminReply: '',
    assigned_to: '',
  });
  const [updating, setUpdating] = useState(false);

  // Simple initialization
  useEffect(() => {
    if (initialized) return;
    
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
      setInitialized(true);
      
      // Load initial data
      loadInitialData();
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/admin/login';
    }
  }, [initialized]);

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
      const data = await response.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDepartmentUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/department-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDepartmentUsers(data);
      }
    } catch (error) {
      console.error('Error fetching department users:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedComplaint(null);
        setUpdateData({ status: '', adminReply: '', assigned_to: '' });
        fetchComplaints();
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      adminReply: complaint.adminReply || '',
      assigned_to: complaint.assigned_to?.toString() || '',
    });
    setShowModal(true);
  };

  const openAssignModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignmentData({
      assigned_to: complaint.assigned_to?.toString() || '',
    });
    setShowAssignModal(true);
  };

  const handleAssignComplaint = async () => {
    if (!selectedComplaint) return;

    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${selectedComplaint._id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_to: assignmentData.assigned_to ? parseInt(assignmentData.assigned_to) : null,
        }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedComplaint(null);
        setAssignmentData({ assigned_to: '' });
        fetchComplaints();
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
    } finally {
      setAssigning(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-gray-600">Welcome, Admin</div>
                {admin && admin.department_id && (
                  <div className="text-sm text-gray-500">
                    Department: {departments.find(d => d.id === admin.department_id)?.name || 'Loading...'}
                  </div>
                )}
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
            <h3 className="text-lg font-semibold text-gray-900">Total Complaints</h3>
            <p className="text-3xl font-bold text-primary-600">{complaints.length}</p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-warning-600">
              {complaints.filter(c => c.status === 'Pending').length}
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
            <p className="text-3xl font-bold text-primary-600">
              {complaints.filter(c => c.status === 'In Progress').length}
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">Resolved</h3>
            <p className="text-3xl font-bold text-success-600">
              {complaints.filter(c => c.status === 'Resolved').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="form-select"
                disabled
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                className="form-select"
                disabled
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="form-select"
                disabled
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Complaints</h3>
          
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No complaints found</p>
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
                      Complainant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
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
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-primary-600">
                          {complaint.tracking_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{complaint.name}</div>
                          <div className="text-sm text-gray-500">{complaint.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.department}
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
                        {complaint.assigned_to ? 
                          departmentUsers.find(u => u.id === complaint.assigned_to)?.name || 'Unknown User'
                          : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(new Date(complaint.dateFiled))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(complaint)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => openAssignModal(complaint)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Simple complaint count display */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </div>
        </div>
      </main>

      {/* Update Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Complaint: {selectedComplaint.tracking_id}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To Department User</label>
                  <select
                    value={updateData.assigned_to}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Unassigned</option>
                    {departmentUsers.map((user) => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.name} ({departments.find(d => d.id === user.department_id)?.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Reply</label>
                  <textarea
                    value={updateData.adminReply}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, adminReply: e.target.value }))}
                    rows={4}
                    className="form-input"
                    placeholder="Enter official reply..."
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

      {/* Assignment Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Complaint: {selectedComplaint.tracking_id}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{selectedComplaint.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedComplaint.department} - {selectedComplaint.category}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{selectedComplaint.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To Department User</label>
                <select
                  value={assignmentData.assigned_to}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select User</option>
                  {departmentUsers
                    .filter(user => {
                      // Filter by admin's department - admin should only assign to users in their department
                      return admin && admin.department_id ? user.department_id === admin.department_id : false;
                    })
                    .map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.name} ({departments.find(d => d.id === user.department_id)?.name})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only showing users from your department: {admin?.department_id && departments.find(d => d.id === admin.department_id)?.name}</p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignComplaint}
                  disabled={assigning || !assignmentData.assigned_to}
                  className="btn-primary disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

