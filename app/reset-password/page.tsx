'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import LoginPageLayout from '@/src/components/LoginPageLayout';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/forgot-password');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();
      
      console.log('Reset password response:', { ok: response.ok, status: response.status, result });

      if (response.ok) {
        toast.success('Password has been reset successfully!', {
          duration: 5000,
          position: 'top-center',
        });
        
        // Redirect to login after a brief delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorMessage = result.message || result.details || result.error || 'Failed to reset password.';
        console.error('Reset password error:', errorMessage);
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Reset password failed:', error);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerLinks = [
    { label: 'Back to login', href: '/login' },
  ];

  if (!token) {
    return null;
  }

  return (
    <LoginPageLayout
      title="Set New Password"
      subtitle="Enter your new password below"
      type="citizen"
      footerLinks={footerLinks}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="form-input pr-12"
              placeholder="Enter your new password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="form-input pr-12"
              placeholder="Confirm your new password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="form-error">
              <span className="mr-1">⚠</span>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary btn-lg w-full"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </LoginPageLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <LoginPageLayout title="Reset Password" subtitle="Loading..." type="citizen" footerLinks={[]}>
        <div className="text-center">Loading...</div>
      </LoginPageLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

