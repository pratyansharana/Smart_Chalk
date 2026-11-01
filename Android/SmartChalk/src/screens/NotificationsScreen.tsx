import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StateScreen } from '../components/StateScreen';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'security' | 'system' | 'update';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New Device Login Detected',
    message: 'A login to your Firebase account was made from Windows (Chrome/Expo Go).',
    time: '5m ago',
    unread: true,
    type: 'security',
  },
  {
    id: '2',
    title: 'Session Token Refreshed',
    message: 'Your OAuth session token was seamlessly rotated via AsyncStorage persistence.',
    time: '1h ago',
    unread: true,
    type: 'system',
  },
  {
    id: '3',
    title: 'Template Dependencies Verified',
    message: 'React 19 & Expo SDK 54 packages are synchronized with strict TypeScript definitions.',
    time: '2d ago',
    unread: false,
    type: 'update',
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Security alerts & system activity</Text>
          </View>
          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Mark read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {notifications.length === 0 ? (
          <StateScreen
            variant="empty"
            title="All Caught Up!"
            description="You have no unread notifications or pending security alerts."
            buttonText="Reload Notifications"
            onAction={() => setNotifications(INITIAL_NOTIFICATIONS)}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {notifications.map((item) => (
              <View key={item.id} style={[styles.card, item.unread && styles.cardUnread]}>
                <View style={[
                  styles.iconCircle,
                  item.type === 'security' ? styles.iconSecurity : styles.iconSystem
                ]}>
                  <Ionicons
                    name={item.type === 'security' ? 'shield-checkmark-outline' : 'information-circle-outline'}
                    size={22}
                    color={item.type === 'security' ? '#EF4444' : '#4F46E5'}
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage}>{item.message}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  container: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAF5FF',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconSecurity: {
    backgroundColor: '#FEE2E2',
  },
  iconSystem: {
    backgroundColor: '#EEF2FF',
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  cardMessage: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
