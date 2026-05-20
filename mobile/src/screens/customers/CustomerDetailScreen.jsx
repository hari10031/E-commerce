import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { getOrder, updateOrderStatus } from '../../lib/api';
import { formatPrice, formatDateTime, initials, shortId } from '../../lib/utils';
import { ORDER_STATUS_CONFIG, VALID_ORDER_TRANSITIONS } from '../../constants';

const AVATAR_COLORS = ['#ec4899', '#8b5cf6', '#f59e0b', '#14b8a6', '#881337'];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const ACTION_LABELS = {
  placed: { label: 'Confirm Order', icon: 'checkmark-circle-outline' },
  confirmed: { label: 'Start Processing', icon: 'cog-outline' },
  processing: { label: 'Mark as Shipped', icon: 'airplane-outline' },
  shipped: { label: 'Mark as Delivered', icon: 'checkmark-done-outline' },
};

export default function CustomerDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['customers-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Success', 'Order status updated');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-500 mt-3">Loading order…</Text>
      </View>
    );
  }

  if (!order) return null;

  const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.placed;
  const transitions = VALID_ORDER_TRANSITIONS[order.status] ?? [];
  const nextStatus = transitions.find((s) => s !== 'cancelled');
  const actionCfg = ACTION_LABELS[order.status];
  const customerName = order.user?.name ?? order.address?.name ?? 'Customer';
  const customerEmail = order.user?.email ?? '';
  const customerPhone = order.user?.phone ?? order.address?.phone ?? '';

  const handleStatusUpdate = () => {
    if (!nextStatus) return;
    Alert.alert(
      'Update Status',
      `${actionCfg?.label ?? 'Update'} this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => statusMutation.mutate({ id: orderId, status: nextStatus }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={`Order #${shortId(order.id)}`}
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer info */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-circle-outline" size={20} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-2">
              Customer Information
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: avatarColor(customerName) }}
            >
              <Text className="text-white font-bold text-lg">
                {initials(customerName).charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">{customerName}</Text>
              {customerEmail ? (
                <Text className="text-sm text-gray-500 mt-0.5">{customerEmail}</Text>
              ) : null}
            </View>
          </View>

          {customerPhone ? (
            <View className="flex-row items-center py-2 border-t border-gray-100">
              <Ionicons name="call-outline" size={16} color="#6b7280" />
              <Text className="text-sm text-gray-700 ml-2">{customerPhone}</Text>
            </View>
          ) : null}

          {order.address && (
            <View className="flex-row items-start py-2 border-t border-gray-100">
              <Ionicons name="location-outline" size={16} color="#6b7280" style={{ marginTop: 2 }} />
              <View className="ml-2 flex-1">
                <Text className="text-sm text-gray-700">{order.address.line1}</Text>
                {order.address.line2 ? (
                  <Text className="text-sm text-gray-600">{order.address.line2}</Text>
                ) : null}
                <Text className="text-sm text-gray-600">
                  {[order.address.city, order.address.state, order.address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Products ordered */}
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <View className="flex-row items-center px-4 pt-4 pb-3">
            <Ionicons name="bag-outline" size={20} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-2">
              Products Ordered
            </Text>
            <View className="ml-auto bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-gray-600">
                {order.order_items?.length ?? 0}
              </Text>
            </View>
          </View>

          {(order.order_items ?? []).map((item) => {
            const title = item.product?.title ?? 'Product';
            return (
              <View
                key={item.id}
                className="flex-row items-center px-4 py-3 border-t border-gray-50"
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: avatarColor(title) + '22' }}
                >
                  <Text
                    className="font-bold text-sm"
                    style={{ color: avatarColor(title) }}
                  >
                    {initials(title).charAt(0)}
                  </Text>
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                    {title}
                  </Text>
                  {item.variant && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  <Text className="text-xs text-gray-400 mt-0.5">
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-gray-900">
                  {formatPrice(item.unit_price * item.quantity)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Payment */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="card-outline" size={20} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-2">
              Payment Details
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-gray-600">Total Amount</Text>
            <Text className="text-base font-bold text-gray-900">
              {formatPrice(order.total_amount)}
            </Text>
          </View>

          {order.payment_method && (
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-600">Payment Method</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">
                {order.payment_method}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between py-2 border-t border-gray-100">
            <Text className="text-sm text-gray-600">Order Date</Text>
            <Text className="text-sm font-medium text-gray-800">
              {formatDateTime(order.created_at)}
            </Text>
          </View>

          {order.coupon_applied && (
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-600">Coupon</Text>
              <Text className="text-sm font-medium text-amber-700">
                {order.coupon_applied}
                {order.discount_amount > 0 ? ` (−${formatPrice(order.discount_amount)})` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Status */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="flag-outline" size={20} color="#f59e0b" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-2">
              Current Status
            </Text>
          </View>
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: cfg.dot }}
            />
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: cfg.bg }}
            >
              <Text className="text-sm font-bold" style={{ color: cfg.text }}>
                {cfg.label}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action button */}
      {nextStatus && actionCfg && (
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3"
        >
          <Pressable
            onPress={handleStatusUpdate}
            disabled={statusMutation.isPending}
            className="bg-amber-500 rounded-xl py-4 flex-row items-center justify-center active:bg-amber-600"
          >
            {statusMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={actionCfg.icon} size={18} color="#fff" />
                <Text className="text-white font-bold text-sm ml-2">
                  {actionCfg.label}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
