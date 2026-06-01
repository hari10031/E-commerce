'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    router.replace(token ? '/dashboard' : '/login');
  }, [token, router]);

  return null;
}
