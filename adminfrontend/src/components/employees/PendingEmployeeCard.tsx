'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { UserCheck, UserX, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { Employee } from '@/types';

interface PendingEmployeeCardProps {
  employee: Employee;
  onAction: () => void;
}

export function PendingEmployeeCard({ employee, onAction }: PendingEmployeeCardProps) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!token) return;
    setLoading(action);
    try {
      await api.patch(`/api/employees/${employee.id}/approve`, { action }, token);
      toast.success(`Employee ${action === 'approve' ? 'approved' : 'rejected'}`);
      onAction();
    } catch (err: unknown) {
      toast.error('Action failed', err instanceof Error ? err.message : '');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-700 font-bold text-sm">
            {employee.name[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered {formatDate(employee.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          className="flex-1"
          onClick={() => handleAction('approve')}
          disabled={!!loading}
        >
          <UserCheck className="w-4 h-4" />
          {loading === 'approve' ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => handleAction('reject')}
          disabled={!!loading}
        >
          <UserX className="w-4 h-4" />
          {loading === 'reject' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
}
