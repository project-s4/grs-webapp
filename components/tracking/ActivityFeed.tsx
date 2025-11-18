'use client';

import { 
  Clock, 
  MessageCircle, 
  FileText, 
  User, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Paperclip
} from 'lucide-react';
import { formatDate } from '@/src/lib/utils';

interface ActivityItem {
  id: string;
  type: 'status_change' | 'comment' | 'attachment' | 'assignment' | 'resolution';
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  actorType?: 'user' | 'admin' | 'department' | 'system';
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  status_change: Clock,
  comment: MessageCircle,
  attachment: Paperclip,
  assignment: User,
  resolution: CheckCircle2,
};

const activityColors = {
  status_change: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  comment: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  attachment: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  assignment: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  resolution: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
};

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);
  
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(time);
  };

  if (displayActivities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
          Activity Feed
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        Activity Feed
      </h3>
      
      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || Clock;
          const colorClass = activityColors[activity.type] || activityColors.status_change;
          
          return (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                    {activity.actor && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.actorType === 'admin' && '👤 Admin'}
                        {activity.actorType === 'department' && '🏢 Department'}
                        {activity.actorType === 'user' && '👤 You'}
                        {activity.actorType === 'system' && '⚙️ System'}
                        {' • '}
                        {activity.actor}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>

                {/* Metadata */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {activity.metadata.oldStatus && activity.metadata.newStatus && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                        {activity.metadata.oldStatus} → {activity.metadata.newStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  );
}





