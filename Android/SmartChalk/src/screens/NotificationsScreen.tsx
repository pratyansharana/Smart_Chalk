import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../config/firebaseconfig';
import { getAssignmentDueDate, useStudentDashboard } from '../hooks/useStudentDashboard';

function toDate(value: unknown) {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { classes, assignments, submissions } = useStudentDashboard(auth.currentUser?.uid);
  const updates = [
    ...classes.data.flatMap((batch) => (batch.notes || []).map((note) => ({
      id: `announcement-${batch.id}-${note.id}`,
      title: batch.title || batch.subject || 'Class announcement',
      message: note.text,
      date: toDate(note.createdAt),
      icon: 'bullhorn-outline' as const,
      tint: '#E8F1FF',
      color: '#3168CC',
    }))),
    ...assignments.data.filter((assignment) => !submissions.data.some((item) => item.assignmentId === assignment.id)).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      message: `Due ${getAssignmentDueDate(assignment)?.toLocaleDateString() || 'date pending'}`,
      date: getAssignmentDueDate(assignment),
      icon: 'file-document-outline' as const,
      tint: '#FFF3D1',
      color: '#B77A1A',
    })),
    ...submissions.data.filter((submission) => typeof submission.grade === 'number').map((submission) => ({
      id: `grade-${submission.id}`,
      title: 'Assignment graded',
      message: `Your work was graded ${submission.grade}${submission.maxScore ? ` / ${submission.maxScore}` : ''}${submission.feedback ? ` · ${submission.feedback}` : ''}`,
      date: toDate(submission.submittedAt),
      icon: 'check-decagram-outline' as const,
      tint: '#E4F6EA',
      color: '#287E52',
    })),
  ].sort((left, right) => (right.date?.getTime() || 0) - (left.date?.getTime() || 0));
  const loading = classes.loading || assignments.loading || submissions.loading;

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your updates</Text>
            <Text style={styles.subtitle}>Announcements, deadlines, and feedback</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {loading ? <Text style={styles.emptyText}>Loading your updates...</Text> : updates.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon} size={21} color={item.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
                {item.date ? <Text style={styles.cardTime}>{item.date.toLocaleDateString()}</Text> : null}
              </View>
            </View>
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
