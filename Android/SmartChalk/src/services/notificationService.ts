import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

const TOKEN_STORAGE_PREFIX = 'smartchalk:expo-push-token:';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function enablePushNotifications(userId: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('smartchalk-updates', {
      name: 'SmartChalk updates',
      description: 'Assignments, quizzes, class updates, and teacher feedback',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#2D66C8',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('Push notifications need an EAS project ID. Link this app with `npx eas-cli init`, then rebuild.');
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();
  const iosProvisional = permissions.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (!permissions.granted && !iosProvisional) {
    throw new Error('Notification permission was not granted. You can enable it in your device settings.');
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await updateDoc(doc(db, 'users', userId), {
    expoPushTokens: arrayUnion(token),
    notificationsEnabled: true,
  });
  await AsyncStorage.setItem(`${TOKEN_STORAGE_PREFIX}${userId}`, token);
  return token;
}

export async function disablePushNotifications(userId: string) {
  await updateDoc(doc(db, 'users', userId), { notificationsEnabled: false });
}

export async function unregisterPushToken(userId: string) {
  const token = await AsyncStorage.getItem(`${TOKEN_STORAGE_PREFIX}${userId}`);
  if (token) {
    const { arrayRemove } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', userId), { expoPushTokens: arrayRemove(token) });
    await AsyncStorage.removeItem(`${TOKEN_STORAGE_PREFIX}${userId}`);
  }
  await disablePushNotifications(userId);
}