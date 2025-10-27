import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="flex items-center justify-center space-x-4">
        {action && (
          <button 
            onClick={action.onClick}
            className="btn-primary btn-lg inline-flex items-center"
          >
            {action.icon && <action.icon className="w-5 h-5 mr-2" />}
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick}
            className="btn-ghost btn-lg inline-flex items-center"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
