import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, Modal, TextInput,
  ActivityIndicator, Alert, RefreshControl, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getCoupons, createCoupon, updateCoupon } from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { formatDate } from '../../lib/utils';
import * as Haptics from 'expo-haptics';

function CreateCouponModal({ visible, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({ code: '', discountPct: '', maxUses: '', expiresAt: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim() || !form.discountPct) {
      Alert.alert('Required', 'Code and discount % are required.');
      return;
    }
    onSave({
      code: form.code.toUpperCase().trim(),
      discount_pct: parseInt(form.discountPct),
      max_uses: form.maxUses ? parseInt(form.maxUses) : undefined,
      expires_at: form.expiresAt || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-5 pt-5 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-5">Create Coupon</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Coupon Code *</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base font-mono text-gray-900 bg-gray-50 uppercase"
              placeholder="SUMMER25"
              placeholderTextColor="#9ca3af"
              value={form.code}
              onChangeText={(t) => set('code', t.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Discount % *</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
                placeholder="20"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={form.discountPct}
                onChangeText={(t) => set('discountPct', t)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Max Uses</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
                placeholder="100"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={form.maxUses}
                onChangeText={(t) => set('maxUses', t)}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mt-2">
            <Pressable onPress={onClose} className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center">
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 rounded-xl py-3.5 items-center active:bg-amber-600"
            >
              {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-semibold">Create</Text>}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function couponStatus(coupon) {
  const now = new Date();
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return { label: 'Expired', color: '#fee2e2', text: '#b91c1c' };
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { label: 'Exhausted', color: '#f3f4f6', text: '#6b7280' };
  if (!coupon.active) return { label: 'Inactive', color: '#f3f4f6', text: '#6b7280' };
  return { label: 'Active', color: '#dcfce7', text: '#15803d' };
}

export default function CouponsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: coupons, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coupons'],
    queryFn: getCoupons,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['coupons'] });
      setShowModal(false);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => updateCoupon(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
    onError: (err) => Alert.alert('Error', err.message),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="Coupons"
        navigation={navigation}
        rightElement={
          <Pressable
            onPress={() => setShowModal(true)}
            className="w-9 h-9 bg-amber-500 rounded-full items-center justify-center active:bg-amber-600"
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </Pressable>
        }
      />

      <FlatList
        data={coupons ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        renderItem={({ item }) => {
          const status = couponStatus(item);
          const usagePct = item.max_uses ? (item.used_count / item.max_uses) * 100 : 0;

          return (
            <View className="bg-white rounded-2xl shadow-sm mb-3 p-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="bg-gray-100 px-3 py-1 rounded-lg">
                      <Text className="text-base font-bold text-gray-900 font-mono tracking-widest">{item.code}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: status.color }}>
                      <Text className="text-xs font-semibold" style={{ color: status.text }}>{status.label}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <Ionicons name="pricetag" size={12} color="#f59e0b" />
                      <Text className="text-xs text-amber-700 font-semibold ml-1">{item.discount_pct}% off</Text>
                    </View>
                    {item.expires_at && (
                      <Text className="text-xs text-gray-400">Expires {formatDate(item.expires_at)}</Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={item.active}
                  onValueChange={(v) => toggleMutation.mutate({ id: item.id, active: v })}
                  trackColor={{ false: '#e5e7eb', true: '#fcd34d' }}
                  thumbColor={item.active ? '#f59e0b' : '#9ca3af'}
                  style={{ transform: [{ scale: 0.85 }] }}
                />
              </View>

              {item.max_uses > 0 && (
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs text-gray-500 font-medium">Usage</Text>
                    <Text className="text-xs font-semibold text-gray-700">
                      {item.used_count}/{item.max_uses}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, usagePct)}%`,
                        backgroundColor: usagePct >= 100 ? '#ef4444' : usagePct >= 80 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="No coupons yet"
            message="Create discount coupons for your customers"
            action="Create Coupon"
            onAction={() => setShowModal(true)}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f59e0b" colors={['#f59e0b']} />
        }
      />

      <CreateCouponModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(payload) => createMutation.mutate(payload)}
        isSaving={createMutation.isPending}
      />
    </View>
  );
}
