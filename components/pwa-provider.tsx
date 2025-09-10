'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker required for PWA support.
 * This runs once on the client and silently fails if service
 * workers are not supported or registration fails.
 */
export function PWAProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed', err));
    }
  }, []);

  return null;
}
