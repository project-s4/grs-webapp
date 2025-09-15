'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/lib/utils';



interface Complaint {
  _id: string;
  trackingId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  category: string;
  subCategory?: string;
  description: string;
  status: string;
  priority: string;
  dateFiled: string;
  reply?: string;
  adminReply?: string;
  updatedAt: string;
  viewCount?: number;
  satisfaction?: number;
  estimatedResolution?: string;
  statusHistory?: Array<{
    status: string;
    updatedAt: string;
    updatedBy?: string;
    notes?: string;
  }>;
  comments?: Array<{
    _id: string;
    text: string;
    author: string;
    authorType: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    _id: string;
    filename: string;
    originalName: string;
    url: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  location?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    city?: string;
    state?: string;
    pincode?: string;
  };
  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedAt: string;
    resolutionType: string;
  };
}

export default function TrackComplaintPage({ params }: { params: { trackingId: string } }) {
  // This is required for static export
  if (!params.trackingId) {
    return <div>Invalid tracking ID</div>;
  }
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await fetch(`/api/complaints/track?trackingId=${params.trackingId}`);
        const data = await response.json();

        if (response.ok) {
          setComplaint(data.complaint);
        } else {
          setError(data.error || 'Failed to fetch complaint');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [params.trackingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-danger-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="card text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-danger-100 mb-6">
              <svg className="h-8 w-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Complaint Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {error || 'The complaint with this tracking ID could not be found.'}
            </p>
            <div className="space-y-4">
              <Link href="/" className="btn-primary inline-block">
                Back to Home
              </Link>
              <br />
              <Link href="/complaint" className="btn-secondary inline-block">
                File New Complaint
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-primary-600">
                Complaint Tracking
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card">
          {/* Tracking ID Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complaint Details
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-1">Tracking ID:</p>
              <p className="text-xl font-mono font-bold text-primary-600">
                {complaint.trackingId}
              </p>
            </div>
          </div>

          {/* Status and Priority Badges */}
          <div className="text-center mb-8">
            <div className="flex justify-center space-x-4">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusBadge(complaint.status)}`}>
                Status: {complaint.status}
              </span>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                complaint.priority === 'Critical' ? 'text-red-600 bg-red-100' :
                complaint.priority === 'High' ? 'text-orange-600 bg-orange-100' :
                complaint.priority === 'Medium' ? 'text-yellow-600 bg-yellow-100' :
                'text-green-600 bg-green-100'
              }`}>
                Priority: {complaint.priority}
              </span>
            </div>
          </div>

          {/* Complaint Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complainant Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{complaint.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{complaint.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900">{complaint.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{complaint.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Date Filed</label>
                  <p className="text-gray-900">{formatDate(new Date(complaint.dateFiled))}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{formatDate(new Date(complaint.updatedAt))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Admin Reply */}
          {complaint.adminReply && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Official Reply</h3>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{complaint.adminReply}</p>
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {complaint.resolution && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Details</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-green-900">Resolution Type:</p>
                    <p className="text-green-800">{complaint.resolution.resolutionType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Resolved By:</p>
                    <p className="text-green-800">{complaint.resolution.resolvedBy}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 mb-2">Resolution Description:</p>
                  <p className="text-green-800 whitespace-pre-wrap">{complaint.resolution.description}</p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Resolved on: {formatDate(new Date(complaint.resolution.resolvedAt))}
                </p>
              </div>
            </div>
          )}

          {/* Status History */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
              <div className="space-y-3">
                {complaint.statusHistory.map((update, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{update.status}</p>
                        <p className="text-sm text-gray-500">{formatDate(new Date(update.updatedAt))}</p>
                      </div>
                      {update.updatedBy && (
                        <p className="text-sm text-gray-600">Updated by: {update.updatedBy}</p>
                      )}
                      {update.notes && (
                        <p className="text-sm text-gray-700 mt-1">{update.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {complaint.comments && complaint.comments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
              <div className="space-y-4">
                {complaint.comments.map((comment) => (
                  <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{comment.author}</p>
                      <p className="text-sm text-gray-500">{formatDate(new Date(comment.createdAt))}</p>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      comment.authorType === 'admin' ? 'bg-blue-100 text-blue-800' :
                      comment.authorType === 'system' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {comment.authorType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaint.attachments.map((attachment) => (
                  <div key={attachment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.fileType}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {formatDate(new Date(attachment.uploadedAt))}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {complaint.location && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {complaint.location.address && (
                  <p className="text-gray-900 mb-2">
                    <span className="font-medium">Address:</span> {complaint.location.address}
                  </p>
                )}
                {complaint.location.city && (
                  <p className="text-gray-700">
                    {complaint.location.city}
                    {complaint.location.state && `, ${complaint.location.state}`}
                    {complaint.location.pincode && ` - ${complaint.location.pincode}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Analytics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{complaint.viewCount || 0}</p>
                <p className="text-sm text-gray-600">Views</p>
              </div>
              {complaint.satisfaction && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{complaint.satisfaction}/5</p>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                </div>
              )}
              {complaint.estimatedResolution && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-bold text-gray-900">
                    {formatDate(new Date(complaint.estimatedResolution))}
                  </p>
                  <p className="text-sm text-gray-600">Est. Resolution</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/" className="btn-secondary text-center">
              Back to Home
            </Link>
            <Link href="/complaint" className="btn-primary text-center">
              File New Complaint
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

