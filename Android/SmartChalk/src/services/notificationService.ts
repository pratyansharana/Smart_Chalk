import * as Notifications from 'expo-notifications';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';
import { Platform } from 'react-native';

// Configure how notifications should behave when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function enablePushNotifications(userId: string): Promise<string | null> {
  try {
    // 1. Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('smartchalk-updates', {
        name: 'Class and assignment updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D66C8',
      });
    }

    // 2. Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for push notifications.');
    }

    // 3. Get the Expo push token (Ensure eas.projectId is configured in app.json)
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;
    console.log('[NotificationService] Expo Push Token obtained:', expoPushToken);

    // 4. Save token to Firestore
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        expoPushTokens: arrayUnion(expoPushToken),
        notificationsEnabled: true,
      });
    } else {
      await setDoc(userRef, {
        expoPushTokens: [expoPushToken],
        notificationsEnabled: true,
      }, { merge: true });
    }

    return expoPushToken;
  } catch (error) {
    console.error('[NotificationService] enablePushNotifications error:', error);
    throw error;
  }
}

export async function disablePushNotifications(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationsEnabled: false,
    });
  } catch (error) {
    console.error('[NotificationService] disablePushNotifications error:', error);
    throw error;
  }
}