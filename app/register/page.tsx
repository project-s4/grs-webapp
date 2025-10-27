'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { departmentService, Department } from '@/src/services/departments';
import toast from 'react-hot-toast';
import LoginPageLayout from '@/src/components/LoginPageLayout';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['citizen', 'admin', 'department'] as const).default('citizen'),
    department_id: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => {
    if ((data.role === 'department' || data.role === 'admin') && !data.department_id) {
      return false;
    }
    return true;
  }, {
    message: "Department is required for admin and department users",
    path: ['department_id'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any, // Type assertion to avoid complex type issues
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'citizen',
      department_id: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const departmentList = await departmentService.getDepartments();
        setDepartments(departmentList);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      const registerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role || 'citizen',
        ...(data.department_id && { department_id: parseInt(data.department_id) }),
      };
      
      // Call the registration API directly
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Account created successfully!');
        router.push('/login');
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    }
  };

  const footerLinks = [
    { label: 'Already have an account?', href: '/login' },
  ];

  return (
    <LoginPageLayout
      title="Create Account"
      subtitle="Register to file complaints and track your submissions"
      type="citizen"
      footerLinks={footerLinks}
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            className="form-input"
            placeholder="Enter your full name"
            {...register('name')}
          />
          {errors.name && (
            <p className="form-error">
              <span className="mr-1">⚠</span>
              {errors.name.message}
            </p>
          )}
        </div>

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
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            required
            className="form-input"
            placeholder="Enter your phone number"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="form-error">
              <span className="mr-1">⚠</span>
              {errors.phone.message}
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
            autoComplete="new-password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="form-input"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="form-error">
              <span className="mr-1">⚠</span>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="role" className="form-label">
            Account Type
          </label>
          <select
            id="role"
            className="form-input"
            {...register('role')}
          >
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
            <option value="department">Department User</option>
          </select>
          {errors.role && (
            <p className="form-error">
              <span className="mr-1">⚠</span>
              {errors.role.message}
            </p>
          )}
        </div>

        {(selectedRole === 'department' || selectedRole === 'admin') && (
          <div className="form-group">
            <label htmlFor="department_id" className="form-label">
              Department
            </label>
            <select
              id="department_id"
              className="form-input"
              {...register('department_id')}
              disabled={loadingDepartments}
            >
              <option value="">Select a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department_id && (
              <p className="form-error">
                <span className="mr-1">⚠</span>
                {errors.department_id.message}
              </p>
            )}
            {loadingDepartments && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Loading departments...</p>
            )}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary btn-lg w-full"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner w-5 h-5 mr-2"></div>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </LoginPageLayout>
  );
}
