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
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
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
        if (payload.role === 'admin') {
          window.location.href = redirect || '/admin/dashboard';
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

      // Check if user is actually an admin
      if (result.user.role === 'admin') {
        localStorage.setItem('token', result.token);
        toast.success('Login successful!');
        window.location.href = redirect || '/admin/dashboard';
      } else {
        toast.error('Access denied. Admin credentials required.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const footerLinks = [
    { label: 'Are you a department user?', href: '/department/login', color: 'blue' },
    { label: 'Are you a regular citizen?', href: '/login' },
    { label: '', href: '/' }
  ];

  return (
    <LoginPageLayout 
      title="Admin Login" 
      subtitle="For system administrators only"
      footerLinks={footerLinks}
    >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in as Admin'}
              </button>
            </div>
        </form>
    </LoginPageLayout>
  );
}
