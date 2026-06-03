'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard/admins', label: 'Store admins', icon: Users },
  { href: '/dashboard/ai-quota', label: 'AI quota', icon: Sparkles },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-800 -mb-px">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
