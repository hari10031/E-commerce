'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] === 'dashboard') return 'Dashboard';
  const last = segments[segments.length - 1];
  if (last === 'new') {
    const parent = segments[segments.length - 2];
    return `New ${parent.slice(0, -1).charAt(0).toUpperCase() + parent.slice(0, -1).slice(1)}`;
  }
  if (last === 'edit') return 'Edit';
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    products: 'Products',
    categories: 'Categories',
    orders: 'Orders',
    employees: 'Employees',
    coupons: 'Coupons',
    analytics: 'Analytics',
  };
  return titles[last] || last.charAt(0).toUpperCase() + last.slice(1);
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const title = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 min-w-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.name ?? 'User'}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-fade-in">
              <div className="px-3 py-2 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
