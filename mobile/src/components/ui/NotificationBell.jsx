import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications } from '../../lib/api';

// Top-right bell with unread badge. `light` renders white icon for gradient headers.
export default function NotificationBell({ onPress, light = false }) {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const notifications = Array.isArray(data) ? data : data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        light ? 'bg-white/20 active:bg-white/30' : 'bg-gray-100 active:bg-gray-200'
      }`}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={20}
        color={light ? '#ffffff' : '#374151'}
      />
      {unreadCount > 0 && (
        <View
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1"
          style={{ borderWidth: 1.5, borderColor: light ? '#f59e0b' : '#ffffff' }}
        >
          <Text className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
