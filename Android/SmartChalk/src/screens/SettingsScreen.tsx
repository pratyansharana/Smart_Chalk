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
      if (active) {
        setPushEnabled(snapshot.data()?.notificationsEnabled === true);
      }
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
    console.log('[SettingsScreen] toggleNotifications start', { enabled, userId });
    setSavingNotifications(true);
    try {
      if (enabled) {
        console.log('[SettingsScreen] enabling push notifications');
        await enablePushNotifications(userId);
      } else {
        console.log('[SettingsScreen] disabling push notifications');
        await disablePushNotifications(userId);
      }
      setPushEnabled(enabled);
      console.log('[SettingsScreen] toggleNotifications completed', { enabled, pushEnabled: enabled });
    } catch (error) {
      console.log('[SettingsScreen] toggleNotifications failed', { enabled, error });
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
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Back Button */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#64748B" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.eyebrowBadge}>
              <MaterialCommunityIcons name="tune" size={12} color="#2563EB" />
              <Text style={styles.eyebrowText}>PREFERENCES & SECURITY</Text>
            </View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your learning environment and account security.</Text>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Class & Assignment Updates</Text>
                  <Text style={styles.rowSubtitle}>New assignments, tests, quizzes, announcements, and grades.</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={toggleNotifications}
                  disabled={savingNotifications}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={pushEnabled ? '#2563EB' : '#FFFFFF'}
                />
              </View>

              {!pushEnabled ? (
                <View style={styles.noticeBox}>
                  <MaterialCommunityIcons name="information-outline" size={15} color="#D97706" style={{ marginTop: 1 }} />
                  <Text style={styles.noticeText}>Push requires a linked EAS project and notification credentials. In-app updates remain fully available.</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Security & Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security & Profile</Text>

            <View style={styles.card}>
              <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 14, marginBottom: 14 }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialCommunityIcons name="fingerprint" size={21} color="#16A34A" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Biometric App Lock</Text>
                  <Text style={styles.rowSubtitle}>Verify with your device before opening SmartChalk.</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={toggleBiometrics}
                  disabled={checkingBiometrics}
                  trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                  thumbColor={biometricsEnabled ? '#16A34A' : '#FFFFFF'}
                />
              </View>

              <Pressable style={[styles.row, { marginBottom: 0 }]} onPress={() => navigation.navigate('ProfileTab')}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialCommunityIcons name="account-edit-outline" size={20} color="#9333EA" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Student Profile</Text>
                  <Text style={styles.rowSubtitle}>Update grade, subjects, contact details, and photo.</Text>
                </View>
                <View style={styles.chevronBox}>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* App Version Footer */}
          <View style={styles.aboutRow}>
            <MaterialCommunityIcons name="school-outline" size={16} color="#64748B" />
            <Text style={styles.aboutText}>SmartChalk Workspace  ·  v{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  eyebrowText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 15,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEFCE8',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    color: '#854D0E',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  aboutText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});