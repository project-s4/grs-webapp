'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import LoginPageLayout from '@/src/components/LoginPageLayout';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'citizen') {
          window.location.href = redirect || '/user/dashboard';
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [redirect]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      localStorage.setItem('token', result.token);
      toast.success('Login successful!');
      
      // Navigate based on role
      if (result.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (result.user.role === 'department' || result.user.role === 'department_admin') {
        window.location.href = '/department/dashboard';
      } else {
        window.location.href = '/user/dashboard';
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const footerLinks = [
    { label: "Don't have an account?", href: '/register' },
    { label: 'Are you a department user?', href: '/department/login', color: 'blue' },
    { label: 'Are you an admin?', href: '/admin/login', color: 'red' },
    { label: '', href: '/' }
  ];

  return (
    <LoginPageLayout 
      title="Citizen Login" 
      subtitle="Sign in to file complaints and track your submissions"
      type="citizen"
      footerLinks={footerLinks}
    >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email address"
                {...register('email')}
              />
              {errors.email && (
                <p className="form-error">
                  <span className="mr-1">⚠</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="Enter your password"
                {...register('password')}
              />
              {errors.password && (
                <p className="form-error">
                  <span className="mr-1">⚠</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary btn-lg w-full"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
        </form>
    </LoginPageLayout>
  );
}
