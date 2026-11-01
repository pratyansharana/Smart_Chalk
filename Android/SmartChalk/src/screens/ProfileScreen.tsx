import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebaseconfig';
import type { MainTabScreenProps } from '../navigation/types';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'ProfileTab'>) {
    const insets = useSafeAreaInsets();
    const userEmail = auth.currentUser?.email || 'developer@example.com';
    const displayName = userEmail.split('@')[0];

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
                <ScrollView 
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Header Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.nameText}>{displayName}</Text>
                        <Text style={styles.emailText}>{userEmail}</Text>
                    </View>

                    {/* Settings & Options Group */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Ionicons name="person-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Ionicons name="options-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
                            <Text style={styles.menuText}>App Preferences</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Feature coming soon!')}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
                            <Text style={styles.menuText}>Security & Passwords</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Support & About</Text>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Version 1.0.0')}>
                            <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
                            <Text style={styles.menuText}>App Version</Text>
                            <Text style={styles.versionText}>1.0.0</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Contacting support...')}>
                            <Ionicons name="mail-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
                            <Text style={styles.menuText}>Contact Support</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    safeArea: {
        flex: 1,
    },
    container: {
        padding: 24,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    nameText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F9FAFB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    menuIcon: {
        marginRight: 14,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    versionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
});