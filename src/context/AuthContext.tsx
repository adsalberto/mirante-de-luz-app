import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
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
        try {
          // 1. Email lookup
          if (user.email) {
            const q = query(collection(db, 'trabalhadores'), where('email', '==', user.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              const workerData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Worker;
              
              // Ensure role matches for super admin
              if (user.email === 'carlostecal35@gmail.com') {
                workerData.role = 'ADMIN';
                workerData.active = true;
                // Aggressive check for sectors even if profile exists
                dataService.populateDefaults().catch(err => console.error("Auto-population failed:", err));
              }

              if (workerData.id !== user.uid) {
                console.log("Syncing worker profile to UID path:", user.uid);
                try {
                  await setDoc(doc(db, 'trabalhadores', user.uid), { 
                    ...workerData, 
                    id: user.uid, 
                    syncedFrom: workerData.id
                  });
                  setCurrentUser({ ...workerData, id: user.uid });
                } catch (syncErr) {
                  console.error("Sync failed, using existing profile:", syncErr);
                  setCurrentUser({ ...workerData, id: user.uid });
                }
              } else {
                setCurrentUser(workerData);
              }
              setLoading(false);
              return;
            }

            // Fallback for special admin bootstrap
            if (user.email === 'carlostecal35@gmail.com') {
              console.log("Bootstrapping super admin profile...");
              const adminUser: Worker = {
                id: user.uid,
                name: user.displayName || 'Administrador Principal',
                email: user.email,
                role: 'ADMIN',
                active: true,
                createdAt: Date.now(),
                acceptedTerm: true,
                termAcceptedAt: Date.now()
              };
              await setDoc(doc(db, 'trabalhadores', user.uid), adminUser);
              console.log("Super admin bootstrapped successfully.");
              
              // Ensure default sectors are present
              try {
                await dataService.populateDefaults();
              } catch (popErr) {
                console.error("Failed to populate default sectors during bootstrap:", popErr);
              }

              setCurrentUser(adminUser);
              setLoading(false);
              return;
            }
          }

          // 2. Fallback to UID lookup
          const docRef = doc(db, 'trabalhadores', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setCurrentUser({ id: docSnap.id, ...docSnap.data() } as Worker);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
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

  const logout = async () => {
    await signOut(auth);
  };

  const registerWorker = async (data: Partial<Worker>, pass: string) => {
    // To prevent logging out the current admin, we use a secondary Firebase app instance
    try {
      const secondaryAppName = `SecondaryApp-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const res = await createUserWithEmailAndPassword(secondaryAuth, data.email!, pass);
      const newWorkerId = res.user.uid;
      
      const newWorker: Worker = {
        ...data,
        id: newWorkerId,
        active: true,
        createdAt: Date.now(),
      } as Worker;
      
      await setDoc(doc(db, 'trabalhadores', newWorkerId), newWorker);
      
      // Clean up secondary app
      await secondaryAuth.signOut();
      await (secondaryApp as any).delete();
    } catch (error) {
      console.error("Error creating secondary user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, fbUser, loading, login, logout, registerWorker }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
