'use client';

import { useState, useEffect } from 'react';
import { Building, Mail, Lock, ArrowLeft, CheckCircle, LogIn } from 'lucide-react';

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
  const [resolvedParams, setResolvedParams] = useState<{ dept: string } | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('login');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [statusUpdate, setStatusUpdate] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
        
        // Check if user is authenticated
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }

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
        
        // If authenticated, fetch complaints for this department
        if (token) {
          await fetchComplaints(foundDept.id, token);
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize page');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [resolvedParams]);

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
          // Token expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
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
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token', data.access_token); // Also store as 'token' for compatibility
      if (data.user) {
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('user_id', data.user.id);
        if (data.user.department_id) {
          localStorage.setItem('department_id', data.user.department_id);
        }
      }

      setIsAuthenticated(true);
      setCurrentView('dashboard');
      
      // Fetch complaints after login
      if (department) {
        await fetchComplaints(department.id, data.access_token);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      alert(`Login failed: ${err.message}`);
    }
  };

  // Handle viewing complaint details
  const viewDetails = async (complaintId: string) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
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

  // Handle status update
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
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
      setSelectedComplaint({ ...selectedComplaint, status: statusUpdate });
      
      // Refresh complaints list
      if (department) {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        await fetchComplaints(department.id, token || undefined);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, '');
    if (normalized.includes('pending') || normalized === 'new') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalized.includes('progress')) {
      return 'bg-blue-100 text-blue-800';
    } else if (normalized.includes('resolved')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
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
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
  const canUpdateStatus = userRole === 'department' || userRole === 'department_admin' || userRole === 'department_officer' || userRole === 'admin';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white text-blue-600 px-8 py-4 flex items-center justify-center shadow-md border-b-4 border-blue-600">
        <div className="flex items-center gap-4">
          <Building className="w-10 h-10 text-blue-600" />
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
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-center text-blue-800 text-3xl font-bold mb-8">Officer Login</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-6 relative">
                  <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="mb-6 relative">
                  <label htmlFor="password" className="block mb-2 font-semibold text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Page */}
        {currentView === 'dashboard' && (
          <div className="w-full max-w-6xl animate-fadeIn">
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-center text-blue-800 text-3xl font-bold mb-8">Complaints Dashboard</h2>
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No complaints found for this department.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="dept-table w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600 rounded-l-lg">Complaint ID</th>
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600">Citizen Name</th>
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600">Department</th>
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600">Status</th>
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600">Date Filed</th>
                        <th className="px-4 py-4 text-left text-blue-800 font-semibold border-t-2 border-b-2 border-blue-600 rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => {
                        const statusClass = getStatusClass(complaint.status);
                        return (
                          <tr
                            key={complaint.id}
                            className="bg-white hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer rounded-lg"
                            onClick={() => viewDetails(complaint.id)}
                          >
                            <td className="px-4 py-5 rounded-l-lg" data-label="Complaint ID">
                              <strong className="font-mono">{getTrackingId(complaint)}</strong>
                            </td>
                            <td className="px-4 py-5" data-label="Citizen Name">{complaint.user_name || 'N/A'}</td>
                            <td className="px-4 py-5" data-label="Department">{complaint.department_name || 'N/A'}</td>
                            <td className="px-4 py-5" data-label="Status">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                {complaint.status}
                              </span>
                            </td>
                            <td className="px-4 py-5" data-label="Date Filed">{formatDate(complaint.created_at)}</td>
                            <td className="px-4 py-5 rounded-r-lg" data-label="Action">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewDetails(complaint.id);
                                }}
                                className="bg-transparent text-blue-600 px-4 py-2 rounded-lg border border-blue-600 font-semibold text-sm hover:bg-blue-600 hover:text-white transition-all"
                              >
                                View
                              </button>
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
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-center text-blue-800 text-3xl font-bold mb-8">Complaint Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Complaint ID:</strong>
                  <p className="text-lg">{getTrackingId(selectedComplaint)}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Citizen Name:</strong>
                  <p className="text-lg">{selectedComplaint.user_name || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Citizen Email:</strong>
                  <p className="text-lg">{selectedComplaint.user_email || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Department:</strong>
                  <p className="text-lg">{selectedComplaint.department_name || 'N/A'}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Date Filed:</strong>
                  <p className="text-lg">{formatDate(selectedComplaint.created_at)}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Current Status:</strong>
                  <p className="text-lg" id="current-status">{selectedComplaint.status}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600 md:col-span-2">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Title:</strong>
                  <p className="text-lg">{selectedComplaint.title}</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-600 md:col-span-2">
                  <strong className="block text-blue-800 mb-2 text-sm font-semibold">Full Description:</strong>
                  <p className="text-lg">{selectedComplaint.description}</p>
                </div>
              </div>

              {canUpdateStatus && (
                <form onSubmit={handleStatusUpdate} className="mt-8 pt-8 border-t border-gray-300 flex items-center gap-4 flex-wrap">
                  <label htmlFor="status-select" className="font-semibold text-gray-700">Update Status:</label>
                  <select
                    id="status-select"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 min-w-[200px] focus:outline-none focus:border-blue-600"
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
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{updatingStatus ? 'Updating...' : 'Update Status'}</span>
                  </button>
                </form>
              )}

              <button
                onClick={() => setCurrentView('dashboard')}
                className="mt-6 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-900 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 text-sm">
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
        }
      `}} />
    </div>
  );
}

