'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, getStatusBadge } from '@/src/lib/utils';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Tag, 
  Calendar, 
  FileText, 
  MessageCircle, 
  Paperclip, 
  MapPin,
  Eye,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';



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
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Add Authorization header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/complaints/track?trackingId=${params.trackingId}`, {
          headers
        });
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Complaint Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The complaint with this tracking ID could not be found.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-secondary">
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back to Home
            </Link>
            <Link href="/complaint" className="btn-primary">
              <FileText className="w-4 h-4 mr-2 inline" />
              File New Complaint
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Complaint Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track your complaint status and updates
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Tracking ID and Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tracking ID</p>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {complaint.trackingId}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${getStatusBadge(complaint.status)}`}>
                  {complaint.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  complaint.priority === 'Critical' ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
                  complaint.priority === 'High' ? 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' :
                  complaint.priority === 'Medium' ? 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {complaint.priority} Priority
                </span>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Complainant Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Complainant
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.email}</p>
                  </div>
                </div>
                {complaint.phone && (
                  <div className="flex items-start">
                    <Phone className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complaint Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Building className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.department}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Tag className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.category}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Filed</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {complaint.dateFiled ? formatDate(new Date(complaint.dateFiled)) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {complaint.updatedAt ? formatDate(new Date(complaint.updatedAt)) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
              Description
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
            </div>
          </div>

          {/* Admin Reply */}
          {complaint.adminReply && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                Official Reply
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{complaint.adminReply}</p>
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {complaint.resolution && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Resolution Details
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">Resolution Type:</p>
                    <p className="text-green-800 dark:text-green-400">{complaint.resolution.resolutionType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">Resolved By:</p>
                    <p className="text-green-800 dark:text-green-400">{complaint.resolution.resolvedBy}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Resolution Description:</p>
                  <p className="text-green-800 dark:text-green-400 whitespace-pre-wrap">{complaint.resolution.description}</p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-500 mt-2">
                  Resolved on: {formatDate(new Date(complaint.resolution.resolvedAt))}
                </p>
              </div>
            </div>
          )}

          {/* Status History */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Status History
              </h3>
              <div className="space-y-3">
                {complaint.statusHistory.map((update, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white">{update.status}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(new Date(update.updatedAt))}</p>
                      </div>
                      {update.updatedBy && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Updated by: {update.updatedBy}</p>
                      )}
                      {update.notes && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{update.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {complaint.comments && complaint.comments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Comments
              </h3>
              <div className="space-y-4">
                {complaint.comments.map((comment) => (
                  <div key={comment._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 dark:text-white">{comment.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(new Date(comment.createdAt))}</p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      comment.authorType === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                      comment.authorType === 'system' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaint.attachments.map((attachment) => (
                  <div key={attachment._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attachment.originalName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.fileType}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Uploaded {formatDate(new Date(attachment.uploadedAt))}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 text-sm font-medium"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Location Details
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                {complaint.location.address && (
                  <p className="text-gray-900 dark:text-white mb-2">
                    <span className="font-medium">Address:</span> {complaint.location.address}
                  </p>
                )}
                {complaint.location.city && (
                  <p className="text-gray-700 dark:text-gray-300">
                    {complaint.location.city}
                    {complaint.location.state && `, ${complaint.location.state}`}
                    {complaint.location.pincode && ` - ${complaint.location.pincode}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
              Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <Eye className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{complaint.viewCount || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
              </div>
              {complaint.satisfaction && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                  <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{complaint.satisfaction}/5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</p>
                </div>
              )}
              {complaint.estimatedResolution && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDate(new Date(complaint.estimatedResolution))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. Resolution</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="btn-secondary text-center flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <Link href="/complaint" className="btn-primary text-center flex items-center justify-center">
                <FileText className="w-4 h-4 mr-2" />
                File New Complaint
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

