'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface LoginPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerLinks?: Array<{
    label: string;
    href: string;
    color?: string;
  }>;
}

export default function LoginPageLayout({ 
  title, 
  subtitle, 
  children, 
  footerLinks = [] 
}: LoginPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:text-primary-700 mb-8 inline-block">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="card">
          {children}
        </div>

        <div className="text-center space-y-2">
          {footerLinks.map((link, index) => (
            <p key={index} className="text-sm text-gray-600">
              {link.label}{' '}
              <Link
                href={link.href}
                className={`font-medium hover:opacity-80 ${
                  link.color === 'blue' ? 'text-blue-600 hover:text-blue-500' :
                  link.color === 'red' ? 'text-red-600 hover:text-red-500' :
                  'text-primary-600 hover:text-primary-500'
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
