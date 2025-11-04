'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
          router.push(redirect || '/user/dashboard');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [redirect]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      
      // Removed alert for cleaner flow
      console.log('=== LOGIN START ===');
      console.log('Login attempt for:', data.email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      console.log('Login response:', { ok: response.ok, status: response.status, result });
      
      if (!response.ok) {
        // Show detailed error message from the API
        const errorMessage = result.message || result.details || result.error || 'Login failed. Please check your credentials.';
        console.error('Login error:', errorMessage);
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-center',
        });
        return;
      }

      console.log('Full result:', result);
      console.log('Token:', result.access_token || result.token);
      console.log('User:', result.user);
      
      // Store token
      const token = result.access_token || result.token;
      if (token) {
        localStorage.setItem('token', token);
        toast.success('Login successful!', { duration: 2000 });
        
      // Navigate based on role - check both result.user and result
      const userRole = result.user?.role || result.role;
      console.log('User role:', userRole);
      console.log('About to redirect to /user/dashboard...');
        
      // Small delay to show success toast before redirect
      setTimeout(() => {
        console.log('Redirecting now to /user/dashboard');
        router.push('/user/dashboard');
      }, 1000);
      } else {
        console.error('No token in response');
        toast.error('Login failed: No token received');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
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
        <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(onSubmit)(e);
      }} className="space-y-6">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-12"
                  placeholder="Enter your password"
                  {...register('password')}
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
                <a href="/forgot-password" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200">
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
