import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, Alert, ActivityIndicator, Modal,
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

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [selectedImage, setSelectedImage] = useState(0);
  const [sellVariant, setSellVariant] = useState(null);
  const [sellQty, setSellQty] = useState(1);

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

  if (isLoading) return <LoadingSpinner message="Loading product…" />;
  if (!product) return null;

  const typeConfig = PRODUCT_TYPES.find((t) => t.value === product.type);
  const finalPrice = discountedPrice(product.base_price, product.discount_pct);
  const images = product.images ?? [];
  const variants = product.variants ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image gallery */}
        <View className="relative">
          <View className="h-72 bg-gray-200">
            {images.length > 0 ? (
              <Image
                source={{ uri: images[selectedImage]?.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={48} color="#d1d5db" />
              </View>
            )}
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={20} color="#1f2937" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('ProductWizard', { mode: 'edit', productId })}
            style={{ top: insets.top + 8 }}
            className="absolute right-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="pencil" size={18} color="#1f2937" />
          </Pressable>

          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="absolute bottom-3 px-3"
            >
              {images.map((img, idx) => (
                <Pressable key={img.id || idx} onPress={() => setSelectedImage(idx)} className="mr-2">
                  <Image
                    source={{ uri: img.url }}
                    className="w-12 h-12 rounded-lg"
                    style={{ borderWidth: selectedImage === idx ? 2 : 0, borderColor: '#f59e0b' }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View className="px-4 pt-4">
          {/* Status & type */}
          <View className="flex-row items-center mb-3 gap-2">
            <View className={`px-2.5 py-1 rounded-full ${product.published ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-semibold ${product.published ? 'text-green-700' : 'text-gray-600'}`}>
                {product.published ? 'Published' : 'Draft'}
              </Text>
            </View>
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
          <View className="flex-row items-center mb-3">
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

          {/* Variants */}
          {variants.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Variants ({variants.length})
              </Text>
              {variants.map((v) => (
                <View key={v.id} className="flex-row items-center py-2.5 border-b border-gray-50">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-800">
                      {[v.color, v.size].filter(Boolean).join(' · ') || 'Default'}
                    </Text>
                    {v.sku ? <Text className="text-xs text-gray-400 mt-0.5">SKU: {v.sku}</Text> : null}
                  </View>
                  <View className={`px-2.5 py-1 rounded-full mr-2 ${v.quantity === 0 ? 'bg-red-100' : v.quantity < 5 ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-semibold ${v.quantity === 0 ? 'text-red-700' : v.quantity < 5 ? 'text-amber-700' : 'text-green-700'}`}>
                      {v.quantity} in stock
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openSell(v)}
                    disabled={v.quantity === 0}
                    className={`px-3 py-1.5 rounded-lg ${v.quantity === 0 ? 'bg-gray-100' : 'bg-amber-500 active:bg-amber-600'}`}
                  >
                    <Text className={`text-xs font-bold ${v.quantity === 0 ? 'text-gray-400' : 'text-white'}`}>
                      Sell
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Coupon */}
          {product.coupon_code && (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-row items-center">
              <Ionicons name="pricetag" size={18} color="#f59e0b" />
              <View className="ml-3">
                <Text className="text-sm font-bold text-gray-900">{product.coupon_code}</Text>
                <Text className="text-xs text-gray-500">{product.coupon_disc}% extra off with this code</Text>
              </View>
            </View>
          )}

          <Text className="text-xs text-gray-400 mb-4">Last updated: {formatDate(product.updated_at)}</Text>
        </View>
      </ScrollView>

      {/* Action bar */}
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 flex-row gap-3"
      >
        {product.published ? (
          user?.role === 'admin' && (
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
          )
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

        {user?.role === 'admin' && (
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
        )}
      </View>

      {/* Mark-as-sold modal */}
      <Modal visible={!!sellVariant} transparent animationType="fade" onRequestClose={() => setSellVariant(null)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={() => setSellVariant(null)}>
          <Pressable className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-bold text-gray-900 mb-1">Mark as Sold</Text>
            <Text className="text-sm text-gray-500 mb-4">
              {product.title}
              {sellVariant ? ` — ${[sellVariant.color, sellVariant.size].filter(Boolean).join(' · ') || 'Default'}` : ''}
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">Quantity sold</Text>
            <View className="flex-row items-center justify-center mb-5">
              <Pressable
                onPress={() => setSellQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
              >
                <Ionicons name="remove" size={20} color="#1f2937" />
              </Pressable>
              <Text className="text-2xl font-bold text-gray-900 mx-8 w-12 text-center">{sellQty}</Text>
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
                onPress={() => sellMutation.mutate({ variantId: sellVariant.id, quantity: sellQty })}
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
