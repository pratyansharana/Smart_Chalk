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
      tint: '#E8F1FF',
      color: '#3168CC',
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
      tint: '#FFF3D1',
      color: '#B77A1A',
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
      tint: '#E4F6EA',
      color: '#287E52',
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
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <View>
              <Text style={styles.eyebrow}>STUDENT FEED</Text>
              <Text style={styles.title}>Your updates</Text>
              <Text style={styles.subtitle}>Announcements, deadlines, and feedback</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {loading ? <Text style={styles.emptyText}>Loading your updates...</Text> : updates.map((item) => (
            <Pressable key={item.id} onPress={() => openUpdate(item)} style={[styles.card, !item.read && styles.cardUnread]}>
              <View style={[styles.iconCircle, { backgroundColor: item.type === 'grade' ? '#E4F6EA' : item.type === 'assignment' || item.type === 'test' ? '#FFF3D1' : '#E8F1FF' }]}>
                <MaterialCommunityIcons
                  name={item.type === 'grade' ? 'check-decagram-outline' : item.type === 'assignment' ? 'file-document-outline' : item.type === 'test' ? 'clipboard-text-outline' : item.type === 'quiz' ? 'trophy-outline' : item.type === 'vault' ? 'folder-outline' : 'bullhorn-outline'}
                  size={21}
                  color={item.type === 'grade' ? '#287E52' : item.type === 'assignment' || item.type === 'test' ? '#B77A1A' : '#3168CC'}
                />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                {item.date ? <Text style={styles.cardTime}>{item.date.toLocaleDateString()}</Text> : null}
              </View>
            </Pressable>
          ))}
          {!loading && updates.length === 0 ? <Text style={styles.emptyText}>You&apos;re all caught up. New class announcements and feedback will appear here.</Text> : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#25394D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8291A0',
  },
  eyebrow: {
    color: '#3971C9',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EDF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderColor: '#BFD6EF',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26394D',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D66C8',
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
  emptyText: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    color: '#8291A0',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
