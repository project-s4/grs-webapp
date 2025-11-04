'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

interface LoginFormData {
  email: string;
  password: string;
}

export default function DepartmentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'department' || payload.role === 'department_admin') {
          window.location.href = redirect || '/department/dashboard';
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [redirect]);

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const result = await response.json();
      
      if (!response.ok) {
        const errorMessage = result.message || result.details || result.error || 'Login failed. Please check your credentials.';
        toast.error(errorMessage);
        return;
      }

      // Store token
      const token = result.access_token || result.token;
      if (!token) {
        toast.error('Login failed: No token received');
        return;
      }

      localStorage.setItem('token', token);

      // Check if user is actually a department user
      if (result.user) {
        if (result.user.role === 'department' || result.user.role === 'department_admin') {
          toast.success('Login successful!');
          window.location.href = redirect || '/department/dashboard';
        } else {
          toast.error('Access denied. Department credentials required.');
          localStorage.removeItem('token');
        }
      } else {
        // If user data not in response, decode from token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'department' || payload.role === 'department_admin') {
            toast.success('Login successful!');
            window.location.href = redirect || '/department/dashboard';
          } else {
            toast.error('Access denied. Department credentials required.');
            localStorage.removeItem('token');
          }
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
          toast.error('Login failed: Invalid token format');
          localStorage.removeItem('token');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const footerLinks = [
    { label: 'Need admin access?', href: '/admin/login', color: 'red' },
    { label: 'Are you a citizen?', href: '/login' },
    { label: '', href: '/' }
  ];

  return (
    <LoginPageLayout 
      title="Department Login" 
      subtitle="Access your assigned complaints dashboard"
      footerLinks={footerLinks}
    >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
    </LoginPageLayout>
  );
}
