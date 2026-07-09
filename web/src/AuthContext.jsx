import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from './firebase';

const AuthContext = createContext(null);

const demoTeacher = {
  uid: 'demo-teacher',
  displayName: 'Teacher Demo',
  email: 'teacher@smartchalk.test',
  role: 'teacher',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setAuthError('');
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          setProfile({ uid: currentUser.uid, ...snapshot.data() });
        } else {
          const fallbackProfile = {
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email,
            role: 'student',
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, fallbackProfile, { merge: true });
          setProfile({ uid: currentUser.uid, ...fallbackProfile });
        }
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function login(email, password) {
    if (!firebaseReady) {
      setUser(demoTeacher);
      setProfile(demoTeacher);
      return demoTeacher;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function register({ email, password, displayName, role }) {
    if (!firebaseReady) {
      const demoUser = {
        uid: `demo-${role}`,
        displayName,
        email,
        role,
      };
      setUser(demoUser);
      setProfile(demoUser);
      return demoUser;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    const userProfile = {
      displayName,
      email,
      role,
      classTier: role === 'student' ? 'Class 8' : '',
      parentContact: '',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', result.user.uid), userProfile);
    setProfile({ uid: result.user.uid, ...userProfile });
    return result.user;
  }

  async function logout() {
    if (!firebaseReady) {
      setUser(null);
      setProfile(null);
      return;
    }

    await signOut(auth);
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role || null,
      loading,
      authError,
      login,
      register,
      logout,
    }),
    [user, profile, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
