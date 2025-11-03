'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout, StatCard } from '@/components/dashboard';
import { 
  Home, BarChart3, TrendingUp, FileText, Clock, CheckCircle, Activity,
  Users, PieChart, Building, AlertCircle, Inbox
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  total_complaints: number;
  pending_complaints: number;
  in_progress: number;
  resolved: number;
  department_stats?: Array<{ name: string; count: number }>;
}

export default function AnalyticsPage() {
  const [admin, setAdmin] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePage();
  }, []);

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
      fetchAnalytics();
    } catch (error) {
      console.error('Invalid token:', error);
      window.location.href = '/admin/login';
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load analytics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const calculateResolutionRate = () => {
    if (!analytics || analytics.total_complaints === 0) return 0;
    return Math.round((analytics.resolved / analytics.total_complaints) * 100);
  };

  const calculateAverageProcessing = () => {
    if (!analytics || analytics.total_complaints === 0) return 'N/A';
    const active = analytics.in_progress + analytics.pending_complaints;
    if (active === 0) return '100%';
    return Math.round((analytics.resolved / analytics.total_complaints) * 100) + '%';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6 border-t-primary-600 dark:border-t-primary-400"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Analytics</h3>
          <p className="text-gray-600 dark:text-gray-300">Fetching analytics data...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'All Complaints', href: '/admin/complaints', icon: Inbox },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, active: true }
  ];

  return (
    <DashboardLayout
      user={{ name: admin.name || 'Admin', email: admin.email, role: 'admin' }}
      navItems={navItems}
      onLogout={handleLogout}
      title="Analytics"
      showSearch={false}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into system performance</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Complaints"
          value={analytics?.total_complaints || 0}
          icon={FileText}
          colorScheme="primary"
        />
        <StatCard
          title="Pending"
          value={analytics?.pending_complaints || 0}
          icon={Clock}
          colorScheme="warning"
        />
        <StatCard
          title="In Progress"
          value={analytics?.in_progress || 0}
          icon={Activity}
          colorScheme="info"
        />
        <StatCard
          title="Resolved"
          value={analytics?.resolved || 0}
          icon={CheckCircle}
          colorScheme="success"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resolution Rate</h3>
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
              {calculateResolutionRate()}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analytics?.resolved || 0} of {analytics?.total_complaints || 0} complaints resolved
            </p>
          </div>
        </div>

        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Complaints</h3>
              <Activity className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
            <div className="text-4xl font-bold text-info-600 dark:text-info-400 mb-2">
              {(analytics?.pending_complaints || 0) + (analytics?.in_progress || 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Currently being processed
            </p>
          </div>
        </div>

        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processing Efficiency</h3>
              <PieChart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {calculateAverageProcessing()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall completion rate
            </p>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      {analytics?.department_stats && analytics.department_stats.length > 0 && (
        <div className="card-glass mb-6">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Building className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Complaints by Department</h2>
            </div>
            <div className="space-y-4">
              {analytics.department_stats.map((dept, index) => {
                const percentage = analytics.total_complaints > 0 
                  ? Math.round((dept.count / analytics.total_complaints) * 100) 
                  : 0;
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {dept.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-warning-600 dark:text-warning-400" />
                Pending
              </h3>
            </div>
            <div className="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-2">
              {analytics?.pending_complaints || 0}
            </div>
            {analytics && analytics.total_complaints > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((analytics.pending_complaints / analytics.total_complaints) * 100)}% of total
              </div>
            )}
          </div>
        </div>

        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-info-600 dark:text-info-400" />
                In Progress
              </h3>
            </div>
            <div className="text-3xl font-bold text-info-600 dark:text-info-400 mb-2">
              {analytics?.in_progress || 0}
            </div>
            {analytics && analytics.total_complaints > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((analytics.in_progress / analytics.total_complaints) * 100)}% of total
              </div>
            )}
          </div>
        </div>

        <div className="card-glass">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-success-600 dark:text-success-400" />
                Resolved
              </h3>
            </div>
            <div className="text-3xl font-bold text-success-600 dark:text-success-400 mb-2">
              {analytics?.resolved || 0}
            </div>
            {analytics && analytics.total_complaints > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((analytics.resolved / analytics.total_complaints) * 100)}% of total
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

