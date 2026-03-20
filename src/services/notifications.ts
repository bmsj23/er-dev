import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import type { NotificationResult, TravelEntry } from '../types/travel';

let notificationsInitialized = false;

function hasNotificationAccess(
  status: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function initializeNotificationsAsync(): Promise<void> {
  if (!notificationsInitialized) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    notificationsInitialized = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('travel-diary-saves', {
      name: 'Travel Diary Saves',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 70, 130],
      lightColor: '#E883A7',
    });
  }
}

export async function sendEntrySavedNotificationAsync(
  entry: TravelEntry,
): Promise<NotificationResult> {
  try {
    await initializeNotificationsAsync();

    let permissionStatus = await Notifications.getPermissionsAsync();
    if (!hasNotificationAccess(permissionStatus)) {
      permissionStatus = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }

    if (!hasNotificationAccess(permissionStatus)) {
      return 'permission-denied';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Travel stamp saved',
        body: entry.address,
        sound: true,
        color: '#E883A7',
        data: {
          entryId: entry.id,
        },
      },
      trigger: null,
    });

    return 'scheduled';
  } catch {
    return 'error';
  }
}
