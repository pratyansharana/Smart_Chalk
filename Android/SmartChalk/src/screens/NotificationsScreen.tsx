import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';
import { getAssignmentDueDate, useStudentDashboard } from '../hooks/useStudentDashboard';
import type { MainTabScreenProps } from '../navigation/types';

interface CloudNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  sourceId?: string;
  batchId?: string;
  readAt?: unknown;
  createdAt?: unknown;
}

function toDate(value: unknown) {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function NotificationsScreen({ navigation }: MainTabScreenProps<'NotificationsTab'>) {
  const insets = useSafeAreaInsets();
  const userId = auth.currentUser?.uid;
  const { classes, assignments, submissions } = useStudentDashboard(userId);
  const [cloudNotifications, setCloudNotifications] = useState<CloudNotification[]>([]);
  const [cloudLoading, setCloudLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) return undefined;
    return onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', userId)),
      (snapshot) => {
        setCloudNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CloudNotification));
        setCloudLoading(false);
      },
      (error) => {
        console.error('Notification listener failed:', error);
        setCloudLoading(false);
      },
    );
  }, [userId]);

  const serverReferences = useMemo(() => new Set(cloudNotifications.map((item) => item.sourceId).filter(Boolean)), [cloudNotifications]);
  const localUpdates = [
    ...classes.data.flatMap((batch) => (batch.notes || []).map((note) => ({
      id: `announcement-${batch.id}-${note.id}`,
      sourceId: `announcement/${note.id}`,
      batchId: batch.id,
      type: 'announcement',
      title: batch.title || batch.subject || 'Class announcement',
      message: note.text,
      date: toDate(note.createdAt),
      icon: 'bullhorn-outline' as const,
      tint: '#EFF6FF',
      color: '#2563EB',
    }))),
    ...assignments.data.filter((assignment) => !submissions.data.some((item) => item.assignmentId === assignment.id)).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      sourceId: `assignment/${assignment.id}`,
      batchId: assignment.classId,
      type: 'assignment',
      title: assignment.title,
      message: `Due ${getAssignmentDueDate(assignment)?.toLocaleDateString() || 'date pending'}`,
      date: getAssignmentDueDate(assignment),
      icon: 'file-document-outline' as const,
      tint: '#FEF3C7',
      color: '#D97706',
    })),
    ...submissions.data.filter((submission) => typeof submission.grade === 'number').map((submission) => ({
      id: `grade-${submission.id}`,
      sourceId: `submission/${submission.id}`,
      batchId: undefined as string | undefined,
      type: 'grade',
      title: 'Assignment graded',
      message: `Your work was graded ${submission.grade}${submission.maxScore ? ` / ${submission.maxScore}` : ''}${submission.feedback ? ` · ${submission.feedback}` : ''}`,
      date: toDate(submission.submittedAt),
      icon: 'check-decagram-outline' as const,
      tint: '#F0FDF4',
      color: '#16A34A',
    })),
  ];
  const updates = [
    ...cloudNotifications.map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      batchId: item.batchId,
      type: item.type,
      title: item.title,
      message: item.body,
      date: toDate(item.createdAt),
      read: Boolean(item.readAt),
    })),
    ...localUpdates.filter((item) => !serverReferences.has(item.sourceId)).map((item) => ({ ...item, read: true })),
  ].sort((left, right) => (right.date?.getTime() || 0) - (left.date?.getTime() || 0));
  const loading = cloudLoading || classes.loading || assignments.loading || submissions.loading;

  async function openUpdate(item: typeof updates[number]) {
    if (!item.read && cloudNotifications.some((notice) => notice.id === item.id)) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { readAt: serverTimestamp() });
      } catch (error) {
        console.error('Could not mark notification as read:', error);
      }
    }
    if (item.batchId) {
      const initialTab = item.type === 'announcement' ? 'announcements'
        : item.type === 'assignment' ? 'assignments'
          : item.type === 'test' ? 'tests'
            : item.type === 'quiz' ? 'quizzes'
              : item.type === 'vault' ? 'vault' : 'announcements';
      navigation.navigate('BatchDetails', { batchId: item.batchId, initialTab });
    } else if (item.type === 'grade') {
      navigation.navigate('ExploreTab');
    }
  }

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.header}>
          <View style={styles.eyebrowBadge}>
            <MaterialCommunityIcons name="bell-ring-outline" size={12} color="#2563EB" />
            <Text style={styles.eyebrowText}>STUDENT FEED</Text>
          </View>
          <Text style={styles.title}>Your Updates</Text>
          <Text style={styles.subtitle}>Announcements, deadlines, and feedback</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.placeholderCard}>
              <MaterialCommunityIcons name="loading" size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
              <Text style={styles.placeholderText}>Loading your updates...</Text>
            </View>
          ) : updates.map((item) => {
            const isGrade = item.type === 'grade';
            const isAssignment = item.type === 'assignment' || item.type === 'test';
            const iconBg = isGrade ? '#F0FDF4' : isAssignment ? '#FEF3C7' : '#EFF6FF';
            const iconColor = isGrade ? '#16A34A' : isAssignment ? '#D97706' : '#2563EB';
            const iconName = isGrade
              ? 'check-decagram-outline'
              : item.type === 'assignment'
              ? 'file-document-outline'
              : item.type === 'test'
              ? 'clipboard-text-outline'
              : item.type === 'quiz'
              ? 'trophy-outline'
              : item.type === 'vault'
              ? 'folder-outline'
              : 'bullhorn-outline';

            return (
              <Pressable
                key={item.id}
                onPress={() => openUpdate(item)}
                style={[styles.card, !item.read && styles.cardUnread]}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                  {item.date ? (
                    <Text style={styles.cardTime}>{item.date.toLocaleDateString()}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {!loading && updates.length === 0 ? (
            <View style={styles.placeholderCard}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={28} color="#16A34A" style={{ marginBottom: 6 }} />
              <Text style={styles.placeholderText}>You&apos;re all caught up! New class announcements and feedback will appear here.</Text>
            </View>
          ) : null}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  cardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  cardMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});