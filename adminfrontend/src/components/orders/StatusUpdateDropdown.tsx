'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusUpdateDropdownProps {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdated: (newStatus: OrderStatus) => void;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusUpdateDropdown({ orderId, currentStatus, onUpdated }: StatusUpdateDropdownProps) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<OrderStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const nextStatuses = VALID_TRANSITIONS[currentStatus] ?? [];

  const handleSelect = (status: OrderStatus) => {
    setOpen(false);
    setConfirmDialog(status);
  };

  const handleConfirm = async () => {
    if (!confirmDialog || !token) return;
    setUpdating(true);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: confirmDialog }, token);
      onUpdated(confirmDialog);
      toast.success(`Order status updated to ${STATUS_LABELS[confirmDialog]}`);
    } catch (err: unknown) {
      toast.error('Update failed', err instanceof Error ? err.message : '');
    } finally {
      setUpdating(false);
      setConfirmDialog(null);
    }
  };

  if (nextStatuses.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge status={currentStatus} />
        <span className="text-xs text-gray-400">(final)</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          <StatusBadge status={currentStatus} />
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Change
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-fade-in">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors"
                >
                  <StatusBadge status={status} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Change order status from{' '}
            <strong className="text-gray-900">{STATUS_LABELS[currentStatus]}</strong> to{' '}
            <strong className="text-gray-900">{confirmDialog ? STATUS_LABELS[confirmDialog] : ''}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={updating}>
              {updating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
