import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable,
  RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, getCategories } from '../../lib/api';
import ProductCard from '../../components/products/ProductCard';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_FILTERS = [
  { label: 'All', value: null },
  { label: '🥻 Saree', value: 'saree' },
  { label: '👗 Dress', value: 'dress' },
  { label: '💎 Jewellery', value: 'jewellery' },
];

export default function ProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 120_000,
  });

  const allCats = categories ?? [];
  const topLevel = allCats.filter((c) => !c.parent_id);
  const childrenOf = (id) => allCats.filter((c) => c.parent_id === id);
  const selectedCat = allCats.find((c) => c.id === categoryFilter);
  const activeParentId = selectedCat?.parent_id || selectedCat?.id || null;
  const subCats = activeParentId ? childrenOf(activeParentId) : [];

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching,
  } = useInfiniteQuery({
    queryKey: ['products', search, typeFilter, categoryFilter],
    queryFn: ({ pageParam = 1 }) =>
      getProducts({
        page: pageParam,
        limit: 20,
        search: search || undefined,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
      }),
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 30_000,
  });

  const products = data?.pages.flatMap((p) => p.data) ?? [];

  const renderItem = useCallback(({ item }) => (
    <View className="flex-1 p-1.5">
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    </View>
  ), [navigation]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  };

  const chip = (active) =>
    `px-3 py-1.5 rounded-full border mr-2 ${
      active ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-200'
    }`;
  const chipText = (active) =>
    `text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between pt-3 mb-3">
          <Text className="text-2xl font-bold text-gray-900">Products</Text>
          <Pressable
            onPress={() => navigation.navigate('ProductWizard', { mode: 'create' })}
            className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center active:bg-amber-600"
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search products…"
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

        {/* Type filters */}
        <View className="flex-row mb-2">
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.label}
              onPress={() => setTypeFilter(f.value)}
              className={chip(typeFilter === f.value)}
            >
              <Text className={chipText(typeFilter === f.value)}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Category filters */}
        {topLevel.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1">
            <Pressable onPress={() => setCategoryFilter(null)} className={chip(!categoryFilter)}>
              <Text className={chipText(!categoryFilter)}>All categories</Text>
            </Pressable>
            {topLevel.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryFilter(cat.id)}
                className={chip(activeParentId === cat.id)}
              >
                <Text className={chipText(activeParentId === cat.id)}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Sub-category filters */}
        {subCats.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subCats.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full border mr-2 ${
                  categoryFilter === cat.id ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    categoryFilter === cat.id ? 'text-amber-700' : 'text-gray-500'
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={isLoading ? [] : products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 10, paddingBottom: insets.bottom + 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="cube-outline"
              title="No products found"
              message={search ? 'Try a different search term' : 'Add your first product'}
              action={!search ? 'Add Product' : undefined}
              onAction={() => navigation.navigate('ProductWizard', { mode: 'create' })}
            />
          )
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
    </View>
  );
}
