self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Placeholder fetch handler required for PWA installation.
self.addEventListener('fetch', () => {});
