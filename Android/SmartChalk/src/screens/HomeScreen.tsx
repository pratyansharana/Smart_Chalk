import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';
import { getAssignmentDueDate, useStudentDashboard } from '../hooks/useStudentDashboard';
import type { MainTabScreenProps } from '../navigation/types';

export default function HomeScreen({ navigation }: MainTabScreenProps<'HomeTab'>) {
    const insets = useSafeAreaInsets();
    const user = auth.currentUser;
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Student';
    const firstName = displayName.split(/[ ._-]/)[0];
    const { classes, assignments, submissions } = useStudentDashboard(user?.uid);
    const activeClasses = classes.data.filter((item) => item.status !== 'discontinued');
    const submittedAssignmentIds = new Set(submissions.data.map((item) => item.assignmentId).filter(Boolean));
    const pendingAssignments = assignments.data.filter((item) => !submittedAssignmentIds.has(item.id));
    const gradedSubmissions = submissions.data.filter((item) => typeof item.grade === 'number');
    const averageGrade = gradedSubmissions.length
        ? Math.round(gradedSubmissions.reduce((sum, item) => {
            const assignment = assignments.data.find((entry) => entry.id === item.assignmentId);
            const maxScore = assignment?.maxScore || item.maxScore || 100;
            return sum + ((item.grade || 0) / maxScore) * 100;
        }, 0) / gradedSubmissions.length)
        : null;

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
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.headerCopy}>
                            <Text style={styles.greeting}>Good morning,</Text>
                            <Text style={styles.name} numberOfLines={1}>{firstName}</Text>
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

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: '#E9F1FF' }]}>
                                <MaterialCommunityIcons name="file-document-outline" size={22} color="#3168CC" />
                            </View>
                            <Text style={styles.statValue}>{assignments.loading ? '...' : pendingAssignments.length}</Text>
                            <Text style={styles.statLabel}>To do</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: '#F0EDFF' }]}>
                                <MaterialCommunityIcons name="school-outline" size={22} color="#6A68C9" />
                            </View>
                            <Text style={styles.statValue}>{classes.loading ? '...' : activeClasses.length}</Text>
                            <Text style={styles.statLabel}>Active batches</Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeading}>
                        <Text style={styles.sectionTitle}>My classes</Text>
                        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ExploreTab')}>
                            <Text style={styles.seeAll}>Browse</Text>
                        </Pressable>
                    </View>

                    <View style={styles.classList}>
                        {classes.loading ? (
                            <Text style={styles.classMeta}>Loading your enrolled classes...</Text>
                        ) : activeClasses.length === 0 ? (
                            <Text style={styles.classMeta}>No active batches yet. Browse classes to join one.</Text>
                        ) : activeClasses.slice(0, 4).map((item, index) => (
                            <Pressable
                                key={item.id}
                                accessibilityRole="button"
                                style={styles.classRow}
                                onPress={() => navigation.navigate('BatchDetails', { batchId: item.id })}
                            >
                                <View style={[styles.classIcon, { backgroundColor: index % 2 ? '#E6F5FB' : '#E8F1FF' }]}>
                                    <MaterialCommunityIcons name="book-open-variant" size={21} color={index % 2 ? '#2870C7' : '#2866D8'} />
                                </View>
                                <View style={styles.classCopy}>
                                    <Text style={styles.classTitle} numberOfLines={1}>{item.title || item.subject || 'Class batch'}</Text>
                                    <Text style={styles.classMeta} numberOfLines={1}>{item.subject || 'Class'}  ·  {item.schedule || 'Schedule pending'}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={21} color="#A2ACB8" />
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.sectionHeading}>
                        <Text style={styles.sectionTitle}>Assignments</Text>
                        <Text style={styles.classMeta}>{averageGrade === null ? 'No grades yet' : `Average ${averageGrade}%`}</Text>
                    </View>
                    <View style={styles.classList}>
                        {assignments.loading ? (
                            <Text style={styles.classMeta}>Loading assignments...</Text>
                        ) : pendingAssignments.length === 0 ? (
                            <Text style={styles.classMeta}>You&apos;re all caught up on assigned work.</Text>
                        ) : pendingAssignments.slice(0, 3).map((assignment) => {
                            const dueDate = getAssignmentDueDate(assignment);
                            return (
                                <Pressable
                                    key={assignment.id}
                                    style={styles.classRow}
                                    onPress={() => assignment.classId && navigation.navigate('BatchDetails', { batchId: assignment.classId })}
                                >
                                    <View style={[styles.classIcon, { backgroundColor: '#FFF3D1' }]}>
                                        <MaterialCommunityIcons name="file-document-outline" size={21} color="#B77A1A" />
                                    </View>
                                    <View style={styles.classCopy}>
                                        <Text style={styles.classTitle} numberOfLines={1}>{assignment.title}</Text>
                                        <Text style={styles.classMeta} numberOfLines={1}>
                                            {dueDate ? `Due ${dueDate.toLocaleDateString()}` : assignment.subject || 'Due date pending'}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        onPress={() => activeClasses[0]
                            ? navigation.navigate('BatchDetails', { batchId: activeClasses[0].id, initialTab: 'study' })
                            : navigation.navigate('ExploreTab')}
                        style={styles.aiCard}
                    >
                        <View style={styles.aiIcon}>
                            <MaterialCommunityIcons name="creation" size={24} color="#2866D8" />
                        </View>
                        <View style={styles.aiCopy}>
                            <Text style={styles.aiEyebrow}>SMARTCHALK AI</Text>
                            <Text style={styles.aiTitle}>A little help with a big idea</Text>
                            <Text style={styles.aiDescription}>Get a clearer explanation of the topics you&apos;re learning.</Text>
                        </View>
                    </Pressable>

                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout-variant" size={18} color="#7B8795" />
                        <Text style={styles.logoutButtonText}>Sign out</Text>
                    </Pressable>
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
    scrollContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 6,
    },
    greeting: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'capitalize',
    },
    profileBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDEBF4',
    },
    profileBadgeText: {
        color: '#2866D8',
        fontSize: 22,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 26,
    },
    statBox: {
        flex: 1,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 23,
        fontWeight: '800',
        color: '#21364D',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 13,
        color: '#8794A2',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#25394D',
        marginBottom: 0,
        marginTop: 0,
    },
    logoutButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
        paddingVertical: 14,
        marginTop: 6,
        marginBottom: 12,
    },
    logoutButtonText: {
        color: '#7B8795',
        fontSize: 13,
        fontWeight: '600',
    },
    headerCopy: {
        flex: 1,
        marginRight: 12,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    statIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    seeAll: {
        color: '#3168CC',
        fontSize: 12,
        fontWeight: '700',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderColor: '#D9E5EF',
        borderWidth: 1,
        borderRadius: 14,
    },
    classList: {
        gap: 9,
        marginBottom: 18,
    },
    classRow: {
        minHeight: 66,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    classIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },
    classCopy: {
        flex: 1,
        marginRight: 6,
    },
    classTitle: {
        color: '#26384B',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    classMeta: {
        color: '#8C99A6',
        fontSize: 10,
    },
    aiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#DFF2FA',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D5EBF6',
    },
    aiIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    aiCopy: {
        flex: 1,
    },
    aiEyebrow: {
        color: '#3971C9',
        fontSize: 9,
        fontWeight: '800',
        marginBottom: 4,
    },
    aiTitle: {
        color: '#26384B',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 3,
    },
    aiDescription: {
        color: '#6E8193',
        fontSize: 11,
        lineHeight: 15,
    },
});