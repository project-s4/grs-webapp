'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge, categories } from '@/src/lib/utils';
import { DashboardLayout, StatCard, FilterBar, EmptyState } from '@/components/dashboard';
import { toast } from 'react-hot-toast';
import { 
  FileText, Home, Inbox, Clock, CheckCircle, Activity, List, Edit, Eye, X
} from 'lucide-react';

interface Complaint {
  _id: string;
  id: string;
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
  user_id: string | null;
  department_id: string | null;
  assigned_to: string | null;
}

interface DepartmentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string | null;
}

export default function DepartmentDashboardPage() {
  const [user, setUser] = useState<DepartmentUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updateData, setUpdateData] = useState({ status: '', adminReply: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  // Auto-refresh assigned complaints every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('[Department Dashboard] Auto-refreshing assigned complaints...');
      fetchAssignedComplaints();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const initializePage = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/department/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check for all department-related roles
      if (payload.role !== 'department' && payload.role !== 'department_admin' && payload.role !== 'department_officer') {
        window.location.href = '/department/login';
        return;
      }
      
      // Extract user ID - try multiple possible fields
      const userId = payload.id || payload.user_id || payload.sub || payload.userId;
      console.log('[Department Dashboard] JWT payload:', { 
        id: userId, 
        name: payload.name, 
        email: payload.email, 
        role: payload.role,
        allFields: Object.keys(payload)
      });
      
      const userData = {
        id: userId,
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
    if (!currentUser) {
      console.warn('[Department Dashboard] No user data available to fetch complaints');
      return;
    }

    try {
      // Ensure user ID is in correct format (UUID string)
      const userId = currentUser.id?.toString() || '';
      console.log('[Department Dashboard] Fetching complaints assigned to user:', userId);
      console.log('[Department Dashboard] User data:', { id: currentUser.id, name: currentUser.name, email: currentUser.email });
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50', // Increased limit to show more complaints
        assigned_to: userId,
      });

      const token = localStorage.getItem('token');
      const url = `/api/complaints?${params}`;
      console.log('[Department Dashboard] Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      console.log('[Department Dashboard] Response status:', response.status);
      console.log('[Department Dashboard] Complaints received:', data.complaints?.length || 0);
      console.log('[Department Dashboard] Raw complaints data:', data.complaints);

      if (response.ok) {
        // Transform backend data to match frontend interface
        const transformedComplaints = (data.complaints || []).map((complaint: any) => {
          // Parse date safely
          let dateFiled = '';
          if (complaint.created_at) {
            try {
              const date = new Date(complaint.created_at);
              dateFiled = isNaN(date.getTime()) ? '' : complaint.created_at;
            } catch {
              dateFiled = '';
            }
          }
          
          return {
            _id: complaint.id || complaint._id,
            id: complaint.id || complaint._id,
            trackingId: complaint.tracking_id || complaint.reference_no || complaint.id?.substring(0, 8) || '',
            title: complaint.title || '',
            description: complaint.description || '',
            name: complaint.user_name || complaint.name || 'Anonymous',
            email: complaint.user_email || complaint.email || '',
            department: complaint.department_name || complaint.department || '',
            category: complaint.category || 'General',
            status: complaint.status || 'Pending',
            dateFiled: dateFiled || complaint.updated_at || new Date().toISOString(),
            adminReply: complaint.admin_reply || '',
            updatedAt: complaint.updated_at || complaint.created_at || new Date().toISOString(),
            user_id: complaint.user_id || null,
            department_id: complaint.department_id || null,
            assigned_to: complaint.assigned_to || null,
          };
        });
        
        console.log('[Department Dashboard] Transformed complaints:', transformedComplaints);
        
        setComplaints(transformedComplaints);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
        
        if (transformedComplaints.length > 0) {
          console.log('[Department Dashboard] Successfully loaded', transformedComplaints.length, 'assigned complaints');
        } else {
          console.warn('[Department Dashboard] No complaints found assigned to user:', userId);
        }
      } else {
        console.error('[Department Dashboard] Failed to fetch complaints:', data);
        toast.error('Failed to load assigned complaints. Please refresh the page.');
      }
    } catch (error) {
      console.error('[Department Dashboard] Error fetching assigned complaints:', error);
      toast.error('Error loading complaints. Please try again.');
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
      toast.success('Complaint updated successfully!');
      setShowModal(false);
      setSelectedComplaint(null);
      setUpdateData({ status: '', adminReply: '' });
      fetchAssignedComplaints();
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      const errorMessage = error.message || 'An unexpected error occurred while updating the complaint. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const openDetailsModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
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
                      {complaint.dateFiled && complaint.dateFiled !== 'Invalid Date' 
                        ? formatDate(new Date(complaint.dateFiled)) 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openDetailsModal(complaint)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => openUpdateModal(complaint)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update
                        </button>
                      </div>
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

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complaint Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedComplaint(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Tracking ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedComplaint.trackingId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Filed On</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedComplaint.dateFiled && selectedComplaint.dateFiled !== 'Invalid Date' 
                      ? formatDate(new Date(selectedComplaint.dateFiled)) 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.category}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Title</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedComplaint.title}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.adminReply && (
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Admin Notes</p>
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{selectedComplaint.adminReply}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Complainant</p>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.name || 'Anonymous'}</p>
                  {selectedComplaint.email && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">{selectedComplaint.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedComplaint(null);
                }}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
