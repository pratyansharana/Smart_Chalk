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
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.eyebrowBadge}>
              <MaterialCommunityIcons name="compass-outline" size={12} color="#2563EB" />
              <Text style={styles.eyebrowText}>DISCOVERY & ACCESS</Text>
            </View>
            <Text style={styles.title}>Explore Batches</Text>
            <Text style={styles.subtitle}>Discover new subjects, join classes, and expand your learning path.</Text>
          </View>

          {/* Join New Batch Hero Card */}
          <View style={styles.heroJoinCard}>
            <View style={styles.heroJoinGlow} />
            <View style={styles.heroJoinContent}>
              <View style={styles.heroJoinIconBox}>
                <MaterialCommunityIcons name="telescope" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.heroJoinTextGroup}>
                <Text style={styles.heroJoinTitle}>Join a New Batch</Text>
                <Text style={styles.heroJoinSubtitle}>Got a batch ID from your teacher? Enter it below to request instant access.</Text>
              </View>
            </View>

            <View style={styles.joinFormRow}>
              <TextInput
                value={batchId}
                onChangeText={setBatchId}
                placeholder="Enter Batch ID..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={styles.batchInput}
              />
              <Pressable
                disabled={requesting || !batchId.trim()}
                onPress={handleJoinRequest}
                style={[styles.joinButton, (requesting || !batchId.trim()) && styles.joinButtonDisabled]}
              >
                <Text style={styles.joinButtonText}>{requesting ? 'Sending...' : 'Join'}</Text>
              </Pressable>
            </View>
            {requestStatus ? (
              <Text style={[styles.statusMessage, requestStatus.type === 'success' ? styles.successMessage : styles.errorMessage]}>
                {requestStatus.message}
              </Text>
            ) : null}
          </View>

          {/* Pending Requests Section */}
          {pendingClasses.data.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requests Awaiting Approval</Text>
              <View style={styles.listContainer}>
                {pendingClasses.data.map((item) => (
                  <View key={item.id} style={styles.pendingCard}>
                    <View style={styles.pendingIconBox}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                    </View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.subject || 'Class batch'}</Text>
                      <Text style={styles.cardMeta}>Waiting for teacher approval</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Enrolled Active Classes */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Enrolled Batches</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{activeClasses.length}</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {classes.loading ? (
                <View style={styles.placeholderCard}>
                  <MaterialCommunityIcons name="loading" size={22} color="#94A3B8" style={{ marginBottom: 6 }} />
                  <Text style={styles.placeholderText}>Loading your classes...</Text>
                </View>
              ) : activeClasses.length === 0 ? (
                <View style={styles.placeholderCard}>
                  <MaterialCommunityIcons name="school-outline" size={26} color="#94A3B8" style={{ marginBottom: 6 }} />
                  <Text style={styles.placeholderText}>No active batches yet. Enter a batch ID above to join your first class.</Text>
                </View>
              ) : activeClasses.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate('BatchDetails', { batchId: item.id })}
                  style={styles.classCard}
                >
                  <View style={styles.classCardHeader}>
                    <View style={styles.classIcon}>
                      <MaterialCommunityIcons name="book-open-variant" size={20} color="#2563EB" />
                    </View>
                    <View style={styles.classCardCopy}>
                      <Text style={styles.subjectLabel}>{item.subject || 'CLASS BATCH'}</Text>
                      <Text style={styles.classCardTitle} numberOfLines={1}>{item.title || 'Learning batch'}</Text>
                    </View>
                    {item.status === 'live' && <Text style={styles.liveBadge}>LIVE</Text>}
                  </View>

                  <View style={styles.classCardFooter}>
                    <Text style={styles.classCardMeta} numberOfLines={1}>
                      {item.schedule || 'Schedule pending'} {item.notes?.length ? `· ${item.notes.length} update(s)` : ''}
                    </Text>
                    <View style={styles.openBatchRow}>
                      <Text style={styles.openBatchText}>Open workspace</Text>
                      <MaterialCommunityIcons name="arrow-right" size={16} color="#2563EB" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
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
  header: {
    marginBottom: 20,
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
  heroJoinCard: {
    backgroundColor: '#2563EB',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  heroJoinGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroJoinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroJoinIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroJoinTextGroup: {
    flex: 1,
  },
  heroJoinTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroJoinSubtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  joinFormRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  batchInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  joinButton: {
    height: 46,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statusMessage: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
  },
  successMessage: {
    color: '#DCFCE7',
  },
  errorMessage: {
    color: '#FEE2E2',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 14,
  },
  pendingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCard: {
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
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  classIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  classCardCopy: {
    flex: 1,
  },
  subjectLabel: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  classCardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  liveBadge: {
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#15803D',
    backgroundColor: '#F0FDF4',
    fontSize: 10,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  classCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  classCardMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  openBatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openBatchText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
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
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardMeta: {
    color: '#854D0E',
    fontSize: 11,
    fontWeight: '500',
  },
});