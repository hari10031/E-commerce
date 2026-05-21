import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { registerPushToken } from '../../lib/notifications';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      const data = await login(email, password);
      const u = data.user ?? {};

      // Employees must be approved before they can enter the app.
      if (u.role === 'employee' && u.employee_status !== 'approved') {
        Alert.alert(
          u.employee_status === 'rejected' ? 'Account rejected' : 'Approval pending',
          u.employee_status === 'rejected'
            ? 'Your employee application was rejected. Please contact an admin.'
            : 'Your account is waiting for admin approval. Please try again once it is approved.'
        );
        return;
      }

      setAuth(data.token, data.user, data.refreshToken);
      await registerPushToken();
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6">
          {/* Logo area */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-amber-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl">🍌</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">NanaBanana</Text>
            <Text className="text-sm text-gray-500 mt-1">Admin & Employee Portal</Text>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">Welcome back</Text>
          <Text className="text-gray-500 mb-8">Sign in to your account</Text>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="text-xs text-red-500 mt-1">{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`flex-row items-center border rounded-xl bg-gray-50 ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}>
                  <TextInput
                    className="flex-1 px-4 py-3.5 text-base text-gray-900"
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="px-4"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-xs text-red-500 mt-1">{errors.password.message}</Text>
            )}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-amber-500 rounded-xl py-4 items-center active:bg-amber-600"
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign In</Text>
            )}
          </Pressable>

          {/* Register link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">New employee? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text className="text-amber-600 font-semibold">Register here</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
