import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ icon = 'search', title, message, action, onAction }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 bg-amber-50 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={36} color="#f59e0b" />
      </View>
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</Text>
      {message && (
        <Text className="text-sm text-gray-500 text-center leading-5 mb-6">{message}</Text>
      )}
      {action && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-amber-500 px-6 py-3 rounded-xl active:bg-amber-600"
        >
          <Text className="text-white font-semibold text-sm">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
