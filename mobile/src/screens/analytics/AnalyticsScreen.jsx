import React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import {
  getDashboard, getSales, getInventory, getCategorySales,
  getSalesSummary, getEmployeePerformance,
} from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RevenueChart from '../../components/analytics/RevenueChart';
import CategoryChart from '../../components/analytics/CategoryChart';
import { formatPrice } from '../../lib/utils';
import { ORDER_STATUS_CONFIG } from '../../constants';

const PIE_COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444'];

export default function AnalyticsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
  });

  const { data: salesData } = useQuery({ queryKey: ['sales'], queryFn: getSales, staleTime: 60_000 });
  const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: getInventory, staleTime: 60_000 });
  const { data: catSales } = useQuery({ queryKey: ['category-sales'], queryFn: getCategorySales, staleTime: 60_000 });
  const { data: salesSummary } = useQuery({ queryKey: ['sales-summary'], queryFn: getSalesSummary, staleTime: 60_000 });
  const { data: empPerf } = useQuery({ queryKey: ['employee-performance'], queryFn: getEmployeePerformance, staleTime: 60_000 });

  if (isLoading) return <LoadingSpinner message="Loading analytics…" />;

  const orderStatusData = Object.entries(dashboard?.orderStatusCounts ?? {})
    .filter(([, count]) => count > 0)
    .map(([status, count], i) => ({
      value: count,
      color: PIE_COLORS[i % PIE_COLORS.length],
      text: `${count}`,
      label: ORDER_STATUS_CONFIG[status]?.label ?? status,
    }));

  const inventoryList = inventory ?? [];
  const lowStock = inventoryList.filter((v) => v.quantity > 0 && v.quantity < 5);
  const outOfStock = inventoryList.filter((v) => v.quantity === 0);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f59e0b" colors={['#f59e0b']} />
      }
    >
      <View className="flex-row items-center px-4 mb-5">
        {navigation && (
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-2 -ml-1 w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Ionicons name="arrow-back" size={22} color="#1f2937" />
          </Pressable>
        )}
        <Text className="text-2xl font-bold text-gray-900">Analytics</Text>
      </View>

      {/* Revenue chart */}
      <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-1">Revenue Trend</Text>
        <Text className="text-xs text-gray-500 mb-4">Last 30 days</Text>
        <RevenueChart data={salesData ?? []} />
      </View>

      {/* Sales channels — online vs offline */}
      {salesSummary && (
        <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Sales Channels</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-blue-50 rounded-xl p-3">
              <Text className="text-xs text-blue-600 font-medium mb-1">🌐 Online</Text>
              <Text className="text-lg font-bold text-gray-900">{formatPrice(salesSummary.onlineRevenue)}</Text>
              <Text className="text-xs text-gray-500">{salesSummary.onlineCount} web orders</Text>
            </View>
            <View className="flex-1 bg-amber-50 rounded-xl p-3">
              <Text className="text-xs text-amber-600 font-medium mb-1">🏪 Offline</Text>
              <Text className="text-lg font-bold text-gray-900">{formatPrice(salesSummary.offlineRevenue)}</Text>
              <Text className="text-xs text-gray-500">{salesSummary.offlineCount} in-person</Text>
            </View>
          </View>
        </View>
      )}

      {/* Employee performance */}
      {(empPerf?.employees?.length ?? 0) > 0 && (
        <View className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <View className="px-4 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Employee Performance</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Ranked by offline sales revenue</Text>
          </View>
          {empPerf.employees.map((emp, i) => (
            <View key={emp.id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
              <Text className="text-base mr-2 w-6 text-center">{i === 0 ? '🏆' : i + 1}</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">{emp.name}</Text>
                <Text className="text-xs text-gray-500">{emp.itemsSold} items · {emp.saleCount} sales</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900">{formatPrice(emp.revenue)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Category sales */}
      {(catSales?.length ?? 0) > 0 && (
        <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-1">Sales by Category</Text>
          <Text className="text-xs text-gray-500 mb-4">Revenue per product type</Text>
          <CategoryChart data={catSales} />
          <View className="flex-row flex-wrap gap-3 mt-4">
            {catSales.map((c, i) => (
              <View key={c.type} className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: ['#f59e0b', '#10b981', '#6366f1'][i % 3] }} />
                <Text className="text-xs text-gray-600 capitalize">{c.type}: {formatPrice(c.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Order status pie */}
      {orderStatusData.length > 0 && (
        <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">Order Distribution</Text>
          <View className="items-center mb-4">
            <PieChart
              data={orderStatusData}
              donut
              radius={80}
              innerRadius={50}
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900">
                    {orderStatusData.reduce((s, d) => s + d.value, 0)}
                  </Text>
                  <Text className="text-xs text-gray-500">Total</Text>
                </View>
              )}
              showText={false}
              strokeWidth={2}
              strokeColor="#ffffff"
            />
          </View>
          <View className="flex-row flex-wrap gap-3">
            {orderStatusData.map((d) => (
              <View key={d.label} className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: d.color }} />
                <Text className="text-xs text-gray-600">{d.label}: {d.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Inventory */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <View className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <View className="px-4 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Stock Alerts</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {outOfStock.length} out of stock · {lowStock.length} low stock
            </Text>
          </View>
          {[...outOfStock, ...lowStock].slice(0, 20).map((v) => (
            <View
              key={v.id}
              className="flex-row items-center px-4 py-3 border-b border-gray-50"
              style={{ backgroundColor: v.quantity === 0 ? '#fff1f2' : '#fffbeb' }}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{v.product?.title}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {[v.color, v.size].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: v.quantity === 0 ? '#fee2e2' : '#fef3c7' }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: v.quantity === 0 ? '#b91c1c' : '#b45309' }}
                >
                  {v.quantity === 0 ? 'Out of stock' : `${v.quantity} left`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
