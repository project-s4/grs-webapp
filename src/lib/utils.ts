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

// Get status badge styling
export function getStatusBadge(status: string): string {
  const statusLower = status.toLowerCase().replace(/\s+/g, '_').replace('-', '_');
  
  const badgeClasses: { [key: string]: string } = {
    'pending': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900',
    'new': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900',
    'in_progress': 'text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900',
    'in-progress': 'text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900',
    'in progress': 'text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900',
    'resolved': 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900',
    'triaged': 'text-purple-800 bg-purple-100 dark:text-purple-300 dark:bg-purple-900',
    'escalated': 'text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900',
    'closed': 'text-gray-800 bg-gray-100 dark:text-gray-300 dark:bg-gray-900',
    'rejected': 'text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900',
  };
  
  return badgeClasses[statusLower] || 'text-gray-800 bg-gray-100 dark:text-gray-300 dark:bg-gray-900';
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

// Get priority color class
export function getPriorityColor(priority: string): string {
  const priorityLower = priority.toLowerCase();
  
  switch (priorityLower) {
    case 'critical':
      return 'text-red-800 bg-red-100';
    case 'high':
      return 'text-orange-800 bg-orange-100';
    case 'medium':
      return 'text-yellow-800 bg-yellow-100';
    case 'low':
      return 'text-green-800 bg-green-100';
    default:
      return 'text-gray-800 bg-gray-100';
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
