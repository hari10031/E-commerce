import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from '../store/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function AppNavigator() {
  const { token, user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffbeb' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!token) {
    return <AuthStack initialRouteName="Login" />;
  }

  if (user?.employee_status === 'pending') {
    return <AuthStack initialRouteName="Pending" />;
  }

  return <MainTabs />;
}
