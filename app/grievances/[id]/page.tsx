'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/auth-context';

type Grievance = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  category: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }>;
};

export default function GrievanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check authentication after auth has loaded
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/grievances/${id}`);
      return;
    }

    const fetchGrievance = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch complaint
        const response = await fetch(`/api/complaints/${id}`, {
          headers
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch complaint' }));
          throw new Error(errorData.error || errorData.message || 'Failed to load complaint');
        }

        const data = await response.json();
        const complaint = data.complaint || data;
        
        // Map backend complaint to frontend Grievance type
        const mappedGrievance: Grievance = {
          id: complaint.id || complaint._id || id as string,
          title: complaint.title || complaint.description?.substring(0, 100) || 'Untitled Complaint',
          description: complaint.description || '',
          status: (complaint.status?.toLowerCase().replace(' ', '_') || 'pending') as 'pending' | 'in_progress' | 'resolved' | 'rejected',
          category: complaint.category || 'other',
          location: complaint.location || complaint.address || 'Not specified',
          createdAt: complaint.created_at || complaint.createdAt || complaint.date_filed || new Date().toISOString(),
          updatedAt: complaint.updated_at || complaint.updatedAt || new Date().toISOString(),
        };

        // Fetch attachments if available
        if (complaint.attachments) {
          if (typeof complaint.attachments === 'string') {
            try {
              const parsed = JSON.parse(complaint.attachments);
              mappedGrievance.attachments = Array.isArray(parsed) ? parsed : [];
            } catch {
              mappedGrievance.attachments = [];
            }
          } else if (Array.isArray(complaint.attachments)) {
            mappedGrievance.attachments = complaint.attachments.map((att: any, idx: number) => ({
              id: att.id || att._id || idx.toString(),
              url: att.url || att.fileUrl || '',
              name: att.name || att.filename || att.originalName || `attachment-${idx}`,
              type: att.type || att.fileType || 'unknown'
            }));
          }
        }

        // Fetch comments
        try {
          const commentsResponse = await fetch(`/api/complaints/${id}/comments`, {
            headers
          });
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            const commentsList = commentsData.comments || commentsData || [];
            mappedGrievance.comments = commentsList.map((comment: any) => ({
              id: comment.id || comment._id || Date.now().toString(),
              content: comment.content || comment.text || comment.comment || '',
              author: comment.author || comment.authorName || comment.user_name || 'Anonymous',
              createdAt: comment.created_at || comment.createdAt || new Date().toISOString()
            }));
          }
        } catch (commentsErr) {
          console.error('Failed to fetch comments:', commentsErr);
          // Don't fail the whole page if comments fail
          mappedGrievance.comments = [];
        }

        setGrievance(mappedGrievance);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch grievance:', err);
        setError(err.message || 'Failed to load grievance details. Please try again.');
        setLoading(false);
      }
    };

    fetchGrievance();
  }, [id, authLoading, isAuthenticated, router]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/complaints/${id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: comment, text: comment })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to post comment' }));
        throw new Error(errorData.error || errorData.message || 'Failed to post comment');
      }

      // Update local state optimistically
      if (grievance) {
        setGrievance({
          ...grievance,
          comments: [
            ...(grievance.comments || []),
            {
              id: Date.now().toString(),
              content: comment,
              author: user?.name || 'You',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }
      
      setComment('');
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      setError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const statusText = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      sanitation: 'Sanitation',
      infrastructure: 'Infrastructure',
      public_safety: 'Public Safety',
      other: 'Other',
    };

    return categories[category] || category;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg max-w-4xl mx-auto mt-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Error</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg max-w-4xl mx-auto mt-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Not Found</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            The requested grievance could not be found.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {grievance.title}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Status: {getStatusBadge(grievance.status)}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Category: {getCategoryLabel(grievance.category)}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>
                  Created on {new Date(grievance.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4
          ">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Grievance Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detailed information about the reported issue.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {grievance.description}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grievance.location}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getStatusBadge(grievance.status)}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getCategoryLabel(grievance.category)}
                </dd>
              </div>
              {grievance.attachments && grievance.attachments.length > 0 && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Attachments
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {grievance.attachments.map((file) => (
                        <li
                          key={file.id}
                          className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="w-0 flex-1 flex items-center">
                            <svg
                              className="flex-shrink-0 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="ml-2 flex-1 w-0 truncate">
                              {file.name}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Comments
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Updates and discussions about this grievance.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {grievance.comments && grievance.comments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {grievance.comments.map((comment) => (
                  <li key={comment.id} className="py-4 px-6">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {comment.author}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>{comment.content}</p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <time dateTime={comment.createdAt}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No comments yet. Be the first to comment.
              </div>
            )}

            <div className="px-4 py-4 bg-gray-50 sm:px-6">
              <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                <div className="flex-grow">
                  <label htmlFor="comment" className="sr-only">
                    Add a comment
                  </label>
                  <input
                    type="text"
                    name="comment"
                    id="comment"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
