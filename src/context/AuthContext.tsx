import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { auth, db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { dataService } from '../services/dataService';
import { Worker, UserRole } from '../types';

interface AuthContextType {
  currentUser: Worker | null;
  fbUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  registerWorker: (data: Partial<Worker>, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Worker | null>(null);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        const normalizedEmail = user.email?.toLowerCase().trim();
        console.log("Auth State Changed for:", normalizedEmail, "UID:", user.uid);
        
        try {
          // 1. Check for super admin bootstrap FIRST
          if (normalizedEmail === 'carlostecal35@gmail.com') {
            console.log("Super Admin detected. Checking profile...");
            const adminDocRef = doc(db, 'trabalhadores', user.uid);
            const adminSnap = await getDoc(adminDocRef);
            
            if (!adminSnap.exists()) {
              console.log("Bootstrapping super admin profile...");
              const adminUser: Worker = {
                id: user.uid,
                name: user.displayName || 'Administrador Principal',
                email: normalizedEmail,
                role: 'ADMIN',
                active: true,
                createdAt: Date.now(),
                acceptedTerm: true,
                termAcceptedAt: Date.now()
              };
              await setDoc(adminDocRef, adminUser);
              
              try {
                await dataService.populateDefaults();
              } catch (popErr) {
                console.error("Failed to populate default sectors during bootstrap:", popErr);
              }
              
              setCurrentUser(adminUser);
              setLoading(false);
              return;
            } else {
              // Profile exists, but ensure it has admin powers and is active
              const adminData = adminSnap.data() as Worker;
              if (adminData.role !== 'ADMIN' || !adminData.active) {
                const updatedAdmin = { ...adminData, role: 'ADMIN' as UserRole, active: true };
                await setDoc(adminDocRef, updatedAdmin, { merge: true });
                setCurrentUser(updatedAdmin);
              } else {
                setCurrentUser({ ...adminData, id: adminSnap.id });
              }
              setLoading(false);
              return;
            }
          }

          // 2. Email lookup for existing non-admin profiles
          if (normalizedEmail) {
            console.log("Looking up profile by email:", normalizedEmail);
            const q = query(collection(db, 'trabalhadores'), where('email', '==', normalizedEmail));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              const workerData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Worker;
              console.log("Found worker profile by email:", workerData.id);
              
              if (workerData.id !== user.uid) {
                console.log("Syncing worker profile to UID path:", user.uid);
                try {
                  const syncedProfile = { 
                    ...workerData, 
                    id: user.uid, 
                    syncedFrom: workerData.id,
                    email: normalizedEmail
                  };
                  await setDoc(doc(db, 'trabalhadores', user.uid), syncedProfile);
                  setCurrentUser(syncedProfile);
                } catch (syncErr) {
                  console.error("Sync failed, using existing profile memory:", syncErr);
                  setCurrentUser({ ...workerData, id: user.uid, email: normalizedEmail });
                }
              } else {
                setCurrentUser(workerData);
              }
              setLoading(false);
              return;
            }
          }

          // 3. Fallback to UID lookup
          console.log("Profile not found by email, trying UID direct lookup...");
          const docRef = doc(db, 'trabalhadores', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as Worker;
            console.log("Found worker profile by UID:", docSnap.id);
            setCurrentUser({ ...data, id: docSnap.id });
          } else {
            console.warn("No worker profile found for user:", user.uid);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error loading profile in AuthContext:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const registerWorker = async (data: Partial<Worker>, pass: string) => {
    // To prevent logging out the current admin, we use a secondary Firebase app instance
    try {
      const secondaryAppName = `SecondaryApp-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      let newWorkerId: string;
      try {
        const res = await createUserWithEmailAndPassword(secondaryAuth, data.email!, pass);
        newWorkerId = res.user.uid;
      } catch (authErr: any) {
        // Clean up secondary app even on error
        try { await deleteApp(secondaryApp); } catch(e) {}
        
        if (authErr.code === 'auth/email-already-in-use' || authErr.message?.includes('email-already-in-use')) {
          throw new Error('AUTH_EMAIL_ALREADY_IN_USE');
        }
        throw authErr;
      }
      
      const newWorker: Worker = {
        ...data,
        id: newWorkerId,
        active: true,
        createdAt: Date.now(),
      } as Worker;
      
      await setDoc(doc(db, 'trabalhadores', newWorkerId), newWorker);
      
      // Clean up secondary app
      await deleteApp(secondaryApp);
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : (error.message || '');
      if (msg === 'AUTH_EMAIL_ALREADY_IN_USE' || msg.includes('AUTH_EMAIL_ALREADY_IN_USE')) throw error;
      console.error("Error creating secondary user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, fbUser, loading, login, logout, registerWorker, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
