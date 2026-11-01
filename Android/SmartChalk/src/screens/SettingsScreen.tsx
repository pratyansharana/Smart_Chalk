import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';
import { disablePushNotifications, enablePushNotifications } from '../services/notificationService';
import type { MainTabScreenProps } from '../navigation/types';

const BIOMETRIC_KEY = 'smartchalk:biometric-lock:';

export default function SettingsScreen({ navigation }: MainTabScreenProps<'SettingsTab'>) {
  const insets = useSafeAreaInsets();
  const userId = auth.currentUser?.uid;
  const [pushEnabled, setPushEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      setPushEnabled(snapshot.data()?.notificationsEnabled === true);
    });
    void AsyncStorage.getItem(`${BIOMETRIC_KEY}${userId}`).then((value) => {
      if (active) setBiometricsEnabled(value === 'true');
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  async function toggleNotifications(enabled: boolean) {
    if (!userId) return;
    setSavingNotifications(true);
    try {
      if (enabled) await enablePushNotifications(userId);
      else await disablePushNotifications(userId);
      setPushEnabled(enabled);
    } catch (error) {
      Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  }

  async function toggleBiometrics(enabled: boolean) {
    if (!userId) return;
    if (!enabled) {
      await AsyncStorage.removeItem(`${BIOMETRIC_KEY}${userId}`);
      setBiometricsEnabled(false);
      return;
    }

    setCheckingBiometrics(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        Alert.alert('Biometrics unavailable', 'Set up Face ID or a fingerprint in your device settings first.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable SmartChalk app lock' });
      if (result.success) {
        await AsyncStorage.setItem(`${BIOMETRIC_KEY}${userId}`, 'true');
        setBiometricsEnabled(true);
      }
    } catch (error) {
      Alert.alert('Could not enable app lock', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setCheckingBiometrics(false);
    }
  }

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>SMARTCHALK</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your learning and account preferences.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={21} color="#2D66C8" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Class and assignment updates</Text>
                <Text style={styles.rowSubtitle}>New assignments, tests, quizzes, announcements, and grades.</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={toggleNotifications}
                disabled={savingNotifications}
                trackColor={{ false: '#DDE8F0', true: '#A8C6ED' }}
                thumbColor={pushEnabled ? '#2D66C8' : '#FFFFFF'}
              />
            </View>

            {!pushEnabled ? <Text style={styles.notice}>Push requires a linked EAS project and notification credentials. In-app updates remain available.</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="fingerprint" size={22} color="#2D66C8" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Biometric app lock</Text>
                <Text style={styles.rowSubtitle}>Verify with your device before opening SmartChalk.</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                disabled={checkingBiometrics}
                trackColor={{ false: '#DDE8F0', true: '#A8C6ED' }}
                thumbColor={biometricsEnabled ? '#2D66C8' : '#FFFFFF'}
              />
            </View>

            <Pressable style={styles.row} onPress={() => navigation.navigate('ProfileTab')}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-edit-outline" size={21} color="#2D66C8" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Student profile</Text>
                <Text style={styles.rowSubtitle}>Update grade, subjects, contact details, and photo.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#91A0AE" />
            </Pressable>
          </View>

          <View style={styles.aboutRow}>
            <MaterialCommunityIcons name="school-outline" size={19} color="#2D66C8" />
            <Text style={styles.aboutText}>SmartChalk  ·  {Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#EDF8FD',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#3971C9',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#25394D',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8291A0',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60758A',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EDF3',
    marginBottom: 9,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26394D',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  notice: {
    color: '#8B6B2A',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 14,
  },
  aboutText: {
    color: '#8291A0',
    fontSize: 11,
  },
});
