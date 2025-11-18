'use client';

import { useState, useEffect } from 'react';
import { Building, Mail, Lock, ArrowLeft, CheckCircle, LogIn, Edit, X } from 'lucide-react';
import { useAuth } from '@/src/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Complaint {
  id: string;
  reference_no?: string;
  tracking_id?: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  department_name?: string;
}

interface User {
  id: string;
  role: string;
  department_id?: string;
}

type View = 'login' | 'dashboard' | 'details';

export default function DepartmentPortalPage({ params }: { params: { dept: string } | Promise<{ dept: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, loading: authLoading } = useAuth();
  const [resolvedParams, setResolvedParams] = useState<{ dept: string } | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateComplaintId, setUpdateComplaintId] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const TOKEN_KEY = 'auth_token';

  // Helper to get token from localStorage
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  };

  // Handle async params in Next.js 14
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = params instanceof Promise ? await params : params;
        if (resolved?.dept) {
          setResolvedParams(resolved);
        }
      } catch (err) {
        console.error('Error resolving params:', err);
      }
    };
    resolveParams();
  }, [params]);

  // Check authentication and fetch department on mount
  useEffect(() => {
    if (!resolvedParams?.dept) return;

    const init = async () => {
      try {
        setLoading(true);

        // Fetch departments and find matching one
        const deptResponse = await fetch('/api/departments');
        if (!deptResponse.ok) {
          throw new Error('Failed to fetch departments');
        }
        
        const departments: Department[] = await deptResponse.json();
        const deptParam = resolvedParams.dept.toLowerCase();
        
        // Try to match by code first (case-insensitive)
        let foundDept = departments.find(
          d => d.code?.toLowerCase() === deptParam
        );
        
        // Fallback to name match (case-insensitive)
        if (!foundDept) {
          foundDept = departments.find(
            d => d.name?.toLowerCase().includes(deptParam) || deptParam.includes(d.name?.toLowerCase() || '')
          );
        }

        if (!foundDept) {
          setError(`Department "${resolvedParams.dept}" not found`);
          setLoading(false);
          return;
        }

        setDepartment(foundDept);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize page');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [resolvedParams]);

  // Check authentication status and redirect
  useEffect(() => {
    if (authLoading || !resolvedParams?.dept || !department) return;

    // Check if user is authenticated
    const checkAuth = async () => {
      const token = getToken();
      
      if (token && user) {
        // Verify user has department role
        // For now, allow any department user to access any department portal
        // Department-specific access can be enforced later via department_id matching
        const hasDepartmentRole = user.role === 'department' || 
                                  user.role === 'department_admin' || 
                                  user.role === 'department_officer';
        
        if (hasDepartmentRole) {
          setCurrentView('dashboard');
          await fetchComplaints(department.id, token);
        } else {
          // User doesn't have department role
          setCurrentView('login');
        }
      } else {
        // No token or user - show login
        setCurrentView('login');
      }
    };

    checkAuth();
  }, [authLoading, user, department, resolvedParams]);

  // Fetch complaints filtered by department
  const fetchComplaints = async (departmentId: string, token?: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/complaints?department_id=${departmentId}&limit=100`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired - clear token
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
          }
          setCurrentView('login');
          return;
        }
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      let complaintsData: Complaint[] = [];
      
      if (Array.isArray(data)) {
        complaintsData = data;
      } else if (data.complaints && Array.isArray(data.complaints)) {
        complaintsData = data.complaints;
      }

      // Sort by date (newest first)
      complaintsData.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setComplaints(complaintsData);
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    try {
      setIsSigningIn(true);
      await login(username, password);
      
      // Wait for auth context to update user state
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check current user from auth context
        const currentUser = user;
        
        if (currentUser) {
          // For demo: allow any authenticated user to access department portals
          // In production, enforce department role and department_id matching
          const hasDepartmentRole = currentUser.role === 'department' || 
                                    currentUser.role === 'department_admin' || 
                                    currentUser.role === 'department_officer' ||
                                    currentUser.role === 'admin';  // Admins can access all portals
          
          if (hasDepartmentRole || true) {  // Temporary: allow all users for demo
            setCurrentView('dashboard');
            const token = getToken();
            if (token && department) {
              await fetchComplaints(department.id, token);
            }
            setIsSigningIn(false);
            return;
          } else {
            alert('Access denied. You need a department role to access this portal.');
            setIsSigningIn(false);
            return;
          }
        }
        
        attempts++;
      }
      
      // If we still don't have user after waiting, show error
      alert('Login successful but could not verify access. Please refresh the page.');
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle viewing complaint details
  const viewDetails = async (complaintId: string) => {
    try {
      // Get token from localStorage
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/complaints/${complaintId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaint details');
      }

      const complaint = await response.json();
      setSelectedComplaint(complaint);
      setStatusUpdate(complaint.status || 'new');
      setCurrentView('details');
    } catch (err: any) {
      console.error('Error fetching complaint details:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Open update modal
  const openUpdateModal = (complaintId: string) => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint) {
      setUpdateComplaintId(complaintId);
      // Map status to backend format
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
      setStatusUpdate(backendStatus);
      setShowUpdateModal(true);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateComplaintId && !selectedComplaint) return;

    setUpdatingStatus(true);
    try {
      // Get token from localStorage
      const token = getToken();
      const complaintId = updateComplaintId || selectedComplaint?.id;
      
      if (!complaintId) {
        throw new Error('No complaint selected');
      }

      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      alert('Status updated successfully!');
      
      // Update the complaint in state
      if (updateComplaintId) {
        setComplaints(complaints.map(c => 
          c.id === updateComplaintId ? { ...c, status: statusUpdate } : c
        ));
        setShowUpdateModal(false);
        setUpdateComplaintId(null);
      } else if (selectedComplaint) {
        setSelectedComplaint({ ...selectedComplaint, status: statusUpdate });
      }
      
      // Refresh complaints list
      if (department) {
        const token = getToken();
        await fetchComplaints(department.id, token || undefined);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'new': 'New',
      'triaged': 'Triaged',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'escalated': 'Escalated',
      'closed': 'Closed',
      'pending': 'Pending',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Get status badge class with dark mode support
  const getStatusClass = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    if (normalized.includes('pending') || normalized === 'new') {
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    } else if (normalized.includes('progress')) {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    } else if (normalized.includes('resolved')) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    } else if (normalized.includes('escalated')) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    } else if (normalized.includes('closed')) {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Get tracking ID
  const getTrackingId = (complaint: Complaint) => {
    return complaint.reference_no || complaint.tracking_id || complaint.id?.substring(0, 8) || 'N/A';
  };

  // Check if user can update status
  const canUpdateStatus = user && (user.role === 'department' || user.role === 'department_admin' || user.role === 'department_officer' || user.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Department Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const departmentName = department?.name || resolvedParams?.dept.toUpperCase() || 'Department';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-4 flex items-center justify-center shadow-md border-b-4 border-blue-600 dark:border-blue-500">
        <div className="flex items-center gap-4">
          <Building className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-semibold">
            {departmentName} Complaint Management Portal
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 flex justify-center items-start">
        {/* Login Page */}
        {currentView === 'login' && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-center text-blue-800 dark:text-blue-400 text-3xl font-bold mb-8">Officer Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Any username and password will work. Department role is assigned in the database.
                  </p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn || authLoading}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  {isSigningIn ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Page */}
        {currentView === 'dashboard' && (
          <div className="w-full max-w-6xl animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-center text-blue-800 dark:text-blue-400 text-3xl font-bold mb-8">Complaints Dashboard</h2>
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No complaints found for this department.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="dept-table w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500 rounded-l-lg">Complaint ID</th>
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500">Citizen Name</th>
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500">Department</th>
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500">Status</th>
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500">Date Filed</th>
                        <th className="px-4 py-4 text-left text-blue-800 dark:text-blue-400 font-semibold border-t-2 border-b-2 border-blue-600 dark:border-blue-500 rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => {
                        const statusClass = getStatusClass(complaint.status);
                        return (
                          <tr
                            key={complaint.id}
                            className="bg-white dark:bg-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                            onClick={() => viewDetails(complaint.id)}
                          >
                            <td className="px-4 py-5 rounded-l-lg text-gray-900 dark:text-white" data-label="Complaint ID">
                              <strong className="font-mono">{getTrackingId(complaint)}</strong>
                            </td>
                            <td className="px-4 py-5 text-gray-900 dark:text-white" data-label="Citizen Name">{complaint.user_name || 'N/A'}</td>
                            <td className="px-4 py-5 text-gray-900 dark:text-white" data-label="Department">{complaint.department_name || 'N/A'}</td>
                            <td className="px-4 py-5" data-label="Status">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                {formatStatus(complaint.status)}
                              </span>
                            </td>
                            <td className="px-4 py-5 text-gray-900 dark:text-white" data-label="Date Filed">{formatDate(complaint.created_at)}</td>
                            <td className="px-4 py-5 rounded-r-lg" data-label="Action">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewDetails(complaint.id);
                                  }}
                                  className="bg-transparent text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-600 dark:border-blue-500 font-semibold text-xs hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all"
                                >
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUpdateModal(complaint.id);
                                  }}
                                  className="bg-transparent text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-600 dark:border-green-500 font-semibold text-xs hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Page */}
        {currentView === 'details' && selectedComplaint && (
          <div className="w-full max-w-4xl animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-center text-blue-800 dark:text-blue-400 text-3xl font-bold mb-8">Complaint Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Complaint ID:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{getTrackingId(selectedComplaint)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Citizen Name:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedComplaint.user_name || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Citizen Email:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedComplaint.user_email || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Department:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedComplaint.department_name || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Date Filed:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{formatDate(selectedComplaint.created_at)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Current Status:</strong>
                  <p className="text-lg text-gray-900 dark:text-white" id="current-status">{selectedComplaint.status}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 md:col-span-2">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Title:</strong>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedComplaint.title}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 md:col-span-2">
                  <strong className="block text-blue-800 dark:text-blue-400 mb-2 text-sm font-semibold">Full Description:</strong>
                  <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
              </div>

              {canUpdateStatus && (
                <form onSubmit={handleStatusUpdate} className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600 flex items-center gap-4 flex-wrap">
                  <label htmlFor="status-select" className="font-semibold text-gray-700 dark:text-gray-300">Update Status:</label>
                  <select
                    id="status-select"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 min-w-[200px] focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{updatingStatus ? 'Updating...' : 'Update Status'}</span>
                  </button>
                </form>
              )}

              <button
                onClick={() => setCurrentView('dashboard')}
                className="mt-6 bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-600 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showUpdateModal && updateComplaintId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Update Complaint Status</h3>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateComplaintId(null);
                    setStatusUpdate('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Complaint ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {complaints.find(c => c.id === updateComplaintId)?.reference_no || complaints.find(c => c.id === updateComplaintId)?.tracking_id || updateComplaintId}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Title: <span className="font-semibold text-gray-900 dark:text-white">
                    {complaints.find(c => c.id === updateComplaintId)?.title || 'N/A'}
                  </span>
                </p>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label htmlFor="status-select-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    id="status-select-modal"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateModal(false);
                      setUpdateComplaintId(null);
                      setStatusUpdate('');
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white text-center py-4 text-sm">
        <p>This is a simulated {departmentName} website for educational purposes only.</p>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (max-width: 768px) {
          .dept-table thead {
            display: none;
          }
          .dept-table, .dept-table tbody, .dept-table tr, .dept-table td {
            display: block;
            width: 100%;
          }
          .dept-table tr {
            margin-bottom: 1rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-radius: 8px;
          }
          .dept-table td {
            text-align: right;
            padding-left: 50%;
            position: relative;
            border: none;
            border-bottom: 1px solid #eee;
          }
          .dept-table td:first-child {
            border-radius: 8px 8px 0 0;
          }
          .dept-table td:last-child {
            border-radius: 0 0 8px 8px;
            border-bottom: none;
          }
          .dept-table td::before {
            content: attr(data-label);
            position: absolute;
            left: 1rem;
            width: 45%;
            text-align: left;
            font-weight: 600;
            color: #0a58ca;
          }
          @media (prefers-color-scheme: dark) {
            .dept-table td::before {
              color: #60a5fa;
            }
          }
        }
      `}} />
    </div>
  );
}

