'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, FileText } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Track Complaint</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your tracking ID to view complaint status</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Track Your Complaint
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Enter the tracking ID you received when submitting your complaint
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tracking ID
              </label>
              <div className="relative">
                <input
                  id="trackingId"
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g., GRS-2024-XXXX"
                  className="form-input w-full pl-10"
                  required
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The tracking ID is provided when you submit a complaint
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Link href="/" className="btn-secondary flex-1">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                <Search className="w-4 h-4 mr-2 inline" />
                Track Complaint
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Need help?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              If you've lost your tracking ID or need assistance, please contact support.
            </p>
            <Link href="/complaint" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
              File a new complaint →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
