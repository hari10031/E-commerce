import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { getProducts } from '../../lib/api';
import { MOCK_CATEGORIES } from '../../constants/categories';
import { MOCK_PRODUCTS } from '../../constants/mockProducts';
import ProductCard from '../../components/products/ProductCard';

const WARM_BG = '#fffaf5';
const CARD_BG = '#ffffff';
const SECTION_BORDER = '#fde8d0';
const AMBER_500 = '#f59e0b';

const TYPE_CARDS = [
  { key: 'saree', label: 'Sarees', emoji: '🥻', bgColor: '#fff1f2', textColor: '#9f1239', borderColor: '#fecdd3', icon: 'shirt-outline', iconColor: '#db2777' },
  { key: 'dress', label: 'Dresses', emoji: '👗', bgColor: '#f5f3ff', textColor: '#5b21b6', borderColor: '#ddd6fe', icon: 'flower-outline', iconColor: '#7c3aed' },
  { key: 'jewellery', label: 'Gold & Jewellery', emoji: '💎', bgColor: '#fffbeb', textColor: '#92400e', borderColor: '#fde68a', icon: 'diamond-outline', iconColor: '#d97706' },
];

function Divider() {
  return (
    <View className="flex-row items-center my-4 mx-6">
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
      <Text className="mx-3" style={{ color: '#d4a017', fontSize: 8 }}>✦</Text>
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
    </View>
  );
}

function getProductCount(type, catId) {
  return MOCK_PRODUCTS.filter((p) => {
    if (p.type !== type) return false;
    if (catId && p.category?.id !== catId) return false;
    return true;
  }).length;
}

