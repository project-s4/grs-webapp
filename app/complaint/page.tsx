'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Mic, Camera, FileText } from 'lucide-react';
// import VoiceImageComplaintForm from '@/components/VoiceImageComplaintForm';
// import AIChatbot from '@/components/AIChatbot';
import AuthGuard from '@/components/auth-guard';
import { complaintService, ComplaintCreate } from '@/services/complaints';
import { departmentService, Department } from '@/services/departments';
import toast from 'react-hot-toast';

function ComplaintPageContent() {
  const [complaintType, setComplaintType] = useState<'text' | 'voice-image' | null>(null);
  const [success, setSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentData = await departmentService.getDepartments();
        setDepartments(departmentData);
      } catch (error: any) {
        toast.error('Failed to load departments');
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleVoiceImageSubmit = async (data: any) => {
    try {
      setError('');
      // Find department ID from department code
      const selectedDepartment = departments.find(d => d.code === data.department_code);
      
      const complaintData = {
        title: data.title || 'Voice/Image Complaint',
        description: data.description,
        category: data.category,
        department_id: selectedDepartment?.id,
        priority: 'medium',
        location: data.location || '',
        phone: '',
        email: ''
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
        throw new Error('Failed to submit complaint');
      }
      
      const result = await response.json();
      setSuccess(true);
      setTrackingId(result.complaint.tracking_id);
      toast.success('Complaint submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to submit complaint';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleTextSubmit = async (formData: any) => {
    try {
      setError('');
      // Find department ID from department code
      const selectedDepartment = departments.find(d => d.code === formData.department_code);
      
      const complaintData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        department_id: selectedDepartment?.id,
        priority: 'medium', // default priority
        location: '', // can be added later
        phone: '', // can be added later  
        email: '' // will be handled by auth
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
        throw new Error('Failed to submit complaint');
      }
      
      const result = await response.json();
      setSuccess(true);
      setTrackingId(result.complaint.tracking_id);
      toast.success('Complaint submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to submit complaint';
      setError(errorMessage);
      toast.error(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Complaint Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your grievance has been registered and is under review. Please save your tracking ID for future reference.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Your Tracking ID:</p>
              <p className="text-2xl font-mono font-bold text-blue-600 bg-white p-3 rounded border">
                {trackingId}
              </p>
            </div>
            <div className="space-y-4">
              <Link href={`/track/${trackingId}`} className="btn-primary inline-block">
                Track Your Complaint
              </Link>
              <br />
              <Link href="/complaint" className="btn-secondary inline-block">
                Submit Another Complaint
              </Link>
              <br />
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (complaintType === 'voice-image') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => setComplaintType(null)}
                  className="text-blue-600 hover:text-blue-700 mr-4"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-blue-600">
                  Voice & Image Complaint
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
              <p className="text-gray-600 mb-6">
                The Voice & Image complaint feature is under development. Please use the text complaint option for now.
              </p>
              <button
                onClick={() => setComplaintType('text')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg mr-4"
              >
                Use Text Complaint
              </button>
              <button
                onClick={() => setComplaintType(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Back to Options
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (complaintType === 'text') {
    return (
      <TextComplaintForm 
        onSubmit={handleTextSubmit} 
        onCancel={() => setComplaintType(null)} 
        departments={departments}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-6 w-6 mr-2" />
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">
                File a Complaint
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Complaint Type Selection */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Complaint Method
          </h2>
          <p className="text-xl text-gray-600">
            Select the most convenient way to file your grievance
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Voice & Image Complaint */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Mic className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Voice & Image Complaint
              </h3>
              <p className="text-gray-600 mb-6">
                Record your voice, take photos, and let AI analyze your issue automatically. Perfect for users who prefer speaking or have visual evidence.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                <li>• Voice-to-text conversion</li>
                <li>• Photo upload with AI analysis</li>
                <li>• Automatic department routing</li>
                <li>• Location detection</li>
                <li>• Priority assessment</li>
              </ul>
              <button
                onClick={() => setComplaintType('voice-image')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Start Voice & Image Complaint
              </button>
            </div>
          </div>

          {/* Text Complaint */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Text Complaint
              </h3>
              <p className="text-gray-600 mb-6">
                Traditional form-based complaint filing. Fill out the form with your details and description.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                <li>• Simple form interface</li>
                <li>• Manual department selection</li>
                <li>• Text-based description</li>
                <li>• Quick and straightforward</li>
                <li>• Works on all devices</li>
              </ul>
              <button
                onClick={() => setComplaintType('text')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Start Text Complaint
              </button>
            </div>
          </div>

          {/* Photo-Only Complaint */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-6">
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Photo-Only Complaint
              </h3>
              <p className="text-gray-600 mb-6">
                Just take a photo of the issue and let AI analyze it. Perfect for visual problems like garbage, infrastructure issues, etc.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                <li>• Photo-based complaint</li>
                <li>• AI image analysis</li>
                <li>• Automatic issue detection</li>
                <li>• Location tagging</li>
                <li>• Instant department routing</li>
              </ul>
              <button
                onClick={() => setComplaintType('voice-image')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Start Photo Complaint
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Advanced Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Voice Input</h4>
              <p className="text-sm text-gray-600">Speak your complaint and get automatic transcription</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Camera className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Photo Analysis</h4>
              <p className="text-sm text-gray-600">AI analyzes photos to detect issues and suggest departments</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Routing</h4>
              <p className="text-sm text-gray-600">Automatic department assignment based on content analysis</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Priority Detection</h4>
              <p className="text-sm text-gray-600">AI determines urgency and priority level automatically</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Text Complaint Form Component
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={onCancel}
                className="text-green-600 hover:text-green-700 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-green-600">
                Text Complaint Form
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Submit Your Grievance
            </h2>
            <p className="text-gray-600">
              Please fill out the form below with accurate information. All fields are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter a brief title for your complaint"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="department_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  id="department_code"
                  name="department_code"
                  value={formData.department_code}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Category</option>
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

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="form-input"
                placeholder="Please describe your grievance in detail..."
                required
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← Back to Options
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ComplaintPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ComplaintPageContent />
    </AuthGuard>
  );
}
