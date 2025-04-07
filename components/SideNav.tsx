'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SideNav() {
  const pathname = usePathname();

  return (
    <div className="h-full w-[200px] border-r bg-background px-3 py-4">
      <nav className="space-y-2">
        <Link
          href="/"
          className={cn(
            'flex h-10 w-full items-center rounded-md px-3 text-sm font-medium',
            pathname === '/' 
              ? 'bg-secondary' 
              : 'hover:bg-secondary/50'
          )}
        >
          Puzzles
        </Link>
        <Link
          href="/statistics"
          className={cn(
            'flex h-10 w-full items-center rounded-md px-3 text-sm font-medium',
            pathname === '/statistics'
              ? 'bg-secondary'
              : 'hover:bg-secondary/50'
          )}
        >
          Statistics
        </Link>
      </nav>
    </div>
  );
}
