'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FileText, Search, ClipboardList, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [trackingId, setTrackingId] = useState('');

  const handleTrackComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      window.location.href = `/track/${trackingId.trim()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold gradient-text-primary">
              Grievance Redressal Portal
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/register" className="btn-primary">Register</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom section-padding">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            File Your <span className="gradient-text-primary">Grievance</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Submit your complaints and track their progress through our transparent system.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          <div className="card hover-lift group">
            <div className="text-center p-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mb-6">
                <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                File a New Complaint
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Submit your grievance with all necessary details.
              </p>
              <Link href="/login?redirect=/complaint" className="btn-primary btn-lg inline-flex items-center">
                File Complaint
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="card hover-lift group">
            <div className="text-center p-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900 dark:to-success-800 mb-6">
                <Search className="h-10 w-10 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Track Your Complaint
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Check the status of your submitted complaint.
              </p>
              <form onSubmit={handleTrackComplaint} className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter Tracking ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="form-input text-center"
                  required
                />
                <button type="submit" className="btn-success btn-lg w-full">
                  Track Complaint
                </button>
              </form>
            </div>
          </div>

          <div className="card hover-lift group">
            <div className="text-center p-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-info-100 to-info-200 dark:from-info-900 dark:to-info-800 mb-6">
                <ClipboardList className="h-10 w-10 text-info-600 dark:text-info-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                My Complaints
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                View and manage all your complaints.
              </p>
              <Link href="/login?redirect=/user/dashboard" className="btn-info btn-lg inline-flex items-center">
                View Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-12 mt-20">
        <div className="container-custom">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Grievance Redressal System</h3>
            <p className="text-gray-400 mb-6">Your voice matters. We're here to help.</p>
            <div className="flex justify-center space-x-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                Register
              </Link>
              <Link href="/admin/login" className="text-gray-400 hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}