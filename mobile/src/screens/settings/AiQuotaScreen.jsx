import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { getAiQuota, listAiQuotaRequests, createAiQuotaRequest } from '../../lib/api';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { formatDateTime } from '../../lib/utils';

function isLowQuota(bucket) {
  return bucket.remaining <= Math.max(20, Math.ceil(bucket.limit * 0.1));
}

function usagePercent(bucket) {
  if (bucket.limit <= 0) return 0;
  return Math.min(100, Math.round((bucket.used / bucket.limit) * 100));
}

function StatCard({ label, used, limit, remaining, percent, accent = '#f59e0b' }) {
  return (
    <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <Text className="text-sm font-medium text-gray-500">{label}</Text>
      <Text className="text-2xl font-bold text-gray-900 mt-1">
        {used} / {limit}
      </Text>
      <Text className="text-sm text-gray-500 mt-1">{remaining} remaining</Text>
      <View className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <View style={{ width: `${percent}%`, backgroundColor: accent }} className="h-full rounded-full" />
      </View>
    </View>
  );
}

export default function AiQuotaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('extend');
  const [usageType, setUsageType] = useState('image');
  const [requestedImageLimit, setRequestedImageLimit] = useState('');
  const [requestedContentLimit, setRequestedContentLimit] = useState('');
  const [reason, setReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [quota, history] = await Promise.all([getAiQuota(), listAiQuotaRequests()]);
      setStats(quota);
      setRequests(history);
      if (requestType === 'extend') {
        setRequestedImageLimit(String(quota.images.limit + 100));
        setRequestedContentLimit(String(quota.content.limit + 200));
      } else {
        setRequestedImageLimit(String(Math.max(quota.images.used, quota.images.limit - 50)));
        setRequestedContentLimit(String(Math.max(quota.content.used, quota.content.limit - 100)));
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load AI quota');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (user?.role !== 'admin') {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="sparkles" size={40} color="#d1d5db" />
        <Text className="text-gray-500 mt-3 text-center">Access restricted to admins only.</Text>
      </View>
    );
  }

  const hasPending = requests.some((r) => r.status === 'pending');
  const lowImage = stats ? isLowQuota(stats.images) : false;
  const lowContent = stats ? isLowQuota(stats.content) : false;

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      Alert.alert('Reason required', 'Please enter at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await createAiQuotaRequest({
        requestType,
        usageType,
        requestedImageLimit:
          usageType === 'image' || usageType === 'both'
            ? parseInt(requestedImageLimit, 10)
            : undefined,
        requestedContentLimit:
          usageType === 'content' || usageType === 'both'
            ? parseInt(requestedContentLimit, 10)
            : undefined,
        reason: reason.trim(),
      });
      Alert.alert('Submitted', 'Your request was sent to the platform admin.');
      setReason('');
      await loadData();
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !stats) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
      }
    >
      <ScreenHeader title="AI Quota" onBack={() => navigation.goBack()} />

      <View className="px-4 pt-2">
        <Text className="text-sm text-gray-500 mb-4">
          Platform Gemini usage for your store. Request more or lower limits from the platform admin.
        </Text>

        {(lowImage || lowContent) && (
          <View className="flex-row gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
            <Ionicons name="warning" size={20} color="#b45309" />
            <Text className="flex-1 text-sm text-amber-900">
              Running low on AI quota. Submit an extension request before your team hits the limit.
            </Text>
          </View>
        )}

        <Text className="text-xs text-gray-400 mb-4">
          Each AI attempt counts even if generation fails after the request starts.
        </Text>

        {stats && (
          <>
            <StatCard
              label="AI images"
              used={stats.images.used}
              limit={stats.images.limit}
              remaining={stats.images.remaining}
              percent={usagePercent(stats.images)}
            />
            <StatCard
              label="AI content"
              used={stats.content.used}
              limit={stats.content.limit}
              remaining={stats.content.remaining}
              percent={usagePercent(stats.content)}
              accent="#8b5cf6"
            />
          </>
        )}

        <View className="bg-white rounded-2xl shadow-sm p-4 mt-2 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Request limit change</Text>
          {hasPending && (
            <Text className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2 mb-3">
              You have a pending request. Wait for review before submitting another.
            </Text>
          )}

          <Text className="text-sm font-medium text-gray-700 mb-2">Request type</Text>
          <View className="flex-row gap-2 mb-4">
            {['extend', 'decrease'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setRequestType(type)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${
                  requestType === type ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Text className={`text-sm font-semibold capitalize ${requestType === type ? 'text-amber-800' : 'text-gray-600'}`}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">Applies to</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {[
              { key: 'image', label: 'Images' },
              { key: 'content', label: 'Content' },
              { key: 'both', label: 'Both' },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setUsageType(key)}
                className={`px-4 py-2 rounded-full border ${
                  usageType === key ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Text className={`text-sm font-medium ${usageType === key ? 'text-amber-800' : 'text-gray-600'}`}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {(usageType === 'image' || usageType === 'both') && stats && (
            <>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Proposed image limit (current: {stats.images.limit})
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
                keyboardType="number-pad"
                value={requestedImageLimit}
                onChangeText={setRequestedImageLimit}
              />
            </>
          )}

          {(usageType === 'content' || usageType === 'both') && stats && (
            <>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Proposed content limit (current: {stats.content.limit})
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
                keyboardType="number-pad"
                value={requestedContentLimit}
                onChangeText={setRequestedContentLimit}
              />
            </>
          )}

          <Text className="text-sm font-medium text-gray-700 mb-1.5">Reason</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4 min-h-[88px]"
            multiline
            textAlignVertical="top"
            placeholder="Why do you need this change?"
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || hasPending}
            className={`rounded-xl py-3.5 items-center ${submitting || hasPending ? 'bg-amber-300' : 'bg-amber-500'}`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Submit request</Text>
            )}
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl shadow-sm p-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Your requests</Text>
          {requests.length === 0 ? (
            <Text className="text-sm text-gray-500">No requests yet.</Text>
          ) : (
            requests.map((req) => (
              <View key={req.id} className="border-b border-gray-100 py-3 last:border-0">
                <View className="flex-row flex-wrap items-center gap-2 mb-1">
                  <View className="bg-gray-100 px-2.5 py-0.5 rounded-full">
                    <Text className="text-xs font-semibold text-gray-700 capitalize">{req.status}</Text>
                  </View>
                  <Text className="text-xs text-gray-500 capitalize">
                    {req.requestType} · {req.usageType}
                  </Text>
                  <Text className="text-xs text-gray-400">{formatDateTime(req.createdAt)}</Text>
                </View>
                <Text className="text-sm text-gray-800">{req.reason}</Text>
                {req.reviewNote ? (
                  <Text className="text-sm text-gray-500 mt-1">Platform reply: {req.reviewNote}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