export default function ProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const viewMode = useAuthStore((s) => s.viewMode);

  const role = viewMode === 'user' ? 'customer' : (user?.role || 'customer');
  const canAdd = role === 'admin' || role === 'employee';

  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = selectedType ? (MOCK_CATEGORIES[selectedType] ?? []) : [];
  const currentTypeCard = TYPE_CARDS.find((t) => t.key === selectedType);

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else if (selectedType) {
      setSelectedType(null);
    }
  };

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching, isError, error,
  } = useInfiniteQuery({
    queryKey: ['products', selectedType, selectedCategory],
    queryFn: ({ pageParam = 1 }) =>
      getProducts({
        page: pageParam, limit: 20,
        type: selectedType,
        ...(selectedCategory ? { category: selectedCategory } : {}),
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
    enabled: !!selectedType && !!selectedCategory,
  });

  const apiProducts = data?.pages.flatMap((p) => p.data) ?? [];
  const products = apiProducts.length > 0 ? apiProducts : MOCK_PRODUCTS.filter((p) => {
    const typeMatch = p.type === selectedType;
    const catMatch = !selectedCategory || p.category?.id === selectedCategory;
    return typeMatch && catMatch;
  });

  const renderProductItem = useCallback(({ item }) => (
    <View className="flex-1 p-1.5 max-w-[50%]">
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    </View>
  ), [navigation]);

  // ─── Level 1: Type Selection ─────────────────────────────────────

  const renderTypeSelection = () => (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
      <Text className="text-center text-sm mb-2" style={{ color: '#a16207' }}>
        Browse our handpicked collections
      </Text>

      <Divider />

      {/* Top row: Sarees + Dresses */}
      <View className="flex-row gap-4 mb-4 px-2">
        {TYPE_CARDS.slice(0, 2).map((tc) => {
          const count = getProductCount(tc.key);
          return (
            <Pressable
              key={tc.key}
              onPress={() => setSelectedType(tc.key)}
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ backgroundColor: tc.bgColor, borderWidth: 1.5, borderColor: tc.borderColor, minHeight: 180 }}
            >
              <View className="flex-1 items-center justify-center p-4">
                <Text className="text-5xl mb-3">{tc.emoji}</Text>
                <Ionicons name={tc.icon} size={24} color={tc.iconColor} />
                <Text className="text-base font-bold mt-2" style={{ color: tc.textColor }}>{tc.label}</Text>
                <Text className="text-xs mt-1" style={{ color: tc.textColor + '99' }}>{count} items</Text>
              </View>
              <View className="px-4 py-2.5 items-center" style={{ backgroundColor: tc.textColor + '10' }}>
                <Text className="text-xs font-semibold" style={{ color: tc.textColor }}>
                  Explore <Ionicons name="arrow-forward" size={10} color={tc.textColor} />
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom: Gold centered */}
      <View className="items-center px-2">
        <Pressable
          onPress={() => setSelectedType('jewellery')}
          className="rounded-2xl overflow-hidden"
          style={{
            width: '60%', backgroundColor: TYPE_CARDS[2].bgColor,
            borderWidth: 1.5, borderColor: TYPE_CARDS[2].borderColor, minHeight: 180,
          }}
        >
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-5xl mb-3">{TYPE_CARDS[2].emoji}</Text>
            <Ionicons name={TYPE_CARDS[2].icon} size={24} color={TYPE_CARDS[2].iconColor} />
            <Text className="text-base font-bold mt-2" style={{ color: TYPE_CARDS[2].textColor }}>{TYPE_CARDS[2].label}</Text>
            <Text className="text-xs mt-1" style={{ color: TYPE_CARDS[2].textColor + '99' }}>
              {getProductCount('jewellery')} items
            </Text>
          </View>
          <View className="px-4 py-2.5 items-center" style={{ backgroundColor: TYPE_CARDS[2].textColor + '10' }}>
            <Text className="text-xs font-semibold" style={{ color: TYPE_CARDS[2].textColor }}>
              Explore <Ionicons name="arrow-forward" size={10} color={TYPE_CARDS[2].textColor} />
            </Text>
          </View>
        </Pressable>
      </View>

      <Divider />

      <Text className="text-center text-xs" style={{ color: '#92400e' }}>
        Finest Indian textiles & jewellery, curated for you
      </Text>
    </ScrollView>
  );

  // ─── Level 2: Subcategory Selection ──────────────────────────────

  const renderCategorySelection = () => (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
      <Text className="text-center text-sm mb-1" style={{ color: '#a16207' }}>
        Choose a category
      </Text>

      <Divider />

      <View className="flex-row flex-wrap justify-between px-1">
        {categories.map((cat) => {
          const count = getProductCount(selectedType, cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className="mb-3 rounded-2xl overflow-hidden"
              style={{
                width: '48%', backgroundColor: CARD_BG,
                borderWidth: 1.5, borderColor: SECTION_BORDER,
              }}
            >
              <View className="p-4 items-center" style={{ minHeight: 100 }}>
                <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: currentTypeCard?.bgColor || '#fef7f0' }}>
                  <Ionicons name={currentTypeCard?.icon || 'layers'} size={18} color={currentTypeCard?.iconColor || '#d97706'} />
                </View>
                <Text className="text-sm font-bold text-center" style={{ color: '#78350f' }}>{cat.name}</Text>
                <Text className="text-xs mt-1" style={{ color: '#a16207' }}>{count} items</Text>
              </View>
              <View className="px-3 py-2 items-center" style={{ backgroundColor: '#fef7f0' }}>
                <Text className="text-[10px] font-semibold" style={{ color: '#b45309' }}>
                  View <Ionicons name="arrow-forward" size={8} color="#b45309" />
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {categories.length === 0 && (
        <View className="items-center py-12">
          <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#fef3c7' }}>
            <Ionicons name="folder-open-outline" size={28} color="#d97706" />
          </View>
          <Text className="text-sm font-semibold" style={{ color: '#78350f' }}>No categories yet</Text>
          <Text className="text-xs mt-1" style={{ color: '#a16207' }}>Categories will appear as products are added</Text>
        </View>
      )}
    </ScrollView>
  );

  // ─── Level 3: Product Grid ───────────────────────────────────────

  const categoryName = categories.find((c) => c.id === selectedCategory)?.name || '';

  const renderProductGrid = () => (
    <>
      {isError && !isLoading && (
        <View className="px-4 py-3 mx-4 mt-3 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
          <Text className="text-sm" style={{ color: '#b91c1c' }}>{error?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()} className="mt-2">
            <Text className="text-sm font-semibold" style={{ color: '#dc2626' }}>Tap to retry</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={isLoading ? [] : products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 6, paddingBottom: insets.bottom + 16, flexGrow: 1 }}
        columnWrapperStyle={products.length > 0 ? { justifyContent: 'space-between' } : undefined}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={AMBER_500} />
            <Text className="text-sm mt-3" style={{ color: '#a16207' }}>Loading products...</Text>
          </View>
        ) : null}
        ListFooterComponent={isFetchingNextPage ? (
          <View className="py-4 items-center"><ActivityIndicator color={AMBER_500} /></View>
        ) : null}
        ListEmptyComponent={!isLoading ? (
          <View className="flex-1 items-center justify-center py-16 px-8">
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#fef3c7' }}>
              <Ionicons name="cube-outline" size={32} color={AMBER_500} />
            </View>
            <Text className="text-base font-semibold text-center" style={{ color: '#78350f' }}>No {categoryName} yet</Text>
            <Text className="text-xs mt-2 text-center" style={{ color: '#a16207' }}>
              {canAdd ? 'Be the first to add a product here.' : 'Check back soon for new arrivals.'}
            </Text>
          </View>
        ) : null}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={AMBER_500} colors={[AMBER_500]} />
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  );

  // ─── Header ──────────────────────────────────────────────────────

  const level = selectedCategory ? 3 : selectedType ? 2 : 1;
  const headerTitle = level === 1 ? 'Collections' : level === 2 ? (currentTypeCard?.label || 'Category') : categoryName;

  return (
    <View className="flex-1" style={{ backgroundColor: WARM_BG, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-3 pb-3" style={{ backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: SECTION_BORDER }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {level > 1 && (
              <Pressable onPress={handleBack} className="w-9 h-9 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#fef2f2' }}>
                <Ionicons name="arrow-back" size={20} color="#b91c1c" />
              </Pressable>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: '#78350f' }}>{headerTitle}</Text>
              {level > 1 && (
                <Text className="text-xs" style={{ color: '#a16207' }}>
                  {level === 2 ? `${categories.length} categories` : `${products.length} products`}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center">
            <Pressable className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#fef7f0' }}>
              <Ionicons name="search" size={18} color="#92400e" />
            </Pressable>
            {canAdd && level === 3 && (
              <Pressable
                onPress={() => navigation.navigate('ProductWizard', { mode: 'create', type: selectedType })}
                className="w-9 h-9 rounded-full items-center justify-center ml-2"
                style={{ backgroundColor: AMBER_500 }}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Content based on level */}
      {level === 1 && renderTypeSelection()}
      {level === 2 && renderCategorySelection()}
      {level === 3 && renderProductGrid()}
    </View>
  );
}
