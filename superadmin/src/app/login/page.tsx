'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e14] via-[#111827] to-[#0a0e14] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">S-Box Platform Console</h1>
          <p className="text-slate-500 text-sm mt-1">Gemini AI quota management</p>
        </div>

        {mounted ? (
          <LoginForm />
        ) : (
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-8 shadow-xl animate-pulse">
            <div className="h-9 bg-slate-800 rounded-lg mb-4" />
            <div className="h-9 bg-slate-800 rounded-lg mb-4" />
            <div className="h-11 bg-slate-800 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
