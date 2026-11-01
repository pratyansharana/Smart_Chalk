import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../navigation/types';

interface SettingOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'switch' | 'link';
  value?: boolean;
}

export default function SettingsScreen({ navigation }: MainTabScreenProps<'SettingsTab'>) {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>System Settings</Text>
            <Text style={styles.subtitle}>Configure preferences & application behavior</Text>
          </View>

          {/* Section: App Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={22} color="#4F46E5" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSubtitle}>Receive critical alerts and updates</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={pushEnabled ? '#4F46E5' : '#F3F4F6'}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name="moon-outline" size={22} color="#4F46E5" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Dark Mode</Text>
                <Text style={styles.rowSubtitle}>Adaptive high-contrast slate theme</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={darkMode ? '#4F46E5' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Section: Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security & Privacy</Text>

            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name="finger-print-outline" size={22} color="#4F46E5" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Biometric Lock</Text>
                <Text style={styles.rowSubtitle}>Require FaceID or Fingerprint on launch</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={biometricsEnabled ? '#4F46E5' : '#F3F4F6'}
              />
            </View>

            <TouchableOpacity style={styles.row} onPress={() => alert('Opening Session Log')}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={22} color="#4F46E5" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Active Sessions</Text>
                <Text style={styles.rowSubtitle}>Manage connected devices and tokens</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Section: Storage & Cache */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage & Telemetry</Text>

            <TouchableOpacity style={styles.row} onPress={() => alert('Local cache cleared!')}>
              <View style={styles.iconCircle}>
                <Ionicons name="trash-bin-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Clear Offline Cache</Text>
                <Text style={styles.rowSubtitle}>Purge cached queries and temporary storage</Text>
              </View>
              <Text style={styles.cacheSizeText}>14.2 MB</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  cacheSizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
