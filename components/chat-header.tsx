'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';

function PureChatHeader() {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="relative sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-2 text-white shadow-lg backdrop-blur-sm">
      <SidebarToggle />
      <h1 className='-translate-x-1/2 pointer-events-none absolute left-1/2 font-bold text-sm tracking-tight md:text-base'>
        Personal AI Agent
      </h1>
      {(!open || windowWidth < 768) && (
        <Button
          variant="ghost"
          className="ml-auto h-8 w-8 rounded-full bg-white/20 p-0 text-white hover:bg-white/30 md:h-9"
          onClick={() => {
            router.push('/');
            router.refresh();
          }}
        >
          <PlusIcon className="h-4 w-4" />
          <span className="sr-only">New Chat</span>
        </Button>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
