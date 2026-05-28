'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import {
  Truck,
  Package,
  ExternalLink,
  RefreshCw,
  FileText,
  ClipboardList,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { Order } from '@/types';

interface CourierOption {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string;
  etd: string;
  cod: number;
  rating: number;
}

interface ShipmentPanelProps {
  order: Order;
  onOrderUpdated: (order: Order) => void;
}

export function ShipmentPanel({ order, onOrderUpdated }: ShipmentPanelProps) {
  const token = useAuthStore((s) => s.token);
  const [weight, setWeight] = useState('');
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [computedWeight, setComputedWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<
    Array<{ activity?: string; date?: string; location?: string }>
  >([]);

  const canShip = ['confirmed', 'processing'].includes(order.status);
  const hasAwb = Boolean(order.shiprocket_awb);

  async function checkServiceability() {
    if (!token) return;
    setLoading('serviceability');
    try {
      const res = await api.post<{
        couriers: CourierOption[];
        weight: number;
      }>(
        '/api/shipments/serviceability',
        {
          orderId: order.id,
          ...(weight ? { weight: parseFloat(weight) } : {}),
        },
        token
      );
      setCouriers(res.couriers);
      setComputedWeight(res.weight);
      if (res.couriers.length === 0) {
        toast.error('No couriers available for this pincode/weight');
      } else {
        toast.success(`Found ${res.couriers.length} courier options`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Serviceability check failed');
    } finally {
      setLoading(null);
    }
  }

  async function createShipment() {
    if (!token || selectedCourierId == null) return;
    setLoading('create');
    try {
      const res = await api.post<{ order: Order }>(
        '/api/shipments/create',
        {
          orderId: order.id,
          courier_id: selectedCourierId,
          ...(weight ? { weight: parseFloat(weight) } : {}),
        },
        token
      );
      onOrderUpdated(res.order);
      setCouriers([]);
      toast.success('Shipment created — AWB assigned');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create shipment');
    } finally {
      setLoading(null);
    }
  }

  async function openDoc(
    action: 'label' | 'invoice' | 'manifest',
    field: 'label_url' | 'invoice_url' | 'manifest_url'
  ) {
    if (!token) return;
    setLoading(action);
    try {
      const res = await api.post<Record<string, string>>(
        `/api/shipments/${order.id}/${action}`,
        {},
        token
      );
      const url = res[`${action}_url`];
      if (url) {
        window.open(url, '_blank');
        onOrderUpdated({ ...order, [field]: url });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to get ${action}`);
    } finally {
      setLoading(null);
    }
  }

  async function refreshTracking() {
    if (!token) return;
    setLoading('track');
    try {
      const res = await api.get<{
        tracking?: {
          tracking_data?: {
            shipment_track?: Array<{
              activity?: string;
              date?: string;
              location?: string;
            }>;
          };
        };
      }>(`/api/shipments/${order.id}/track`, token);
      const events = res.tracking?.tracking_data?.shipment_track ?? [];
      setTrackingEvents(events);
      toast.success('Tracking refreshed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(null);
    }
  }

  async function cancelShipment() {
    if (!token || !confirm('Cancel this Shiprocket shipment?')) return;
    setLoading('cancel');
    try {
      const res = await api.post<{ order: Order }>(
        `/api/shipments/${order.id}/cancel`,
        {},
        token
      );
      onOrderUpdated(res.order);
      setCouriers([]);
      setSelectedCourierId(null);
      toast.success('Shipment cancelled');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setLoading(null);
    }
  }

  if (!canShip && !hasAwb) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Shiprocket Shipment</h3>
        </div>
        <p className="text-sm text-gray-500">
          Order must be <strong>confirmed</strong> (payment received) before you can create a shipment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-gray-900">Shiprocket Shipment</h3>
        {order.shipment_status && (
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            {order.shipment_status}
          </span>
        )}
      </div>

      {hasAwb ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">AWB</p>
              <p className="font-mono font-semibold text-gray-900">{order.shiprocket_awb}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Courier</p>
              <p className="font-medium text-gray-900">{order.shiprocket_courier_name ?? '—'}</p>
            </div>
            {order.expected_delivery_date && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Expected delivery</p>
                <p className="font-medium text-gray-900">{order.expected_delivery_date}</p>
              </div>
            )}
            {order.tracking_url && (
              <div className="sm:col-span-2">
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Track on Shiprocket
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => openDoc('label', 'label_url')}
            >
              {loading === 'label' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Package className="w-4 h-4 mr-1" />
              )}
              Label
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => openDoc('invoice', 'invoice_url')}
            >
              {loading === 'invoice' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <FileText className="w-4 h-4 mr-1" />
              )}
              Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => openDoc('manifest', 'manifest_url')}
            >
              {loading === 'manifest' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <ClipboardList className="w-4 h-4 mr-1" />
              )}
              Manifest
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={refreshTracking}
            >
              {loading === 'track' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Track
            </Button>
            {!['shipped', 'delivered'].includes(order.status) && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={!!loading}
                onClick={cancelShipment}
              >
                {loading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                Cancel
              </Button>
            )}
          </div>

          {trackingEvents.length > 0 && (
            <div className="border-t border-gray-50 pt-3 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase">Tracking timeline</p>
              {trackingEvents.map((ev, i) => (
                <div key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{ev.activity}</span>
                  {ev.location && <span className="text-gray-400"> · {ev.location}</span>}
                  {ev.date && <span className="block text-gray-400">{ev.date}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Check courier rates for this delivery pincode, pick one, then create the shipment.
            {computedWeight != null && (
              <span className="block mt-1 text-gray-400">
                Estimated weight: <strong>{computedWeight} kg</strong>
              </span>
            )}
          </p>

          <div className="flex gap-2 items-end">
            <div className="flex-1 max-w-[140px]">
              <label className="text-xs text-gray-500 mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Auto"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <Button
              onClick={checkServiceability}
              disabled={!!loading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {loading === 'serviceability' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Check Serviceability
            </Button>
          </div>

          {couriers.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-100 rounded-lg p-2">
              {couriers.map((c) => (
                <label
                  key={c.courier_company_id}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${
                    selectedCourierId === c.courier_company_id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="courier"
                    className="mt-1"
                    checked={selectedCourierId === c.courier_company_id}
                    onChange={() => setSelectedCourierId(c.courier_company_id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.courier_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(c.rate)} · ETA {c.estimated_delivery_days || c.etd} days
                      {c.rating > 0 && ` · ★ ${c.rating}`}
                      {c.cod === 1 && ' · COD'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {couriers.length > 0 && (
            <Button
              onClick={createShipment}
              disabled={!!loading || selectedCourierId == null}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {loading === 'create' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Truck className="w-4 h-4 mr-1" />
              )}
              Create Shipment
            </Button>
          )}
        </>
      )}
    </div>
  );
}
