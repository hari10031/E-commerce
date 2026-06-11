import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, sub, icon: Icon, accent = 'text-cyan-400' }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-50 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <Icon className={cn('w-5 h-5', accent)} />
        </div>
      </div>
    </div>
  );
}
