import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { updateMe } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { initials } from '../../lib/utils';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, setAuth, clearAuth, token } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [editing, setEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => updateMe({ name, phone: phone || undefined }),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAuth(token, { ...user, ...data });
      setEditing(false);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="Profile"
        navigation={navigation}
        rightElement={
          <Pressable
            onPress={() => setEditing(!editing)}
            className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Ionicons name={editing ? 'close' : 'pencil'} size={18} color="#6b7280" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {/* Avatar */}
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-amber-500 rounded-full items-center justify-center mb-3">
            <Text className="text-white font-bold text-3xl">{initials(user?.name)}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{user?.email}</Text>
          <View className="mt-2 bg-amber-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-amber-800 capitalize">{user?.role}</Text>
          </View>
        </View>

        {/* Form */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Account Details</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Full Name</Text>
            <TextInput
              className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 ${editing ? 'bg-white border-amber-300' : 'bg-gray-50 border-gray-200'}`}
              value={name}
              onChangeText={setName}
              editable={editing}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-400 bg-gray-50"
              value={user?.email}
              editable={false}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone</Text>
            <TextInput
              className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 ${editing ? 'bg-white border-amber-300' : 'bg-gray-50 border-gray-200'}`}
              value={phone}
              onChangeText={setPhone}
              editable={editing}
              keyboardType="phone-pad"
              placeholder="Add phone number"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {editing && (
            <Pressable
              onPress={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="bg-amber-500 rounded-xl py-3.5 items-center mt-5 active:bg-amber-600"
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Save Changes</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* App info */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">App Info</Text>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-gray-600">Version</Text>
            <Text className="text-sm font-medium text-gray-800">1.0.0</Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-gray-600">Platform</Text>
            <Text className="text-sm font-medium text-gray-800">NanaBanana Mobile</Text>
          </View>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center flex-row justify-center gap-2 active:bg-red-100"
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
