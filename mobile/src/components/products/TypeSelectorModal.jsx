import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPES = [
  {
    key: 'saree',
    label: 'Sarees',
    emoji: '🥻',
    icon: 'shirt-outline',
    bgColor: '#fff1f2',
    borderColor: '#be185d',
    iconColor: '#db2777',
  },
  {
    key: 'dress',
    label: 'Dresses',
    emoji: '👗',
    icon: 'flower-outline',
    bgColor: '#f5f3ff',
    borderColor: '#6d28d9',
    iconColor: '#7c3aed',
  },
  {
    key: 'jewellery',
    label: 'Gold',
    emoji: '💎',
    icon: 'diamond-outline',
    bgColor: '#fffbeb',
    borderColor: '#b45309',
    iconColor: '#d97706',
  },
];

function Divider() {
  return (
    <View className="flex-row items-center my-4 px-2">
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
      <Text className="mx-3 text-amber-400 text-xs">✦</Text>
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
    </View>
  );
}

export default function TypeSelectorModal({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ backgroundColor: '#fffaf5' }}>
          {/* Header band */}
          <View style={{ backgroundColor: '#b91c1c', height: 6 }} />

          <View className="p-6">
            {/* Close button */}
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 w-9 h-9 items-center justify-center rounded-full z-10"
              style={{ backgroundColor: '#fef2f2' }}
            >
              <Ionicons name="close" size={18} color="#991b1b" />
            </Pressable>

            {/* Title */}
            <Text className="text-lg font-bold text-center mb-1" style={{ color: '#78350f' }}>
              What would you like to add?
            </Text>
            <Text className="text-xs text-center mb-2" style={{ color: '#a16207' }}>
              Choose a product category to begin
            </Text>

            <Divider />

            {/* Top row: Sarees + Dresses side by side */}
            <View className="flex-row gap-4 mb-4">
              {TYPES.slice(0, 2).map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => onSelect(t.key)}
                  className="flex-1 rounded-2xl items-center justify-center border-2"
                  style={{
                    minHeight: 140,
                    backgroundColor: t.bgColor,
                    borderColor: 'transparent',
                  }}
                >
                  <Text className="text-4xl mb-2">{t.emoji}</Text>
                  <Ionicons name={t.icon} size={26} color={t.iconColor} />
                  <Text className="text-sm font-bold mt-2" style={{ color: '#1f2937' }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Bottom row: Gold centered */}
            <View className="items-center">
              <Pressable
                onPress={() => onSelect(TYPES[2].key)}
                className="rounded-2xl items-center justify-center border-2"
                style={{
                  width: 150,
                  height: 140,
                  backgroundColor: TYPES[2].bgColor,
                  borderColor: 'transparent',
                }}
              >
                <Text className="text-4xl mb-2">{TYPES[2].emoji}</Text>
                <Ionicons name={TYPES[2].icon} size={26} color={TYPES[2].iconColor} />
                <Text className="text-sm font-bold mt-2" style={{ color: '#1f2937' }}>
                  {TYPES[2].label}
                </Text>
              </Pressable>
            </View>

            {/* Bottom decorative line */}
            <Divider />
            <Text className="text-center text-xs" style={{ color: '#92400e' }}>
              Tap a category to start adding your product
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
