import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { getSales, getCategorySales, getEmployeePerformance, getSalesSummary } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

function SectionCard({ title, subtitle, children }) {
  return (
    <View className="mx-4 bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        {subtitle && <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>}
      </View>
      <View className="px-4 pb-4">{children}</View>
    </View>
  );
}

function RankBadge({ rank }) {
  const colors = ['bg-amber-500', 'bg-gray-400', 'bg-amber-700'];
  const bgClass = rank <= 3 ? colors[rank - 1] : 'bg-gray-200';
  const textClass = rank <= 3 ? 'text-white' : 'text-gray-600';

  return (
    <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${bgClass}`}>
      <Text className={`text-xs font-bold ${textClass}`}>{rank}</Text>
    </View>
  );
}

export default function AnalyticsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: getSales,
    staleTime: 60_000,
  });

  const { data: catSales, isLoading: catLoading } = useQuery({
    queryKey: ['category-sales'],
    queryFn: getCategorySales,
    staleTime: 60_000,
  });

  const { data: empPerf, isLoading: empLoading } = useQuery({
    queryKey: ['employee-performance'],
    queryFn: getEmployeePerformance,
    staleTime: 60_000,
  });

  const { data: salesSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: getSalesSummary,
    staleTime: 60_000,
  });

  const isLoading = salesLoading && catLoading && empLoading && summaryLoading;

  const barData = (salesData ?? []).map((day) => ({
    value: day.revenue ?? 0,
    label: new Date(day.date).getDate().toString().padStart(2, '0'),
    frontColor: '#be185d',
  }));

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="Analytics"
        subtitle="Last 30 days"
        navigation={navigation}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#be185d" />
          <Text className="text-sm text-gray-500 mt-3">Loading analytics…</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sales Trend */}
          <SectionCard title="Daily revenue (30 days)" subtitle="Sales trend">
            {barData.length > 0 ? (
              <View className="mt-2">
                <BarChart
                  data={barData}
                  barWidth={20}
                  spacing={8}
                  height={160}
                  hideRules
                  noOfSections={4}
                  barBorderRadius={4}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#e5e7eb"
                  xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 9 }}
                  yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                  isAnimated
                  animationDuration={600}
                />
              </View>
            ) : (
              <Text className="text-sm text-gray-400 text-center py-8">No sales data available</Text>
            )}
          </SectionCard>

          {/* Top Products */}
          {(catSales?.length ?? 0) > 0 && (
            <SectionCard title="Top Sarees" subtitle="By revenue">
              {catSales.map((item, i) => (
                <View
                  key={item.type ?? i}
                  className="flex-row items-center py-3 border-b border-gray-50"
                >
                  <RankBadge rank={i + 1} />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900 capitalize">{item.type}</Text>
                    <Text className="text-xs text-gray-500">{item.count ?? item.saleCount ?? 0} sales</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{formatPrice(item.revenue)}</Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Top Performers */}
          {(empPerf?.employees?.length ?? 0) > 0 && (
            <SectionCard title="Revenue by employee" subtitle="Top performers">
              {empPerf.employees.map((emp, i) => (
                <View
                  key={emp.id}
                  className="flex-row items-center py-3 border-b border-gray-50"
                >
                  <RankBadge rank={i + 1} />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{emp.name}</Text>
                    <Text className="text-xs text-gray-500">{emp.saleCount} sales · {emp.itemsSold} items</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{formatPrice(emp.revenue)}</Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Sales Summary */}
          {salesSummary && (
            <SectionCard title="Sales Summary" subtitle="Online vs Offline">
              <View className="mt-2 gap-3">
                <View className="bg-blue-50 rounded-xl p-4 flex-row items-center">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="globe-outline" size={20} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-blue-600 font-medium">Online</Text>
                    <Text className="text-lg font-bold text-gray-900">{formatPrice(salesSummary.onlineRevenue)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500">{salesSummary.onlineCount} orders</Text>
                  </View>
                </View>

                <View className="bg-amber-50 rounded-xl p-4 flex-row items-center">
                  <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="storefront-outline" size={20} color="#d97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-amber-600 font-medium">Offline</Text>
                    <Text className="text-lg font-bold text-gray-900">{formatPrice(salesSummary.offlineRevenue)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500">{salesSummary.offlineCount} sales</Text>
                  </View>
                </View>
              </View>
            </SectionCard>
          )}
        </ScrollView>
      )}
    </View>
  );
}
