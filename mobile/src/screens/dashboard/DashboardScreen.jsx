import React from 'react';
import {
  View, Text, ScrollView, RefreshControl, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getDashboard, getSales, getCategoryInventory } from '../../lib/api';
import KpiCard from '../../components/analytics/KpiCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatPrice, formatDate, shortId, timeAgo } from '../../lib/utils';
import { ORDER_STATUS_CONFIG } from '../../constants';
import useAuthStore from '../../store/authStore';

const KPI_CONFIG = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: 'cash', bgColor: '#fef3c7', iconColor: '#f59e0b', format: formatPrice },
  { key: 'revenueThisMonth', label: 'This Month', icon: 'trending-up', bgColor: '#dcfce7', iconColor: '#22c55e', format: formatPrice },
  { key: 'totalOrders', label: 'Total Orders', icon: 'receipt', bgColor: '#dbeafe', iconColor: '#3b82f6', format: (v) => v?.toLocaleString() },
  { key: 'pendingOrders', label: 'Pending', icon: 'time', bgColor: '#fef9c3', iconColor: '#ca8a04', format: (v) => v?.toString() },
  { key: 'lowStockVariants', label: 'Low Stock', icon: 'warning', bgColor: '#fee2e2', iconColor: '#ef4444', format: (v) => v?.toString() },
  { key: 'totalProducts', label: 'Products', icon: 'cube', bgColor: '#f3e8ff', iconColor: '#8b5cf6', format: (v) => v?.toLocaleString() },
];

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
  });

  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: getSales,
    staleTime: 60_000,
  });

  const { data: catInventory } = useQuery({
    queryKey: ['category-inventory'],
    queryFn: getCategoryInventory,
    staleTime: 60_000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#f59e0b"
          colors={['#f59e0b']}
        />
      }
    >
      {/* Header */}
      <View className="px-4 mb-6">
        <Text className="text-sm text-gray-500">{greeting()},</Text>
        <Text className="text-2xl font-bold text-gray-900">{user?.name?.split(' ')[0]} 👋</Text>
      </View>

      {/* KPI Grid */}
      <View className="px-4 mb-6">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Overview</Text>
        <View className="flex-row flex-wrap gap-3">
          {KPI_CONFIG.map(({ key, label, icon, bgColor, iconColor, format }) => (
            <KpiCard
              key={key}
              label={label}
              value={stats ? format(stats[key] ?? 0) : '—'}
              icon={icon}
              bgColor={bgColor}
              iconColor={iconColor}
            />
          ))}
        </View>
      </View>

      {/* Revenue Chart */}
      <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-6">
        <Text className="text-base font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</Text>
        <RevenueChart data={salesData ?? []} />
      </View>

      {/* Stock by Category */}
      {(catInventory?.length ?? 0) > 0 && (
        <View className="mx-4 bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <View className="px-4 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Stock by Category</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Items left in each category</Text>
          </View>
          {catInventory.map((c) => (
            <View key={c.id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">{c.name}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{c.variantCount} variants</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  c.itemsLeft === 0 ? 'bg-red-100' : c.itemsLeft < 10 ? 'bg-amber-100' : 'bg-green-100'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    c.itemsLeft === 0 ? 'text-red-700' : c.itemsLeft < 10 ? 'text-amber-700' : 'text-green-700'
                  }`}
                >
                  {c.itemsLeft} left
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Orders */}
      {stats?.recentOrders?.length > 0 && (
        <View className="mx-4 bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Recent Orders</Text>
            <Pressable onPress={() => navigation.navigate('OrdersTab')}>
              <Text className="text-amber-600 text-sm font-medium">View all</Text>
            </Pressable>
          </View>
          {stats.recentOrders.slice(0, 5).map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.placed;
            return (
              <View key={order.id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">#{shortId(order.id)}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{timeAgo(order.created_at)}</Text>
                </View>
                <Text className="text-sm font-bold text-gray-900 mr-3">
                  {formatPrice(order.total_amount)}
                </Text>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Text className="text-xs font-semibold" style={{ color: cfg.text }}>
                    {cfg.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
