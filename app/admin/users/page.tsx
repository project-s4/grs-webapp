'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/src/lib/utils';
import { DashboardLayout, StatCard, EmptyState } from '@/components/dashboard';
import { 
  Home, Users, UserPlus, Search, Shield, User as UserIcon,
  Mail, Building, Calendar, ChevronLeft, ChevronRight, Filter, Inbox
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BarChart3 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id?: number;
  department_name?: string;
  created_at?: string;
}

export default function UsersPage() {
  const [admin, setAdmin] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    role: '',
    search: ''
  });

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (admin) {
      fetchUsers();
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
      fetchUsers();
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/admin/login';
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (filters.role) queryParams.append('role', filters.role);

      const response = await fetch(`/api/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.pagination?.total || data.users.length);
        setTotalPages(data.pagination?.pages || 1);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load users. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(user => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'department':
      case 'department_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'citizen':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return Shield;
      case 'department':
      case 'department_admin':
        return Building;
      default:
        return UserIcon;
    }
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Users</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching all users...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'All Complaints', href: '/admin/complaints', icon: Inbox },
    { label: 'Users', href: '/admin/users', icon: Users, active: true },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
  ];

  const roleCounts = {
    admin: users.filter(u => u.role === 'admin').length,
    department: users.filter(u => u.role === 'department' || u.role === 'department_admin').length,
    citizen: users.filter(u => u.role === 'citizen').length,
  };

  return (
    <DashboardLayout
      user={{ name: admin.name || 'Admin', email: admin.email, role: 'admin' }}
      navItems={navItems}
      onLogout={handleLogout}
      title="Users"
      showSearch={false}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage all system users</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={total}
          icon={Users}
          colorScheme="primary"
        />
        <StatCard
          title="Admins"
          value={roleCounts.admin}
          icon={Shield}
          colorScheme="error"
        />
        <StatCard
          title="Department Users"
          value={roleCounts.department}
          icon={Building}
          colorScheme="info"
        />
      </div>

      {/* Filters */}
      <div className="card-glass mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="form-select"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="department">Department User</option>
              <option value="department_admin">Department Admin</option>
              <option value="citizen">Citizen</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-glass overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
            All Users
            <span className="ml-3 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
              {filteredUsers.length}
            </span>
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your filters"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <RoleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {user.role === 'department_admin' ? 'Dept Admin' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {user.department_name || (
                            <span className="text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {user.created_at ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {formatDate(new Date(user.created_at))}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
    </DashboardLayout>
  );
}

