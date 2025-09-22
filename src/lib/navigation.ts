import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Debounced navigation to prevent browser throttling
let navigationTimeout: NodeJS.Timeout | null = null;

export function safeNavigate(router: AppRouterInstance, path: string, delay: number = 150) {
  // Clear any pending navigation
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }

  // Schedule new navigation
  navigationTimeout = setTimeout(() => {
    try {
      router.push(path);
    } catch (error) {
      console.warn('Navigation error:', error);
      // Fallback to window.location for critical navigation
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    }
  }, delay);
}

// Safe redirect that won't cause navigation throttling
export function safeRedirect(path: string, delay: number = 100) {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.location.href = path;
    }, delay);
  }
}
