import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { updatePushToken } from './api';
import { queryClient } from './queryClient';
import { navigationRef } from '../navigation/navigationRef';

let handlerConfigured = false;
let listenersConfigured = false;

function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

// Foreground: refresh in-app inbox + bell badge.
// Tap: open Notifications screen (or OrderDetail when push carries an orderId).
export async function setupNotificationListeners() {
  if (listenersConfigured || isExpoGo() || !Device.isDevice) return;
  listenersConfigured = true;

  const Notifications = await import('expo-notifications');

  Notifications.addNotificationReceivedListener(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });

  const openNotificationsScreen = () => {
    if (!navigationRef.isReady()) return;
    // DashboardTab/Notifications exists for every role's tab layout.
    navigationRef.navigate('DashboardTab', { screen: 'Notifications' });
  };

  Notifications.addNotificationResponseReceivedListener(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    openNotificationsScreen();
  });

  // Cold-start from a tapped notification.
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    setTimeout(openNotificationsScreen, 600);
  }
}

export async function registerPushToken() {
  if (isExpoGo() || !Device.isDevice) return;

  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await updatePushToken(token);
  } catch {
    // Non-critical: push token registration failure shouldn't block app
  }
}
