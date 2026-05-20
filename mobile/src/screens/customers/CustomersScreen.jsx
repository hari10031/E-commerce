import React, { useState, useMemo } from 'react';
import {
  View, Text, SectionList, Pressable, TextInput,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getOrders } from '../../lib/api';
import { formatPrice, initials } from '../../lib/utils';
import { ORDER_STATUS_CONFIG } from '../../constants';
import EmptyState from '../../components/ui/EmptyState';

const AVATAR_COLORS = ['#ec4899', '#8b5cf6', '#f59e0b', '#14b8a6', '#881337'];

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
];

const PENDING_STATUSES = new Set(['placed', 'confirmed', 'processing']);
const COMPLETED_STATUSES = new Set(['shipped', 'delivered']);

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function CustomersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customers-orders'],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
    staleTime: 30_000,
  });

  const orders = data?.data ?? [];

  const sections = useMemo(() => {
    let filtered = orders;

    if (activeFilter === 'pending') {
      filtered = filtered.filter((o) => PENDING_STATUSES.has(o.status));
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter((o) => COMPLETED_STATUSES.has(o.status));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const name = o.user?.name ?? o.address?.name ?? '';
        return name.toLowerCase().includes(q);
      });
    }

    const grouped = {};
    filtered.forEach((order) => {
      const key = order.created_at
        ? format(parseISO(order.created_at), 'EEEE, dd MMM yyyy')
        : 'Unknown Date';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(order);
    });

    return Object.entries(grouped)
      .sort(([, a], [, b]) => {
        const da = a[0]?.created_at ?? '';
        const db = b[0]?.created_at ?? '';
        return db.localeCompare(da);
      })
      .map(([title, items]) => ({ title, data: items }));
  }, [orders, activeFilter, search]);

  const totalCount = orders.length;

  const renderSectionHeader = ({ section }) => (
    <View className="px-4 pt-4 pb-2 bg-gray-50">
      <Text className="text-sm font-bold text-gray-800">{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const customerName = item.user?.name ?? item.address?.name ?? 'Customer';
    const productName =
      item.order_items?.[0]?.product?.title ??
      `${item.order_items?.length ?? 0} item(s)`;
    const phone = item.user?.phone ?? item.address?.phone ?? '';
    const cfg = ORDER_STATUS_CONFIG[item.status] ?? ORDER_STATUS_CONFIG.placed;
    const isPending = PENDING_STATUSES.has(item.status);

    return (
      <Pressable
        onPress={() => navigation.navigate('CustomerDetail', { orderId: item.id })}
        className="mx-4 mb-2 bg-white rounded-2xl shadow-sm p-4 flex-row items-center active:bg-gray-50"
      >
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: avatarColor(customerName) }}
        >
          <Text className="text-white font-bold text-lg">
            {initials(customerName).charAt(0)}
          </Text>
        </View>

        <View className="flex-1 mr-3">
          <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
            {customerName}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {productName}
          </Text>
          {phone ? (
            <Text className="text-xs text-gray-400 mt-0.5">{phone}</Text>
          ) : null}
        </View>

        <View className="items-end">
          <Text className="text-sm font-bold text-gray-900 mb-1">
            {formatPrice(item.total_amount)}
          </Text>
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: isPending ? '#fef3c7' : cfg.bg }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: isPending ? '#b45309' : cfg.text }}
            >
              {cfg.label}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-amber-50 border-b border-amber-100"
      >
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Customers</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {totalCount} total
            </Text>
          </View>
          <View className="w-10 h-10 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name="person-add-outline" size={20} color="#b45309" />
          </View>
        </View>

        {/* Filter tabs */}
        <View className="flex-row px-4 pb-3 gap-2">
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === tab.value
                  ? 'bg-amber-500 border-amber-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === tab.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search */}
        <View className="mx-4 mb-3 flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search by customer name…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 4 }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No customers found"
              message={
                search
                  ? 'Try a different search term'
                  : 'Customer orders will appear here'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#f59e0b"
              colors={['#f59e0b']}
            />
          }
        />
      )}
    </View>
  );
}
