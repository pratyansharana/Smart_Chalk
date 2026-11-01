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
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.eyebrow}>STUDENT ACCOUNT</Text>
                        <Text style={styles.title}>Your profile</Text>
                    </View>

                    <View style={styles.profilePanel}>
                        <Pressable onPress={pickPhoto} style={styles.avatarButton} accessibilityRole="button" accessibilityLabel="Change profile photo">
                            {profile.photoURL ? <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} /> : (
                                <Text style={styles.avatarText}>{(profile.displayName || user?.email || 'S').charAt(0).toUpperCase()}</Text>
                            )}
                            <View style={styles.photoEditBadge}><MaterialCommunityIcons name="camera-outline" size={15} color="#FFFFFF" /></View>
                        </Pressable>
                        <View style={styles.accountCopy}>
                            <Text style={styles.accountName} numberOfLines={1}>{profile.displayName || 'Student'}</Text>
                            <Text style={styles.accountEmail} numberOfLines={1}>{user?.email || ''}</Text>
                        </View>
                    </View>

                    {loading ? <ActivityIndicator color="#2D66C8" style={styles.loader} /> : (
                        <View style={styles.form}>
                            <Field label="Display name" value={profile.displayName} onChangeText={(value) => updateField('displayName', value)} />
                            <Field label="Grade or level" value={profile.grade} onChangeText={(value) => updateField('grade', value)} placeholder="e.g. Grade 10" />
                            <Field label="Phone" value={profile.phone} onChangeText={(value) => updateField('phone', value)} keyboardType="phone-pad" />
                            <Field label="Subjects of interest" value={profile.subjectsOfInterest} onChangeText={(value) => updateField('subjectsOfInterest', value)} placeholder="Maths, Physics, Biology" />
                            <Field label="About you" value={profile.bio} onChangeText={(value) => updateField('bio', value)} multiline />

                            <Pressable disabled={saving} onPress={saveProfile} style={styles.primaryButton}>
                                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save profile</Text>}
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Pressable onPress={() => navigation.navigate('SettingsTab')} style={styles.secondaryButton}>
                            <MaterialCommunityIcons name="cog-outline" size={19} color="#2D66C8" />
                            <Text style={styles.secondaryButtonText}>Settings</Text>
                            <MaterialCommunityIcons name="chevron-right" size={19} color="#91A0AE" />
                        </Pressable>
                        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
                            <MaterialCommunityIcons name="logout-variant" size={18} color="#A4514B" />
                            <Text style={styles.signOutText}>Sign out</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    multiline,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad';
    multiline?: boolean;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || label}
                placeholderTextColor="#97A5B2"
                keyboardType={keyboardType || 'default'}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                style={[styles.input, multiline && styles.multilineInput]}
            />
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
    container: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 36,
    },
    header: {
        marginBottom: 17,
    },
    eyebrow: {
        color: '#3971C9',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 5,
    },
    title: {
        color: '#25394D',
        fontSize: 25,
        fontWeight: '800',
    },
    profilePanel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 15,
        marginBottom: 16,
    },
    avatarButton: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#DDEFFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },
    avatarImage: {
        width: 66,
        height: 66,
        borderRadius: 33,
    },
    photoEditBadge: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2D66C8',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#2D66C8',
        fontSize: 26,
        fontWeight: '800',
    },
    accountCopy: {
        flex: 1,
    },
    accountName: {
        color: '#26394D',
        fontSize: 16,
        fontWeight: '800',
    },
    accountEmail: {
        color: '#8291A0',
        fontSize: 12,
        marginTop: 4,
    },
    form: {
        gap: 12,
    },
    field: {
        gap: 6,
    },
    fieldLabel: {
        color: '#536A80',
        fontSize: 11,
        fontWeight: '700',
    },
    input: {
        minHeight: 44,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDE8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        color: '#26394D',
        fontSize: 13,
    },
    multilineInput: {
        minHeight: 94,
        paddingTop: 10,
    },
    primaryButton: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#2D66C8',
        marginTop: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    actions: {
        marginTop: 22,
        gap: 8,
    },
    secondaryButton: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 13,
    },
    secondaryButtonText: {
        flex: 1,
        color: '#344B62',
        fontSize: 13,
        fontWeight: '700',
    },
    signOutButton: {
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    signOutText: {
        color: '#A4514B',
        fontSize: 12,
        fontWeight: '700',
    },
    loader: {
        marginVertical: 28,
    },
});