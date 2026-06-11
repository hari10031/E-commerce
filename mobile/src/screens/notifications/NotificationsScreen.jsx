import React, { useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from '../../lib/api';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function NotificationRow({ item, onPress }) {
  const unread = !item.read;
  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`flex-row px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 ${
        unread ? 'bg-amber-50/60' : 'bg-white'
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          unread ? 'bg-amber-100' : 'bg-gray-100'
        }`}
      >
        <Ionicons
          name={item.title?.toLowerCase().includes('order') ? 'cart' : 'notifications'}
          size={18}
          color={unread ? '#d97706' : '#9ca3af'}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm flex-1 mr-2 ${
              unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-[10px] text-gray-400">{timeAgo(item.created_at)}</Text>
        </View>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {unread && <View className="w-2 h-2 rounded-full bg-amber-500 ml-2 mt-1.5" />}
    </Pressable>
  );
}

export default function NotificationsScreen({ navigation }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    staleTime: 15_000,
  });

  useRefetchOnFocus(['notifications']);

  const notifications = Array.isArray(data) ? data : data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (ids) => markNotificationsRead(ids),
    onSettled: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: invalidate,
  });

  const handlePress = useCallback(
    (item) => {
      if (!item.read) markRead.mutate([item.id]);
    },
    [markRead]
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        navigation={navigation}
        rightElement={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="px-3 py-1.5 rounded-full bg-amber-50 active:bg-amber-100"
            >
              <Text className="text-xs font-semibold text-amber-700">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <NotificationRow item={item} onPress={handlePress} />}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor="#f59e0b"
              colors={['#f59e0b']}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-24">
              <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-4">
                <Ionicons name="notifications-off-outline" size={28} color="#d1d5db" />
              </View>
              <Text className="text-base font-semibold text-gray-700">No notifications yet</Text>
              <Text className="text-sm text-gray-400 mt-1 px-10 text-center">
                You'll see new order alerts and updates here.
              </Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </View>
  );
}
