'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { departmentService, Department } from '@/src/services/departments';
import toast from 'react-hot-toast';
import LoginPageLayout from '@/src/components/LoginPageLayout';
import { useAuth } from '@/src/contexts/auth-context';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    role: z.enum(['citizen', 'admin', 'department'] as const).default('citizen'),
    department_id: z.string().optional(),
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
  const searchParams = useSearchParams();
  const supabaseUserId = searchParams.get('supabase_user_id');
  const email = searchParams.get('email');
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      role: 'citizen',
      department_id: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    // If no supabase_user_id, redirect to login
    if (!supabaseUserId && !user) {
      router.push('/login');
      return;
    }

    // Set email if available
    if (email) {
      // Email is read-only, just display it
    }

    fetchDepartments();
  }, [supabaseUserId, email, user, router]);

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

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (!supabaseUserId && !user) {
        toast.error('Authentication required. Please sign in first.');
        router.push('/login');
        return;
      }

      const userId = supabaseUserId || user?.id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      let departmentId: string | undefined = undefined;
      if (data.department_id) {
        if (isValidUUID(data.department_id)) {
          departmentId = data.department_id;
        } else {
          const selectedDept = departments.find(dept => dept.id === data.department_id);
          if (selectedDept && isValidUUID(selectedDept.id)) {
            departmentId = selectedDept.id;
          } else {
            toast.error('Invalid department selected');
            return;
          }
        }
      }

      const profileData = {
        name: data.name,
        phone: data.phone,
        email: email || user?.email || '',
        role: data.role || 'citizen',
        department_id: departmentId,
        supabase_user_id: userId,
      };

      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profile created successfully!');
        // Redirect based on role
        if (result.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.role === 'department' || result.role === 'department_admin') {
          router.push('/department/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      } else {
        const errorMessage = result.message || result.details || result.error || 'Profile creation failed';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Profile creation failed:', error);
      toast.error(error.message || 'An unexpected error occurred');
    }
  };

  const footerLinks = [
    { label: 'Already have an account?', href: '/login' },
  ];

  return (
    <LoginPageLayout
      title="Complete Your Profile"
      subtitle="Please provide additional information to complete your registration"
      type="citizen"
      footerLinks={footerLinks}
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {email && (
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="form-input bg-gray-100 dark:bg-gray-800"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Email is set from your OAuth account
            </p>
          </div>
        )}

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
                Creating profile...
              </div>
            ) : (
              'Complete Registration'
            )}
          </button>
        </div>
      </form>
    </LoginPageLayout>
  );
}
