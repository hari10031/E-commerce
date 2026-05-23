import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { navigationRef } from '../../navigation/navigationRef';
import { getOfflineSales } from '../../lib/api';
import { formatPrice, formatDate } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 Days' },
  { key: 'month', label: '30 Days' },
];

const shadowStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
};

// Epoch ms cut-off for each filter.
function filterStart(key) {
  const now = new Date();
  if (key === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (key === 'week') return now.getTime() - 7 * 86400000;
  if (key === 'month') return now.getTime() - 30 * 86400000;
  return 0;
}

function SaleRow({ sale, showSeller }) {
  const amount = Number(sale.unit_price) * Number(sale.quantity);
  const variantLabel = [sale.variant?.color, sale.variant?.size].filter(Boolean).join(' · ');
  return (
    <View className="mx-4 mb-2 bg-white rounded-2xl p-4" style={shadowStyle}>
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
          <Ionicons name="bag-check-outline" size={18} color="#f59e0b" />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {sale.product?.title || 'Product'}
          </Text>
          {variantLabel ? (
            <Text className="text-xs text-gray-500 mt-0.5">{variantLabel}</Text>
          ) : null}
          <Text className="text-xs text-gray-400 mt-0.5">
            Qty {sale.quantity} · {formatDate(sale.created_at)}
          </Text>
        </View>
        <Text className="text-sm font-bold text-gray-900">{formatPrice(amount)}</Text>
      </View>
      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-50">
        <Ionicons name="person-outline" size={13} color="#9ca3af" />
        <Text className="text-xs text-gray-600 ml-1.5" numberOfLines={1}>
          {sale.customer_name || 'Walk-in customer'}
          {sale.customer_phone ? ` · ${sale.customer_phone}` : ''}
          {showSeller && sale.seller?.name ? ` · Sold by: ${sale.seller.name}` : ''}
        </Text>
      </View>
    </View>
  );
}

export default function MySalesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  };

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['offline-sales', isAdmin ? 'all' : 'mine'],
    queryFn: () => getOfflineSales({ limit: 200 }),
    staleTime: 30_000,
  });

  const allSales = data?.data ?? [];
  const cutoff = filterStart(filter);
  const sales = allSales.filter((s) => new Date(s.created_at).getTime() >= cutoff);

  const earnings = sales.reduce((sum, s) => sum + Number(s.unit_price) * Number(s.quantity), 0);
  const itemsSold = sales.reduce((sum, s) => sum + Number(s.quantity), 0);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={isAdmin ? "Sales History" : "My Sales"} onBack={handleBack} />

      <FlatList
        data={isLoading ? [] : sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SaleRow sale={item} showSeller={isAdmin} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f59e0b" colors={['#f59e0b']} />
        }
        ListHeaderComponent={
          <View className="px-4 pb-2">
            {/* Earnings summary */}
            <View className="bg-white rounded-2xl p-5 mb-3" style={shadowStyle}>
              <Text className="text-xs font-semibold text-gray-400 tracking-widest">
                {isAdmin ? "TOTAL REVENUE" : "MY EARNINGS"}
              </Text>
              <Text className="text-3xl font-bold text-gray-900 mt-1">{formatPrice(earnings)}</Text>
              <Text className="text-xs text-gray-500 mt-1">
                {sales.length} sales · {itemsSold} items sold
              </Text>
            </View>

            {/* Date filters */}
            <View className="flex-row bg-gray-100 rounded-xl p-1">
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={`flex-1 py-2 rounded-lg items-center ${filter === f.key ? 'bg-white' : ''}`}
                  style={filter === f.key ? shadowStyle : null}
                >
                  <Text
                    className={`text-xs font-semibold ${filter === f.key ? 'text-amber-600' : 'text-gray-500'}`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          ) : (
            <View className="items-center py-16 px-8">
              <Ionicons name="receipt-outline" size={36} color="#d1d5db" />
              <Text className="text-sm text-gray-400 mt-3 text-center">
                No sales in this period. Mark an item as sold from a product page.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
