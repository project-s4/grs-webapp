import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to a readable format
export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Get status badge styling - uses design system badge classes
export function getStatusBadge(status: string): string {
  const statusLower = status.toLowerCase().replace(/\s+/g, '_').replace('-', '_');

  const badgeClasses: { [key: string]: string } = {
    'pending': 'badge-warning',
    'new': 'badge-warning',
    'in_progress': 'badge-info',
    'in-progress': 'badge-info',
    'in progress': 'badge-info',
    'resolved': 'badge-success',
    'triaged': 'badge-info',
    'escalated': 'badge-error',
    'closed': 'badge-secondary',
    'rejected': 'badge-error',
  };

  return badgeClasses[statusLower] || 'badge-secondary';
}

// Alternative status color function for non-badge elements
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase().replace(/\s+/g, '_').replace('-', '_');

  const statusColors: { [key: string]: string } = {
    'pending': 'bg-warning-500 text-white',
    'new': 'bg-warning-500 text-white',
    'in_progress': 'bg-info-500 text-white',
    'in-progress': 'bg-info-500 text-white',
    'in progress': 'bg-info-500 text-white',
    'resolved': 'bg-success-500 text-white',
    'triaged': 'bg-info-500 text-white',
    'escalated': 'bg-error-500 text-white',
    'closed': 'bg-secondary-500 text-white',
    'rejected': 'bg-error-500 text-white',
  };

  return statusColors[statusLower] || 'bg-secondary-500 text-white';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Generate tracking ID for complaints
export function generateTrackingId(): string {
  const prefix = 'GRS';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
}

// Check if string is valid email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate text to specified length
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Get priority color class - uses design system colors
export function getPriorityColor(priority: string): string {
  const priorityLower = priority.toLowerCase();

  switch (priorityLower) {
    case 'critical':
      return 'badge-error';
    case 'high':
      return 'badge-warning';
    case 'medium':
      return 'badge-info';
    case 'low':
      return 'badge-success';
    default:
      return 'badge-secondary';
  }
}

// Department options for filtering
export const departments = [
  'Public Works',
  'Health Department',
  'Education Department',
  'Transportation',
  'Utilities',
  'Municipal Services',
  'Environmental Services',
  'Housing Authority',
  'Planning Department',
  'Parks and Recreation'
];

// Category options for filtering
export const categories = [
  'Infrastructure',
  'Service',
  'Administrative',
  'Technical',
  'Environmental',
  'Safety',
  'Transportation',
  'Health',
  'Education',
  'Other'
];
