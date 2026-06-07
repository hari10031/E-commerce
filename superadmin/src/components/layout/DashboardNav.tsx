'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const links = [
  { href: '/dashboard/admins', label: 'Store admins', icon: Users },
  { href: '/dashboard/ai-quota', label: 'AI quota', icon: Sparkles },
];

export function DashboardNav() {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ count: number }>('/api/superadmin/ai-quota/requests/pending-count', token)
      .then((data) => setPendingCount(data.count))
      .catch(() => setPendingCount(0));
  }, [token, pathname]);

  return (
    <nav className="flex gap-1 border-b border-slate-800 -mb-px">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        const showBadge = href.includes('ai-quota') && pendingCount > 0;
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
            {showBadge && (
              <span className="ml-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-950">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
