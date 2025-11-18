'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Mic, Camera, FileText, Keyboard, MicOff } from 'lucide-react';
import VoiceImageComplaintForm from '@/src/components/VoiceImageComplaintForm';
import AuthGuard from '@/src/components/auth-guard';
import { complaintService, ComplaintCreate } from '@/src/services/complaints';
import { departmentService, Department } from '@/src/services/departments';
import toast from 'react-hot-toast';

function ComplaintPageContent() {
  // Form state management
  const [success, setSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complaint filing mode: 'manual' or 'voice'
  const [filingMode, setFilingMode] = useState<'manual' | 'voice'>('manual');

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    department_code: '',
    category: '',
    description: '',
    complaintType: '',
    mediaType: ''
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentData = await departmentService.getDepartments();
        console.log('Fetched departments:', departmentData);
        console.log('Number of departments:', Array.isArray(departmentData) ? departmentData.length : 'not an array');

        if (Array.isArray(departmentData) && departmentData.length > 0) {
          setDepartments(departmentData);
        } else {
          console.warn('No departments returned or not an array:', departmentData);
          // Don't show error toast - just log it, page can still work
          console.warn('Continuing without departments - user can still file complaint');
        }
      } catch (error: any) {
        // Log error but don't block the page
        console.error('Error fetching departments:', error);
        console.error('Error details:', {
          message: error?.message,
          status: error?.status,
          data: error?.data
        });
        // Show a warning but don't prevent page from loading
        toast.error('Could not load departments. You can still file a complaint.', {
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleVoiceImageSubmit = async (data: any) => {
    try {
      setError('');
      setIsSubmitting(true);

      // Map VoiceImageComplaintForm data to backend schema
      // VoiceImageComplaintForm uses 'department' but backend expects 'department_code'
      const departmentCode = data.department_code || data.department || '';

      // Create complaint data matching the backend schema
      const complaintData = {
        title: data.title || 'Voice/Image Complaint',
        description: data.description || data.transcription || '',
        department_code: departmentCode, // Backend expects department_code
        category: data.category || 'Other',
        transcript: data.transcription || null,
        language: 'en',
        translated_text: null,
        subcategory: null,
        source: 'web',
        complaint_metadata: {
          location: data.location?.address || data.location || '',
          hasMedia: true,
          hasVoice: !!data.transcription,
          hasImages: !!(data.uploadedImages && data.uploadedImages.length > 0),
          imageAnalysis: data.imageAnalysis || null
        }
      };

      // Call API directly with proper authentication
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        const errorMessage = errorData.message || errorData.error || 'Failed to submit complaint. Please try again.';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess(true);
      setTrackingId(result.reference_no || result.tracking_id || result.trackingId); // Backend may return different field names
      toast.success('Complaint submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred while submitting your complaint. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Radio button handler
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.description.trim()) {
      toast.error('Please describe your grievance');
      return;
    }

    if (!formData.department_code) {
      toast.error('Please select a department');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      // Generate title if not provided
      const title = formData.title || `${formData.category} - ${formData.complaintType || 'General'} Complaint`;

      // Create complaint data matching the backend schema
      const complaintData = {
        title: title,
        description: formData.description,
        department_code: formData.department_code, // Backend expects department_code, not department_id
        category: formData.category,
        transcript: null,
        language: 'en',
        translated_text: null,
        subcategory: null,
        source: 'web',
        complaint_metadata: {
          complaintType: formData.complaintType,
          mediaType: formData.mediaType
        }
      };

      console.log('Submitting complaint with data:', JSON.stringify(complaintData, null, 2));

      // Call API directly with proper authentication
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        const errorMessage = errorData.message || errorData.error || 'Failed to submit complaint. Please try again.';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess(true);
      // Backend returns reference_no, not tracking_id
      setTrackingId(result.reference_no);
      toast.success('Complaint submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred while submitting your complaint. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Complaint Submitted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your grievance has been registered. Save your tracking ID for future reference.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tracking ID</p>
            <p className="text-xl font-mono font-bold text-primary-600 dark:text-primary-400">
              {trackingId}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/track/${trackingId}`} className="btn-primary">
              <FileText className="w-4 h-4 mr-2 inline" />
              Track Complaint
            </Link>
            <Link href="/complaint" className="btn-secondary">
              Submit Another
            </Link>
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Modern Complaint Form UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mr-4">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">File a Complaint</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">We're here to help resolve your issues</p>
              </div>
            </div>
            <Link href="/track" className="btn-secondary text-sm">
              <FileText className="w-4 h-4 mr-2 inline" />
              Track
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filing Mode Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How would you like to file your complaint?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFilingMode('manual')}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all ${filingMode === 'manual'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <Keyboard className={`w-10 h-10 mb-3 ${filingMode === 'manual'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400'
                }`} />
              <span className="text-base font-semibold text-gray-900 dark:text-white mb-1">Manual Entry</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Type your complaint details manually
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilingMode('voice')}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all ${filingMode === 'voice'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <Mic className={`w-10 h-10 mb-3 ${filingMode === 'voice'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400'
                }`} />
              <span className="text-base font-semibold text-gray-900 dark:text-white mb-1">Voice & Image</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Record voice or upload images with AI analysis
              </span>
            </button>
          </div>
        </div>

        {/* Voice/Image Form */}
        {filingMode === 'voice' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Voice & Image Complaint</h2>
              <button
                type="button"
                onClick={() => setFilingMode('manual')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
              >
                <Keyboard className="w-4 h-4 mr-1" />
                Switch to Manual
              </button>
            </div>
            <div className="space-y-4">
              {loading && departments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-4 border-t-primary-600 dark:border-t-primary-400"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading departments...</p>
                </div>
              ) : (
                <VoiceImageComplaintForm
                  onSubmit={handleVoiceImageSubmit}
                  onCancel={() => {
                    setFilingMode('manual');
                    setError('');
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          /* Main form */
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Complaint Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complaint Type</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.complaintType === 'service'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <input
                    type="radio"
                    name="complaintType"
                    value="service"
                    checked={formData.complaintType === 'service'}
                    onChange={(e) => handleRadioChange('complaintType', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${formData.complaintType === 'service'
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {formData.complaintType === 'service' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Service</span>
                  </div>
                </label>
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.complaintType === 'infrastructure'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <input
                    type="radio"
                    name="complaintType"
                    value="infrastructure"
                    checked={formData.complaintType === 'infrastructure'}
                    onChange={(e) => handleRadioChange('complaintType', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${formData.complaintType === 'infrastructure'
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {formData.complaintType === 'infrastructure' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Infrastructure</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Department and Category */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    name="department_code"
                    value={formData.department_code}
                    onChange={handleInputChange}
                    className="form-select w-full"
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? 'Loading departments...' : 'Select a department'}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {!loading && departments.length === 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      No departments available. Please try refreshing the page.
                    </p>
                  )}
                  {departments.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {departments.length} department{departments.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select w-full"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Service Delivery">Service Delivery</option>
                    <option value="Corruption">Corruption</option>
                    <option value="Delay in Services">Delay in Services</option>
                    <option value="Quality Issues">Quality Issues</option>
                    <option value="Billing Problems">Billing Problems</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media Upload Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attach Evidence (Optional)</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleRadioChange('mediaType', 'image')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.mediaType === 'image'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <Camera className={`w-8 h-8 mb-2 ${formData.mediaType === 'image'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                    }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRadioChange('mediaType', 'video')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.mediaType === 'video'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <svg className={`w-8 h-8 mb-2 ${formData.mediaType === 'video'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRadioChange('mediaType', 'audio')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.mediaType === 'audio'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <Mic className={`w-8 h-8 mb-2 ${formData.mediaType === 'audio'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                    }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Audio</span>
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                You can attach a photo, video, or audio recording. Maximum file size: 5 MB
              </p>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Describe Your Complaint</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="form-input w-full"
                  placeholder="Please provide detailed information about your complaint..."
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Be as specific as possible to help us address your concern effectively.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link href="/" className="btn-secondary flex-1">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

// Text Complaint Form Component
// Rail Madad Form implementation - no longer needed as we've replaced it with the inline UI
// This code is kept for reference only
function TextComplaintForm({ onSubmit, onCancel, departments }: { onSubmit: (data: any) => void; onCancel: () => void; departments: Department[] }) {
  const [formData, setFormData] = useState({
    title: '',
    department_code: '',
    category: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div></div> // Empty component as we're no longer using this
  );
}

export default function ComplaintPage() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login?redirect=/complaint">
      <ComplaintPageContent />
    </AuthGuard>
  );
}
