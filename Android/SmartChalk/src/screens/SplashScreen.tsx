import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  statusMessage?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ statusMessage = 'Initializing application...' }) => {
  const [logoScale] = useState(() => new Animated.Value(0.7));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [textOpacity] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Entrance sequence
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous subtle pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [logoOpacity, logoScale, pulseAnim, textOpacity]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          { 
            opacity: logoOpacity, 
            transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }] 
          }
        ]}
      >
        <View style={styles.logoTile}>
          <MaterialCommunityIcons name="book-open-page-variant" size={42} color="#2D66C8" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.brandContainer, { opacity: textOpacity }]}>
        <Text style={styles.brandTitle}>SmartChalk</Text>
        <Text style={styles.brandSubtitle}>Your learning, all in one place.</Text>
      </Animated.View>

      <Animated.View style={[styles.statusContainer, { opacity: textOpacity }]}>
        <View style={styles.loadingBar}>
          <View style={styles.loadingProgress} />
        </View>
        <ActivityIndicator size="small" color="#2D66C8" style={styles.spinner} />
        <Text style={styles.statusText}>{statusMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF8FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoTile: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDEBF4',
    shadowColor: '#2D66C8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 44,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#25394D',
    letterSpacing: 0,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#8291A0',
    fontWeight: '500',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 34,
    alignItems: 'center',
    width: '76%',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#D9E7F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#2D66C8',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#8291A0',
    fontWeight: '500',
  },
  spinner: {
    marginBottom: 9,
  },
});
