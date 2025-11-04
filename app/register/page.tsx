'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { departmentService, Department } from '@/src/services/departments';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Helper function to validate UUID format
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const departmentList = await departmentService.getDepartments();

        // Normalize department IDs - ensure we have UUIDs
        // If backend returns numeric IDs, we'll need to fetch UUIDs separately
        // For now, use the IDs as returned (assuming backend returns UUIDs)
        setDepartments(departmentList);

        // Log department IDs for debugging
        if (departmentList.length > 0) {
          console.log('Fetched departments:', departmentList.map(d => ({ id: d.id, name: d.name, isUUID: isValidUUID(d.id) })));
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  // Helper function to fetch department UUID from backend if we only have numeric ID
  const fetchDepartmentUUID = async (numericId: string): Promise<string | null> => {
    try {
      // Try to fetch department by numeric ID to get its UUID
      const dept = await departmentService.getDepartmentById(numericId);
      if (dept && dept.id && isValidUUID(dept.id)) {
        return dept.id;
      }
      // If the department ID is already a UUID, return it
      if (dept && dept.id) {
        return dept.id;
      }
    } catch (error) {
      console.error('Failed to fetch department UUID:', error);
    }
    return null;
  };

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      // If department_id is provided, ensure it's a UUID string
      let departmentId: string | undefined = undefined;

      if (data.department_id) {
        // Check if it's already a UUID string
        if (isValidUUID(data.department_id)) {
          departmentId = data.department_id;
        } else {
          // If it's not a UUID, find the department from our list
          const selectedDept = departments.find(dept => dept.id === data.department_id);

          if (selectedDept) {
            // Check if the department ID from our list is a UUID
            if (isValidUUID(selectedDept.id)) {
              departmentId = selectedDept.id;
            } else {
              // Backend returned numeric ID, try to fetch UUID from backend
              console.log('Department ID is numeric, fetching UUID from backend...');
              const uuid = await fetchDepartmentUUID(selectedDept.id);

              if (uuid) {
                departmentId = uuid;
              } else {
                // If we can't get UUID, the backend might accept numeric ID
                // But based on error, it expects UUID, so show error
                toast.error('Unable to resolve department UUID. Please refresh the page and try again.');
                return;
              }
            }
          } else {
            toast.error('Invalid department selected. Please try again.');
            return;
          }
        }
      }

      const registerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role || 'citizen',
        // Send department_id only if it's a valid UUID string
        ...(departmentId && { department_id: departmentId }),
      };

      // Log the data being sent for debugging
      console.log('Registration data:', {
        ...registerData,
        password: '***', // Don't log password
        department_id: departmentId || 'none',
        department_id_isUUID: departmentId ? isValidUUID(departmentId) : false
      });

      // Call the registration API directly
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      console.log('Registration response:', { ok: response.ok, status: response.status, result });

      if (response.ok) {
        toast.success('Account created successfully!');
        router.push('/login');
      } else {
        // Show detailed error message from the API
        let errorMessage = 'Registration failed. Please try again.';

        // Handle different error response formats
        if (result.message) {
          errorMessage = result.message;
        } else if (result.details) {
          // Handle Pydantic validation errors
          if (Array.isArray(result.details)) {
            errorMessage = result.details.map((err: any) => {
              const field = err.loc?.join('.') || 'field';
              return `${field}: ${err.msg || err.message || 'Validation error'}`;
            }).join(', ');
          } else if (typeof result.details === 'string') {
            errorMessage = result.details;
          } else {
            errorMessage = JSON.stringify(result.details);
          }
        } else if (result.error) {
          errorMessage = result.error;
        }

        console.error('Registration error:', result);
        toast.error(errorMessage, {
          duration: 6000, // Show for 6 seconds to read longer messages
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="form-input pr-12"
              placeholder="Confirm your password"
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
