import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../config/firebaseconfig';
import type { MainTabScreenProps } from '../navigation/types';

interface ProfileForm {
    displayName: string;
    photoURL: string;
    grade: string;
    phone: string;
    bio: string;
    subjectsOfInterest: string;
}

export default function ProfileScreen({ navigation }: MainTabScreenProps<'ProfileTab'>) {
    const insets = useSafeAreaInsets();
    const user = auth.currentUser;
    const userId = user?.uid;
    const [profile, setProfile] = useState<ProfileForm>({
        displayName: user?.displayName || '',
        photoURL: user?.photoURL || '',
        grade: '',
        phone: '',
        bio: '',
        subjectsOfInterest: '',
    });
    const [loading, setLoading] = useState(Boolean(userId));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userId) return undefined;
        return onSnapshot(doc(db, 'users', userId), (snapshot) => {
            const data = snapshot.data();
            const userProfile = data?.profile || {};
            setProfile({
                displayName: data?.displayName || user?.displayName || user?.email?.split('@')[0] || '',
                photoURL: data?.photoURL || user?.photoURL || '',
                grade: String(userProfile.grade || ''),
                phone: userProfile.phone || '',
                bio: userProfile.bio || '',
                subjectsOfInterest: (userProfile.subjectsOfInterest || []).join(', '),
            });
            setLoading(false);
        }, (error) => {
            console.error('Profile subscription failed:', error);
            setLoading(false);
        });
    }, [userId]);

    const updateField = (field: keyof ProfileForm, value: string) => {
        setProfile((current) => ({ ...current, [field]: value }));
    };

    const pickPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (result.canceled || !userId || !user) return;
        setSaving(true);
        try {
            const asset = result.assets[0];
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const extension = asset.fileName?.split('.').pop() || 'jpg';
            const storageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}.${extension}`);
            await uploadBytes(storageRef, blob, { contentType: asset.mimeType || 'image/jpeg' });
            const photoURL = await getDownloadURL(storageRef);
            await updateProfile(user, { photoURL });
            await updateDoc(doc(db, 'users', userId), { photoURL });
            setProfile((current) => ({ ...current, photoURL }));
        } catch (error) {
            Alert.alert('Photo upload failed', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const saveProfile = async () => {
        if (!userId || !user) return;
        const displayName = profile.displayName.trim();
        if (!displayName) {
            Alert.alert('Name required', 'Enter the name you want teachers to see.');
            return;
        }
        setSaving(true);
        try {
            await Promise.all([
                updateProfile(user, { displayName }),
                updateDoc(doc(db, 'users', userId), {
                    displayName,
                    profile: {
                        grade: profile.grade.trim() || null,
                        phone: profile.phone.trim() || null,
                        bio: profile.bio.trim() || null,
                        subjectsOfInterest: profile.subjectsOfInterest.split(',').map((subject) => subject.trim()).filter(Boolean),
                    },
                }),
            ]);
            Alert.alert('Profile updated', 'Your student profile has been saved.');
        } catch (error) {
            Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert('Sign out', 'Sign out of SmartChalk?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
        ]);
    };

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 8) }]}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Modern Gradient Hero Card with Avatar */}
                    <View style={styles.heroCard}>
                        <View style={styles.heroGlowCircle} />
                        <View style={styles.heroContent}>
                            <Pressable onPress={pickPhoto} style={styles.avatarButton} accessibilityRole="button" accessibilityLabel="Change profile photo">
                                {profile.photoURL ? (
                                    <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>{(profile.displayName || user?.email || 'S').charAt(0).toUpperCase()}</Text>
                                )}
                                <View style={styles.photoEditBadge}>
                                    <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
                                </View>
                            </Pressable>
                            <View style={styles.heroTextContainer}>
                                <View style={styles.rolePill}>
                                    <MaterialCommunityIcons name="school-outline" size={12} color="#2563EB" />
                                    <Text style={styles.rolePillText}>Student Account</Text>
                                </View>
                                <Text style={styles.accountName} numberOfLines={1}>{profile.displayName || 'Student'}</Text>
                                <Text style={styles.accountEmail} numberOfLines={1}>{user?.email || ''}</Text>
                            </View>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#2563EB" />
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionHeader}>Personal & Academic Details</Text>
                            
                            <Field 
                                label="Display Name" 
                                icon="account-outline" 
                                value={profile.displayName} 
                                onChangeText={(value) => updateField('displayName', value)} 
                            />
                            <Field 
                                label="Grade or Level" 
                                icon="school" 
                                value={profile.grade} 
                                onChangeText={(value) => updateField('grade', value)} 
                                placeholder="e.g. Grade 10" 
                            />
                            <Field 
                                label="Phone Number" 
                                icon="phone-outline" 
                                value={profile.phone} 
                                onChangeText={(value) => updateField('phone', value)} 
                                keyboardType="phone-pad" 
                            />
                            <Field 
                                label="Subjects of Interest" 
                                icon="book-open-variant" 
                                value={profile.subjectsOfInterest} 
                                onChangeText={(value) => updateField('subjectsOfInterest', value)} 
                                placeholder="Maths, Physics, Biology" 
                            />
                            <Field 
                                label="About You" 
                                icon="text-box-outline" 
                                value={profile.bio} 
                                onChangeText={(value) => updateField('bio', value)} 
                                multiline 
                                placeholder="Write a short bio..." 
                            />

                            <Pressable disabled={saving} onPress={saveProfile} style={styles.primaryButton}>
                                {saving ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.primaryButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    )}

                    {/* Navigation & Actions Section */}
                    <View style={styles.actionsContainer}>
                        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.secondaryButton}>
                            <View style={styles.secondaryIconBox}>
                                <MaterialCommunityIcons name="cog-outline" size={20} color="#2563EB" />
                            </View>
                            <View style={styles.secondaryTextGroup}>
                                <Text style={styles.secondaryButtonTitle}>App Settings</Text>
                                <Text style={styles.secondaryButtonSubtitle}>Notifications, security, preferences</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                        </Pressable>

                        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
                            <MaterialCommunityIcons name="logout-variant" size={18} color="#DC2626" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

function Field({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    multiline,
}: {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad';
    multiline?: boolean;
}) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputContainer, multiline && styles.multilineContainer]}>
                <MaterialCommunityIcons name={icon} size={18} color="#64748B" style={[styles.inputIcon, multiline && styles.multilineIcon]} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || label}
                    placeholderTextColor="#94A3B8"
                    keyboardType={keyboardType || 'default'}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    style={[styles.input, multiline && styles.multilineInput]}
                />
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
    heroCard: {
        backgroundColor: '#2563EB',
        borderRadius: 22,
        padding: 20,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 4,
    },
    heroGlowCircle: {
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
    avatarButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    avatarImage: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    photoEditBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#0F172A',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
    },
    heroTextContainer: {
        flex: 1,
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 6,
        gap: 4,
    },
    rolePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563EB',
        textTransform: 'uppercase',
    },
    accountName: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    accountEmail: {
        color: '#E2E8F0',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: -4,
        letterSpacing: -0.2,
    },
    fieldWrapper: {
        gap: 6,
    },
    fieldLabel: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '700',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    multilineContainer: {
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    multilineIcon: {
        marginTop: 2,
    },
    input: {
        flex: 1,
        color: '#0F172A',
        fontSize: 13,
        fontWeight: '600',
        paddingVertical: 0,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    primaryButton: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: '#2563EB',
        marginTop: 6,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    actionsContainer: {
        marginTop: 20,
        gap: 12,
    },
    secondaryButton: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    secondaryIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    secondaryTextGroup: {
        flex: 1,
    },
    secondaryButtonTitle: {
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    secondaryButtonSubtitle: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },
    signOutButton: {
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginTop: 4,
    },
    signOutText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
    },
    loaderContainer: {
        paddingVertical: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
});