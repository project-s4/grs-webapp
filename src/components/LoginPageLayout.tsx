'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowLeft, Shield, Users, UserCheck } from 'lucide-react';

interface LoginPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerLinks?: Array<{
    label: string;
    href: string;
    color?: string;
  }>;
  type?: 'citizen' | 'department' | 'admin';
}

export default function LoginPageLayout({ 
  title, 
  subtitle, 
  children, 
  footerLinks = [],
  type = 'citizen'
}: LoginPageLayoutProps) {
  const getIcon = () => {
    switch (type) {
      case 'department':
        return <Users className="h-8 w-8" />;
      case 'admin':
        return <Shield className="h-8 w-8" />;
      default:
        return <UserCheck className="h-8 w-8" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'department':
        return 'from-info-500 to-info-700';
      case 'admin':
        return 'from-warning-500 to-warning-700';
      default:
        return 'from-primary-500 to-primary-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Back Button */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-8 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${getGradient()} mb-6 shadow-glow-primary`}>
            <div className="text-white">
              {getIcon()}
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="card hover-glow">
          <div className="card-body">
            {children}
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          {footerLinks.map((link, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {link.label}{' '}
              <Link
                href={link.href}
                className={`font-medium hover:opacity-80 transition-opacity duration-200 ${
                  link.color === 'blue' ? 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300' :
                  link.color === 'red' ? 'text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300' :
                  'text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300'
                }`}
              >
                {link.href === '/department/login' ? 'Department Login' :
                 link.href === '/admin/login' ? 'Admin Login' :
                 link.href === '/login' ? 'Citizen Login' :
                 link.href === '/register' ? 'Sign up' :
                 link.href === '/' ? '← Back to Home' : 'Link'}
              </Link>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
