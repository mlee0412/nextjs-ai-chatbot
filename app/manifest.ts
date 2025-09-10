import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal AI Agent',
    short_name: 'AI Agent',
    description:
      'A futuristic, minimal personal AI assistant with smart-home and workspace tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
