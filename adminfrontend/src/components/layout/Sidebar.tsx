'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Ticket,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useState } from 'react';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    roles: ['admin', 'employee'],
  },
  {
    href: '/dashboard/products',
    label: 'Products',
    icon: Package,
    roles: ['admin', 'employee'],
  },
  {
    href: '/dashboard/categories',
    label: 'Categories',
    icon: Tag,
    roles: ['admin', 'employee'],
  },
  {
    href: '/dashboard/orders',
    label: 'Orders',
    icon: ShoppingCart,
    roles: ['admin', 'employee'],
  },
  {
    href: '/dashboard/employees',
    label: 'Employees',
    icon: Users,
    roles: ['admin'],
  },
  {
    href: '/dashboard/coupons',
    label: 'Coupons',
    icon: Ticket,
    roles: ['admin'],
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['admin', 'employee'],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const allowedItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const navContent = (
    <>
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-white/10',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <BrandLogo collapsed={collapsed} showName={!collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'text-[oklch(0.55_0.02_260)] hover:text-white transition-colors p-1 rounded hidden lg:block',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1 text-white/70 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden lg:flex justify-center py-2 text-[oklch(0.55_0.02_260)] hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-amber-500 text-white'
                  : 'text-[oklch(0.70_0.02_260)] hover:bg-[oklch(0.22_0.03_260)] hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[oklch(0.22_0.03_260)]">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-[oklch(0.55_0.02_260)] capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            'text-[oklch(0.70_0.02_260)] hover:bg-red-900/30 hover:text-red-400',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full transition-all duration-150 ease-in-out',
          'bg-[#1C1C1C] text-neutral-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="relative flex flex-col h-full w-[min(85vw,16rem)] bg-[#1C1C1C] text-neutral-300 shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
