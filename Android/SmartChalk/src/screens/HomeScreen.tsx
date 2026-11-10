import React, { useEffect } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { auth, db } from '../config/firebaseconfig';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import type { MainTabScreenProps } from '../navigation/types';

// Self-contained push notification registration to prevent missing import crashes
async function registerForPushNotificationsSafe(userId: string) {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('smartchalk-updates', {
            name: 'Class and assignment updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2563EB',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const expoPushToken = tokenData.data;

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
        console.error('Error saving push token on home load:', error);
        return null;
    }
}

export default function HomeScreen({ navigation }: MainTabScreenProps<'HomeTab'>) {
    const insets = useSafeAreaInsets();
    const user = auth.currentUser;
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Student';
    const firstName = displayName.split(/[ ._-]/)[0];
    
    const dashboard = useStudentDashboard(user?.uid) || {};
    const classes = dashboard.classes || { data: [], loading: false };
    const assignments = dashboard.assignments || { data: [], loading: false };
    const submissions = dashboard.submissions || { data: [], loading: false };

    const activeClasses = (classes.data || []).filter((item) => item.status !== 'discontinued');
    const submittedAssignmentIds = new Set((submissions.data || []).map((item) => item.assignmentId).filter(Boolean));
    const pendingAssignments = (assignments.data || []).filter((item) => !submittedAssignmentIds.has(item.id));
    const gradedSubmissions = (submissions.data || []).filter((item) => typeof item.grade === 'number');
    
    const averageGrade = gradedSubmissions.length
        ? Math.round(gradedSubmissions.reduce((sum, item) => {
            const assignment = (assignments.data || []).find((entry) => entry.id === item.assignmentId);
            const maxScore = assignment?.maxScore || item.maxScore || 100;
            return sum + ((item.grade || 0) / maxScore) * 100;
        }, 0) / gradedSubmissions.length)
        : null;

    useEffect(() => {
        if (!user?.uid) return;
        registerForPushNotificationsSafe(user.uid).catch((err) => {
            console.log('Auto notification registration failed:', err);
        });
    }, [user?.uid]);

    const handleLogout = () => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut(auth);
                    } catch (error) {
                        console.error('Logout Error:', error);
                        Alert.alert('Unable to sign out', 'Please try again.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Banner matching ExploreScreen style */}
                    <View style={styles.header}>
                        <View style={styles.eyebrowBadge}>
                            <MaterialCommunityIcons name="view-dashboard-outline" size={12} color="#2563EB" />
                            <Text style={styles.eyebrowText}>STUDENT DASHBOARD</Text>
                        </View>
                        <View style={styles.headerTopRow}>
                            <View style={styles.headerTextGroup}>
                                <Text style={styles.title}>Welcome, {firstName}</Text>
                                <Text style={styles.subtitle}>Your classes, pending tasks, and AI study companion</Text>
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Open profile"
                                style={styles.profileBadge}
                                onPress={() => navigation.navigate('ProfileTab')}
                            >
                                {user?.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.profileBadgeText}>{firstName.charAt(0).toUpperCase()}</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>

                    {/* AI Tutor Hero Card */}
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => navigation.navigate('AIChat')}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroGlow} />
                        <View style={styles.heroContent}>
                            <View style={styles.heroIconBox}>
                                <MaterialCommunityIcons name="creation" size={22} color="#FFFFFF" />
                            </View>
                            <View style={styles.heroTextGroup}>
                                <Text style={styles.heroTitle}>SmartChalk AI Tutor</Text>
                                <Text style={styles.heroSubtitle}>Need help with a concept? Ask questions or generate quizzes.</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                        </View>
                    </Pressable>

                    {/* Stats Dashboard Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                                <MaterialCommunityIcons name="clipboard-text-clock-outline" size={20} color="#2563EB" />
                            </View>
                            <Text style={styles.statValue}>{assignments.loading ? '...' : pendingAssignments.length}</Text>
                            <Text style={styles.statLabel}>Pending Tasks</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
                                <MaterialCommunityIcons name="google-classroom" size={20} color="#9333EA" />
                            </View>
                            <Text style={styles.statValue}>{classes.loading ? '...' : activeClasses.length}</Text>
                            <Text style={styles.statLabel}>Enrolled Batches</Text>
                        </View>
                    </View>

                    {/* Classes Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>My Classes</Text>
                            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ExploreTab')}>
                                <Text style={styles.seeAllText}>Browse All</Text>
                            </Pressable>
                        </View>

                        <View style={styles.listContainer}>
                            {classes.loading ? (
                                <View style={styles.placeholderCard}>
                                    <MaterialCommunityIcons name="loading" size={22} color="#94A3B8" style={{ marginBottom: 6 }} />
                                    <Text style={styles.placeholderText}>Loading your enrolled classes...</Text>
                                </View>
                            ) : activeClasses.length === 0 ? (
                                <View style={styles.placeholderCard}>
                                    <MaterialCommunityIcons name="school-outline" size={26} color="#94A3B8" style={{ marginBottom: 6 }} />
                                    <Text style={styles.placeholderText}>No active batches yet. Browse classes to join one.</Text>
                                </View>
                            ) : activeClasses.slice(0, 4).map((item) => (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="button"
                                    style={styles.classCard}
                                    onPress={() => navigation.navigate('BatchDetails', { batchId: item.id })}
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

                    {/* Assignments Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Assignments & Tasks</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{averageGrade === null ? 'No grades yet' : `Avg ${averageGrade}%`}</Text>
                            </View>
                        </View>

                        <View style={styles.listContainer}>
                            {assignments.loading ? (
                                <View style={styles.placeholderCard}>
                                    <Text style={styles.placeholderText}>Loading assignments...</Text>
                                </View>
                            ) : pendingAssignments.length === 0 ? (
                                <View style={styles.placeholderCard}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={28} color="#16A34A" style={{ marginBottom: 6 }} />
                                    <Text style={styles.placeholderText}>You&apos;re all caught up on assigned work!</Text>
                                </View>
                            ) : pendingAssignments.slice(0, 3).map((assignment) => {
                                const dueDate = assignment.dueDate ? new Date(assignment.dueDate.toDate?.() || assignment.dueDate) : null;
                                return (
                                    <Pressable
                                        key={assignment.id}
                                        style={styles.classCard}
                                        onPress={() => assignment.classId && navigation.navigate('BatchDetails', { batchId: assignment.classId })}
                                    >
                                        <View style={styles.classCardHeader}>
                                            <View style={[styles.classIcon, { backgroundColor: '#FEF3C7' }]}>
                                                <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#D97706" />
                                            </View>
                                            <View style={styles.classCardCopy}>
                                                <Text style={[styles.subjectLabel, { color: '#D97706' }]}>ASSIGNMENT</Text>
                                                <Text style={styles.classCardTitle} numberOfLines={1}>{assignment.title}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.classCardFooter}>
                                            <Text style={styles.classCardMeta} numberOfLines={1}>
                                                {dueDate ? `Due ${dueDate.toLocaleDateString()}` : assignment.subject || 'Due date pending'}
                                            </Text>
                                            <View style={styles.openBatchRow}>
                                                <Text style={styles.openBatchText}>View task</Text>
                                                <MaterialCommunityIcons name="arrow-right" size={16} color="#2563EB" />
                                            </View>
                                        </View>
                                    </Pressable>
                                );
                            })}
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
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTextGroup: {
        flex: 1,
        marginRight: 12,
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
    profileBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    avatarImage: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    profileBadgeText: {
        color: '#2563EB',
        fontSize: 18,
        fontWeight: '700',
    },
    heroCard: {
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
    heroGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    heroTextGroup: {
        flex: 1,
        marginRight: 8,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    heroSubtitle: {
        color: '#E2E8F0',
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
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
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 1,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
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
    },
    seeAllText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '700',
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
        marginRight: 8,
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
});