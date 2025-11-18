'use client';

import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/src/lib/utils';

interface TimelineItem {
  status: string;
  date?: string;
  updatedBy?: string;
  notes?: string;
}

interface StatusTimelineProps {
  currentStatus: string;
  statusHistory?: TimelineItem[];
  estimatedResolution?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  'new': { label: 'New', color: 'bg-gray-500', icon: Circle },
  'pending': { label: 'Pending', color: 'bg-amber-500', icon: Clock },
  'triaged': { label: 'Triaged', color: 'bg-blue-500', icon: Clock },
  'in_progress': { label: 'In Progress', color: 'bg-blue-600', icon: Clock },
  'resolved': { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
  'closed': { label: 'Closed', color: 'bg-gray-600', icon: CheckCircle2 },
  'escalated': { label: 'Escalated', color: 'bg-red-500', icon: AlertCircle },
};

const defaultStatusFlow = [
  { key: 'new', label: 'Filed' },
  { key: 'triaged', label: 'Under Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function StatusTimeline({ 
  currentStatus, 
  statusHistory = [], 
  estimatedResolution 
}: StatusTimelineProps) {
  // Normalize current status - handle various formats
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    // Map common variations
    if (normalized.includes('pending') || normalized === 'new') return 'pending';
    if (normalized.includes('review') || normalized.includes('triaged')) return 'triaged';
    if (normalized.includes('progress') || normalized.includes('in_progress')) return 'in_progress';
    if (normalized.includes('resolved')) return 'resolved';
    if (normalized.includes('closed')) return 'closed';
    return normalized;
  };
  
  const normalizedStatus = normalizeStatus(currentStatus);
  
  // Determine which statuses have been completed
  const getStatusIndex = (status: string) => {
    const normalized = normalizeStatus(status);
    return defaultStatusFlow.findIndex(s => s.key === normalized);
  };

  const currentIndex = getStatusIndex(normalizedStatus);
  
  const getStatusState = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
          Status Timeline
        </h3>
        {estimatedResolution && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Est. Resolution:</span>{' '}
            {formatDate(new Date(estimatedResolution))}
          </div>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        <div className="space-y-6">
          {defaultStatusFlow.map((status, index) => {
            const state = getStatusState(index);
            const config = statusConfig[status.key] || { 
              label: status.label, 
              color: 'bg-gray-500', 
              icon: Circle 
            };
            const Icon = config.icon;
            
            // Find history entry for this status - normalize for comparison
            const normalizeForMatch = (s: string) => s.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
            const historyEntry = statusHistory.find(
              h => normalizeForMatch(h.status) === status.key || 
                   normalizeForMatch(h.status).includes(status.key) ||
                   status.key.includes(normalizeForMatch(h.status))
            );

            return (
              <div key={status.key} className="relative flex items-start">
                {/* Timeline Dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      state === 'completed'
                        ? `${config.color} border-${config.color.split('-')[1]}-500 text-white`
                        : state === 'active'
                        ? `bg-white dark:bg-gray-800 border-${config.color.split('-')[1]}-500 ${config.color.split('-')[1] === 'blue' ? 'text-blue-600' : 'text-gray-600'}`
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                    }`}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="ml-4 flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          state === 'active'
                            ? 'text-blue-600 dark:text-blue-400'
                            : state === 'completed'
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {status.label}
                      </h4>
                      {historyEntry?.date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(new Date(historyEntry.date))}
                        </p>
                      )}
                      {historyEntry?.updatedBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          by {historyEntry.updatedBy}
                        </p>
                      )}
                    </div>
                    {state === 'active' && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  
                  {historyEntry?.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                      {historyEntry.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(((currentIndex + 1) / defaultStatusFlow.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              statusConfig[normalizedStatus]?.color || 'bg-blue-500'
            }`}
            style={{ width: `${((currentIndex + 1) / defaultStatusFlow.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

