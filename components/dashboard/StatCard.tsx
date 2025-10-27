import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  colorScheme = 'primary' 
}: StatCardProps) {
  const colorClasses = {
    primary: {
      bg: 'from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800',
      text: 'text-primary-600 dark:text-primary-400',
      value: 'text-primary-600 dark:text-primary-400'
    },
    success: {
      bg: 'from-success-100 to-success-200 dark:from-success-900 dark:to-success-800',
      text: 'text-success-600 dark:text-success-400',
      value: 'text-success-600 dark:text-success-400'
    },
    warning: {
      bg: 'from-warning-100 to-warning-200 dark:from-warning-900 dark:to-warning-800',
      text: 'text-warning-600 dark:text-warning-400',
      value: 'text-warning-600 dark:text-warning-400'
    },
    error: {
      bg: 'from-error-100 to-error-200 dark:from-error-900 dark:to-error-800',
      text: 'text-error-600 dark:text-error-400',
      value: 'text-error-600 dark:text-error-400'
    },
    info: {
      bg: 'from-info-100 to-info-200 dark:from-info-900 dark:to-info-800',
      text: 'text-info-600 dark:text-info-400',
      value: 'text-info-600 dark:text-info-400'
    }
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className="card-glass hover-lift group">
      <div className="flex items-center justify-between p-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className={`text-3xl font-bold ${colors.value}`}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2 text-xs">
              <span className={trend.isPositive ? 'text-success-600' : 'text-error-600'}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
