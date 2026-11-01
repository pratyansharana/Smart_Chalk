import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabs from './MainTabs';
import { SplashScreen } from '../screens/SplashScreen';
import BatchDetailsScreen from '../screens/BatchDetailsScreen';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const BIOMETRIC_KEY = 'smartchalk:biometric-lock:';

type GateState = { userId: string | null; status: 'checking' | 'locked' | 'unlocked' };

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [gate, setGate] = useState<GateState>({ userId: null, status: 'checking' });

  useEffect(() => {
    let active = true;
    async function checkBiometricLock() {
      if (!user) {
        if (active) setGate({ userId: null, status: 'unlocked' });
        return;
      }
      try {
        const enabled = await AsyncStorage.getItem(`${BIOMETRIC_KEY}${user.uid}`);
        if (enabled !== 'true') {
          if (active) setGate({ userId: user.uid, status: 'unlocked' });
          return;
        }
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock SmartChalk' });
        if (active) setGate({ userId: user.uid, status: result.success ? 'unlocked' : 'locked' });
      } catch (error) {
        console.error('Biometric unlock failed:', error);
        if (active) setGate({ userId: user.uid, status: 'locked' });
      }
    }
    void checkBiometricLock();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  async function retryBiometricUnlock() {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock SmartChalk' });
    if (result.success && user) setGate({ userId: user.uid, status: 'unlocked' });
  }

  if (isLoading) {
    return <SplashScreen statusMessage="Verifying authentication & session..." />;
  }

  if (user && (gate.userId !== user.uid || gate.status === 'checking')) {
    return <SplashScreen statusMessage="Checking your secure sign-in..." />;
  }

  if (user && gate.status === 'locked') {
    return <BiometricLockScreen onUnlock={retryBiometricUnlock} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="BatchDetails"
            component={BatchDetailsScreen}
            options={{ gestureEnabled: true }}
          />
        </>
      ) : (
        // Unauthenticated Public Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function BiometricLockScreen({ onUnlock }: { onUnlock: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function unlock() {
    setBusy(true);
    try {
      await onUnlock();
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={lockStyles.screen}>
      <View style={lockStyles.icon}>
        <MaterialCommunityIcons name="fingerprint" size={36} color="#2D66C8" />
      </View>
      <Text style={lockStyles.title}>SmartChalk is locked</Text>
      <Text style={lockStyles.description}>Verify your identity to continue.</Text>
      <Pressable disabled={busy} onPress={unlock} style={lockStyles.button}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={lockStyles.buttonText}>Unlock</Text>}
      </Pressable>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#EDF8FD' },
  icon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, marginBottom: 18 },
  title: { color: '#25394D', fontSize: 20, fontWeight: '800' },
  description: { color: '#8291A0', fontSize: 13, marginTop: 7 },
  button: { minHeight: 44, minWidth: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D66C8', borderRadius: 11, marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});