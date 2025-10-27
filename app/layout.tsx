import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/src/contexts/auth-context';
import { ChatProvider } from '@/contexts/chat-context';
import { Toaster } from 'react-hot-toast';
import ChatBot from '@/components/ChatBot';
import ThemeToggle from '@/src/components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grievance Redressal Portal',
  description: 'Official grievance redressal system for citizens',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ChatProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              {children}
            </div>
            <ChatBot />
            <Toaster 
              position="top-right" 
              toastOptions={{
                className: 'toast',
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
              }}
            />
            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



