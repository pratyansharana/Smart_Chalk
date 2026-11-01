import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../config/firebaseconfig';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import type { MainTabScreenProps } from '../navigation/types';

export default function ExploreScreen({ navigation }: MainTabScreenProps<'ExploreTab'>) {
  const insets = useSafeAreaInsets();
  const studentId = auth.currentUser?.uid;
  const { classes, pendingClasses } = useStudentDashboard(studentId);
  const [batchId, setBatchId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const activeClasses = classes.data.filter((item) => item.status !== 'discontinued');

  async function handleJoinRequest() {
    const trimmedId = batchId.trim();
    if (!trimmedId || !studentId) return;
    setRequesting(true);
    setRequestStatus(null);
    try {
      const batchRef = doc(db, 'classes', trimmedId);
      const snapshot = await getDoc(batchRef);
      if (!snapshot.exists()) {
        setRequestStatus({ type: 'error', message: 'Batch ID not found.' });
        return;
      }
      const data = snapshot.data();
      if (data.studentIds?.includes(studentId)) {
        setRequestStatus({ type: 'error', message: 'You are already enrolled in this batch.' });
      } else if (data.pendingStudentIds?.includes(studentId)) {
        setRequestStatus({ type: 'success', message: 'Your request is already waiting for teacher approval.' });
      } else {
        await updateDoc(batchRef, { pendingStudentIds: arrayUnion(studentId) });
        setRequestStatus({ type: 'success', message: 'Request sent. You can open the batch after your teacher approves it.' });
        setBatchId('');
      }
    } catch (error) {
      setRequestStatus({ type: 'error', message: error instanceof Error ? error.message : 'Could not request enrollment.' });
    } finally {
      setRequesting(false);
    }
  }

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <ScrollView contentContainerStyle={styles.calendarContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarHeader}>
            <View style={styles.titleWrapper}>
              <Text style={styles.calendarTitle}>My classes</Text>
              <Text style={styles.calendarSubtitle}>Your enrolled learning batches</Text>
            </View>
          </View>

          <View style={styles.batchList}>
            {classes.loading ? <Text style={styles.listMessage}>Loading your classes...</Text> : activeClasses.map((item) => (
              <Pressable key={item.id} onPress={() => navigation.navigate('BatchDetails', { batchId: item.id })} style={styles.classCard}>
                <View style={styles.classCardHeader}>
                  <View style={styles.classIcon}>
                    <MaterialCommunityIcons name="book-open-variant" size={22} color="#2D66C8" />
                  </View>
                  <View style={styles.classCardCopy}>
                    <Text style={styles.subjectLabel}>{item.subject || 'CLASS BATCH'}</Text>
                    <Text style={styles.classCardTitle} numberOfLines={2}>{item.title || 'Learning batch'}</Text>
                  </View>
                  {item.status === 'live' ? <Text style={styles.liveBadge}>LIVE</Text> : null}
                </View>
                <Text style={styles.classCardMeta}>{item.schedule || 'Schedule pending'}</Text>
                {item.notes?.length ? <Text style={styles.classCardMeta}>{item.notes.length} teacher update(s)</Text> : null}
                <View style={styles.openBatchRow}>
                  <Text style={styles.openBatchText}>Open workspace</Text>
                  <MaterialCommunityIcons name="arrow-right" size={17} color="#2D66C8" />
                </View>
              </Pressable>
            ))}
            {!classes.loading && activeClasses.length === 0 ? <Text style={styles.listMessage}>No active batches yet. Request access using the batch ID from your teacher.</Text> : null}
          </View>

          {pendingClasses.data.length > 0 ? (
            <View style={styles.pendingSection}>
              <Text style={styles.joinTitle}>Requests awaiting approval</Text>
              {pendingClasses.data.map((item) => (
                <View key={item.id} style={styles.pendingCard}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#A97920" />
                  <View style={styles.classCardCopy}>
                    <Text style={styles.classCardTitle}>{item.title || item.subject || 'Class batch'}</Text>
                    <Text style={styles.classCardMeta}>Waiting for teacher approval</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.joinForm}>
            <Text style={styles.joinTitle}>Join a new batch</Text>
            <Text style={styles.joinDescription}>Enter the batch ID shared by your teacher to request access.</Text>
            <TextInput
              value={batchId}
              onChangeText={setBatchId}
              placeholder="Batch ID"
              placeholderTextColor="#91A0AE"
              autoCapitalize="none"
              style={styles.batchInput}
            />
            <Pressable disabled={requesting || !batchId.trim()} onPress={handleJoinRequest} style={[styles.joinButton, (requesting || !batchId.trim()) && styles.joinButtonDisabled]}>
              <Text style={styles.joinButtonText}>{requesting ? 'Sending request...' : 'Request to join'}</Text>
            </Pressable>
            {requestStatus ? <Text style={requestStatus.type === 'success' ? styles.successMessage : styles.errorMessage}>{requestStatus.message}</Text> : null}
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
  },
  titleWrapper: {
    flex: 1,
  },
  calendarTitle: {
    color: '#24384D',
    fontSize: 25,
    fontWeight: '700',
  },
  calendarSubtitle: {
    color: '#8B98A5',
    fontSize: 12,
    marginTop: 3,
  },
  todayIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDEBF4',
  },
  weekPill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPillActive: {
    backgroundColor: '#DDED63',
    borderColor: '#DDED63',
  },
  weekPillText: {
    color: '#84909B',
    fontSize: 11,
    fontWeight: '600',
  },
  weekPillTextActive: {
    color: '#344132',
  },
  todayPill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillText: {
    color: '#526579',
    fontSize: 11,
    fontWeight: '600',
  },
  dayRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 21,
  },
  dayButton: {
    width: 43,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4EDF3',
  },
  dayButtonActive: {
    backgroundColor: '#2D66C8',
    borderColor: '#2D66C8',
  },
  dayName: {
    color: '#8A96A2',
    fontSize: 10,
    marginBottom: 5,
  },
  dayDate: {
    color: '#33475C',
    fontSize: 15,
    fontWeight: '700',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  scheduleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  scheduleTitle: {
    color: '#25394D',
    fontSize: 17,
    fontWeight: '700',
  },
  scheduleDate: {
    color: '#91A0AD',
    fontSize: 11,
    marginTop: 3,
  },
  sessionCount: {
    color: '#66809A',
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleList: {
    gap: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeLabel: {
    width: 58,
    paddingTop: 14,
    color: '#8B99A7',
    fontSize: 10,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8CAED5',
    marginTop: 17,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 17,
    bottom: 0,
    width: 1,
    backgroundColor: '#D8E6EF',
  },
  scheduleCard: {
    flex: 1,
    minHeight: 81,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 11,
    marginBottom: 10,
  },
  scheduleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  durationLabel: {
    color: '#8996A4',
    fontSize: 9,
  },
  className: {
    color: '#26394D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  roomLabel: {
    color: '#718296',
    fontSize: 10,
  },
  emptySchedule: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#34495E',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  emptyText: {
    color: '#8797A6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  batchList: {
    gap: 11,
    marginBottom: 22,
  },
  listMessage: {
    color: '#8291A0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    fontSize: 13,
    lineHeight: 19,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E4EDF3',
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  classIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F1FF',
  },
  classCardCopy: {
    flex: 1,
  },
  subjectLabel: {
    color: '#3971C9',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 3,
  },
  classCardTitle: {
    color: '#26394D',
    fontSize: 14,
    fontWeight: '700',
  },
  liveBadge: {
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#287E52',
    backgroundColor: '#E4F6EA',
    fontSize: 9,
    fontWeight: '800',
  },
  classCardMeta: {
    color: '#8291A0',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  openBatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EAF0F4',
    paddingTop: 10,
    marginTop: 12,
  },
  openBatchText: {
    color: '#2D66C8',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingSection: {
    gap: 9,
    marginBottom: 22,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    padding: 13,
  },
  joinForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  joinTitle: {
    color: '#26394D',
    fontSize: 15,
    fontWeight: '800',
  },
  joinDescription: {
    color: '#8291A0',
    fontSize: 12,
    lineHeight: 17,
  },
  batchInput: {
    minHeight: 43,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0EAF1',
    backgroundColor: '#F3F8FB',
    color: '#27394B',
    paddingHorizontal: 12,
    fontSize: 13,
  },
  joinButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2D66C8',
  },
  joinButtonDisabled: {
    opacity: 0.55,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  successMessage: {
    color: '#287E52',
    fontSize: 12,
    lineHeight: 18,
  },
  errorMessage: {
    color: '#B75548',
    fontSize: 12,
    lineHeight: 18,
  },
});
