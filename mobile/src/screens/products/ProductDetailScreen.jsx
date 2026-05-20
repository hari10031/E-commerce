import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, Alert, ActivityIndicator, Modal,
  FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  getProduct, publishProduct, unpublishProduct, deleteProduct, recordSale,
} from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatPrice, discountedPrice, formatDate } from '../../lib/utils';
import { PRODUCT_TYPES } from '../../constants';
import useAuthStore from '../../store/authStore';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 320;

const COLOR_MAP = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  pink: '#ec4899', purple: '#a855f7', orange: '#f97316', black: '#1f2937',
  white: '#f9fafb', gold: '#d97706', silver: '#9ca3af', brown: '#92400e',
  maroon: '#881337', navy: '#1e3a5a', teal: '#14b8a6', beige: '#d4c5a9',
  cream: '#fffdd0', magenta: '#d946ef', coral: '#f87171', peach: '#fdba74',
};

function getColorHex(name) {
  if (!name) return '#d1d5db';
  const lower = name.toLowerCase().trim();
  return COLOR_MAP[lower] || '#d1d5db';
}

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const viewMode = useAuthStore((s) => s.viewMode);
  const galleryRef = useRef(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [sellVariant, setSellVariant] = useState(null);
  const [sellQty, setSellQty] = useState(1);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'employee';
  const isCustomerView = viewMode === 'user';

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishProduct(productId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishProduct(productId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['products'] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const sellMutation = useMutation({
    mutationFn: ({ variantId, quantity }) => recordSale({ variant_id: variantId, quantity }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSellVariant(null);
      Alert.alert('Sale recorded', 'Stock has been updated.');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const openSell = (variant) => {
    setSellVariant(variant);
    setSellQty(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveImageIdx(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  if (isLoading) return <LoadingSpinner message="Loading product…" />;
  if (!product) return null;

  const typeConfig = PRODUCT_TYPES.find((t) => t.value === product.type);
  const finalPrice = discountedPrice(product.base_price, product.discount_pct);
  const images = product.images ?? [];
  const variants = product.variants ?? [];

  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  const renderGalleryItem = useCallback(({ item }) => {
    if (!item.url) {
      return (
        <View
          style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
          className="items-center justify-center bg-amber-50"
        >
          <Ionicons name="image-outline" size={48} color="#fbbf24" />
          <Text className="text-amber-600 font-medium mt-2 text-sm">
            {product.title}
          </Text>
        </View>
      );
    }
    return (
      <Image
        source={{ uri: item.url }}
        style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
        resizeMode="cover"
      />
    );
  }, [product.title]);

  const galleryData = images.length > 0 ? images : [{ id: 'placeholder', url: null }];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View className="relative" style={{ height: IMAGE_HEIGHT }}>
          <FlatList
            ref={galleryRef}
            data={galleryData}
            renderItem={renderGalleryItem}
            keyExtractor={(item, idx) => item.id?.toString() || `img-${idx}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />

          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={20} color="#1f2937" />
          </Pressable>

          {/* Edit button (admin only, not in customer view) */}
          {isAdmin && !isCustomerView && (
            <Pressable
              onPress={() => navigation.navigate('ProductWizard', {
                mode: 'edit',
                type: product.type,
                productId,
              })}
              style={{ top: insets.top + 8 }}
              className="absolute right-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="pencil" size={18} color="#1f2937" />
            </Pressable>
          )}

          {/* Dot indicators */}
          {galleryData.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center">
              {galleryData.map((_, idx) => (
                <View
                  key={idx}
                  className="mx-1 rounded-full"
                  style={{
                    width: idx === activeImageIdx ? 8 : 6,
                    height: idx === activeImageIdx ? 8 : 6,
                    backgroundColor: idx === activeImageIdx ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-4 pt-4">
          {/* Status & type badges */}
          <View className="flex-row items-center mb-3 flex-wrap gap-2">
            {!isCustomerView && (
              <View className={`px-2.5 py-1 rounded-full ${product.published ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-semibold ${product.published ? 'text-green-700' : 'text-gray-600'}`}>
                  {product.published ? 'Published' : 'Draft'}
                </Text>
              </View>
            )}
            <View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-full">
              <Text className="text-xs mr-1">{typeConfig?.emoji}</Text>
              <Text className="text-xs font-semibold text-amber-700 capitalize">{product.type}</Text>
            </View>
            {product.category && (
              <View className="bg-indigo-50 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-semibold text-indigo-700">{product.category.name}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2">{product.title}</Text>

          {/* Price */}
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900">{formatPrice(finalPrice)}</Text>
            {product.discount_pct > 0 && (
              <>
                <Text className="text-base text-gray-400 line-through ml-2">
                  {formatPrice(product.base_price)}
                </Text>
                <View className="bg-red-50 px-2 py-0.5 rounded ml-2">
                  <Text className="text-xs text-red-600 font-bold">{product.discount_pct}% off</Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <Text className="text-sm text-gray-600 leading-5">{product.description}</Text>
            </View>
          )}

          {/* Available Colors */}
          {uniqueColors.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Available Colors</Text>
              <View className="flex-row flex-wrap gap-3">
                {uniqueColors.map((color) => (
                  <View key={color} className="items-center">
                    <View
                      className="w-8 h-8 rounded-full border border-gray-200"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    <Text className="text-xs text-gray-500 mt-1 capitalize">{color}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Available Sizes */}
          {uniqueSizes.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Available Sizes</Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <View key={size} className="bg-gray-100 px-3.5 py-2 rounded-lg">
                    <Text className="text-sm font-medium text-gray-700">{size}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stock & Variants — staff only, not customer view */}
          {isStaff && !isCustomerView && variants.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Stock & Variants ({variants.length})
              </Text>
              {variants.map((v) => {
                const stockColor =
                  v.quantity === 0 ? 'red' : v.quantity < 5 ? 'amber' : 'green';
                const stockBg =
                  v.quantity === 0 ? 'bg-red-100' : v.quantity < 5 ? 'bg-amber-100' : 'bg-green-100';
                const stockText =
                  v.quantity === 0 ? 'text-red-700' : v.quantity < 5 ? 'text-amber-700' : 'text-green-700';

                return (
                  <View key={v.id} className="flex-row items-center py-2.5 border-b border-gray-50">
                    {v.color && (
                      <View
                        className="w-5 h-5 rounded-full mr-2 border border-gray-200"
                        style={{ backgroundColor: getColorHex(v.color) }}
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-sm text-gray-800">
                        {[v.color, v.size].filter(Boolean).join(' · ') || 'Default'}
                      </Text>
                      {v.sku ? (
                        <Text className="text-xs text-gray-400 mt-0.5">SKU: {v.sku}</Text>
                      ) : null}
                    </View>
                    <View className={`px-2.5 py-1 rounded-full mr-2 ${stockBg}`}>
                      <Text className={`text-xs font-semibold ${stockText}`}>
                        {v.quantity} in stock
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => openSell(v)}
                      disabled={v.quantity === 0}
                      className={`px-3 py-1.5 rounded-lg ${
                        v.quantity === 0 ? 'bg-gray-100' : 'bg-amber-500 active:bg-amber-600'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          v.quantity === 0 ? 'text-gray-400' : 'text-white'
                        }`}
                      >
                        Sell
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Coupon */}
          {product.coupon_code && !isCustomerView && (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-row items-center">
              <Ionicons name="pricetag" size={18} color="#f59e0b" />
              <View className="ml-3">
                <Text className="text-sm font-bold text-gray-900">{product.coupon_code}</Text>
                <Text className="text-xs text-gray-500">
                  {product.coupon_disc}% extra off with this code
                </Text>
              </View>
            </View>
          )}

          {!isCustomerView && (
            <Text className="text-xs text-gray-400 mb-4">
              Last updated: {formatDate(product.updated_at)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Action bar */}
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3"
      >
        {isCustomerView ? (
          <Pressable
            disabled
            className="flex-1 bg-amber-500 rounded-xl py-3.5 items-center opacity-60"
          >
            <Text className="text-white font-semibold text-sm">Add to Cart</Text>
            <Text className="text-white/70 text-xs mt-0.5">Coming Soon</Text>
          </Pressable>
        ) : (
          <View className="flex-row gap-3">
            {isAdmin && (
              <>
                {product.published ? (
                  <Pressable
                    onPress={() => unpublishMutation.mutate()}
                    disabled={unpublishMutation.isPending}
                    className="flex-1 border border-gray-300 rounded-xl py-3.5 items-center active:bg-gray-50"
                  >
                    {unpublishMutation.isPending ? (
                      <ActivityIndicator size="small" color="#6b7280" />
                    ) : (
                      <Text className="text-gray-700 font-semibold text-sm">Unpublish</Text>
                    )}
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="flex-1 bg-amber-500 rounded-xl py-3.5 items-center active:bg-amber-600"
                  >
                    {publishMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-white font-semibold text-sm">Publish</Text>
                    )}
                  </Pressable>
                )}

                <Pressable
                  onPress={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="w-12 h-12 border border-red-200 rounded-xl items-center justify-center active:bg-red-50"
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  )}
                </Pressable>
              </>
            )}

            {!isAdmin && isStaff && (
              <View className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center">
                <Text className="text-gray-500 font-medium text-sm">View Only</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Sell modal */}
      <Modal
        visible={!!sellVariant}
        transparent
        animationType="fade"
        onRequestClose={() => setSellVariant(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={() => setSellVariant(null)}
        >
          <Pressable className="bg-white rounded-2xl p-5 w-full" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-gray-900 mb-1">Mark as Sold</Text>
            <Text className="text-sm text-gray-500 mb-4">
              {product.title}
              {sellVariant
                ? ` — ${[sellVariant.color, sellVariant.size].filter(Boolean).join(' · ') || 'Default'}`
                : ''}
            </Text>

            {sellVariant?.color && (
              <View className="flex-row items-center mb-4">
                <View
                  className="w-5 h-5 rounded-full mr-2 border border-gray-200"
                  style={{ backgroundColor: getColorHex(sellVariant.color) }}
                />
                <Text className="text-sm text-gray-700 capitalize">{sellVariant.color}</Text>
                {sellVariant.size && (
                  <Text className="text-sm text-gray-400 ml-2">Size: {sellVariant.size}</Text>
                )}
              </View>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-2">Quantity sold</Text>
            <View className="flex-row items-center justify-center mb-5">
              <Pressable
                onPress={() => setSellQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
              >
                <Ionicons name="remove" size={20} color="#1f2937" />
              </Pressable>
              <Text className="text-2xl font-bold text-gray-900 mx-8 w-12 text-center">
                {sellQty}
              </Text>
              <Pressable
                onPress={() => setSellQty((q) => Math.min(sellVariant?.quantity ?? 1, q + 1))}
                className="w-11 h-11 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
              >
                <Ionicons name="add" size={20} color="#1f2937" />
              </Pressable>
            </View>
            <Text className="text-xs text-gray-400 text-center mb-5">
              {sellVariant?.quantity ?? 0} available
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setSellVariant(null)}
                className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center active:bg-gray-50"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  sellMutation.mutate({ variantId: sellVariant.id, quantity: sellQty })
                }
                disabled={sellMutation.isPending}
                className="flex-1 bg-amber-500 rounded-xl py-3.5 items-center active:bg-amber-600"
              >
                {sellMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold">Record Sale</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
