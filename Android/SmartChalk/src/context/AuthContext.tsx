import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  bypassAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  bypassAuth: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser && db) {
          const userRef = doc(db, 'users', currentUser.uid);
          const existingProfile = await getDoc(userRef);
          if (!existingProfile.exists()) {
            const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Student';
            if (!currentUser.displayName) await updateProfile(currentUser, { displayName });
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName,
              photoURL: currentUser.photoURL || null,
              role: 'student',
              createdAt: serverTimestamp(),
              profile: {
                grade: null,
                subjectsOfInterest: [],
                subjectsTaught: [],
                bio: null,
                phone: null,
              },
              linkedStudentIds: null,
            }, { merge: true });
          }
        }
      } catch (error) {
        console.error('User profile bootstrap failed:', error);
      }
      if (active) {
        setUser(currentUser);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const bypassAuth = () => {
    // Set a lightweight mock user session for testing/bypassing auth
    setUser({
      uid: 'dev-bypass-user-id',
      email: 'demo-user@example.com',
      displayName: 'Demo Developer',
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, bypassAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
