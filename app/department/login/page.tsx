'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/auth-context';
import LoginPageLayout from '@/components/LoginPageLayout';

interface LoginFormData {
  email: string;
  password: string;
}

export default function DepartmentLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [redirect, setRedirect] = useState<string | null>(null);

  // Safely get redirect parameter on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setRedirect(searchParams.get('redirect'));
    }
  }, []);

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.email, data.password);
      if (result.success && result.user) {
        toast.success('Login successful!');
        
        // Check if user is department user
        if (result.user.role === 'department' || result.user.role === 'department_admin') {
          window.location.href = redirect || '/department/dashboard';
        } else {
          toast.error('Access denied. Department credentials required.');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
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
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
              />
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
