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
        const normalizedEmail = user.email?.toLowerCase().trim();
        console.log("Auth State Changed for:", normalizedEmail, "UID:", user.uid);
        
        try {
          // 1. Email lookup
          if (normalizedEmail) {
            const q = query(collection(db, 'trabalhadores'), where('email', '==', normalizedEmail));
            const querySnap = await getDocs(q).catch(err => {
              console.error("Firestore getDocs error:", err);
              throw err;
            });
            
            if (!querySnap.empty) {
              const workerData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Worker;
              console.log("Found worker profile by email:", workerData.id);
              
              // Ensure role matches for super admin
              if (normalizedEmail === 'carlostecal35@gmail.com') {
                workerData.role = 'ADMIN';
                workerData.active = true;
                dataService.populateDefaults().catch(err => console.error("Auto-population failed:", err));
              }

              if (workerData.id !== user.uid) {
                console.log("Syncing worker profile to UID path:", user.uid);
                try {
                  const syncedProfile = { 
                    ...workerData, 
                    id: user.uid, 
                    syncedFrom: workerData.id,
                    email: normalizedEmail // Ensure normalized email is saved
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

            // Fallback for special admin bootstrap
            if (normalizedEmail === 'carlostecal35@gmail.com') {
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
              await setDoc(doc(db, 'trabalhadores', user.uid), adminUser);
              console.log("Super admin bootstrapped successfully.");
              
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
          console.log("Profile not found by email, trying UID fallback...");
          const docRef = doc(db, 'trabalhadores', user.uid);
          const docSnap = await getDoc(docRef).catch(err => {
            console.error("Firestore getDoc error:", err);
            throw err;
          });
          
          if (docSnap.exists()) {
            const data = docSnap.data() as Worker;
            console.log("Found worker profile by UID:", docSnap.id);
            setCurrentUser({ ...data, id: docSnap.id });
          } else {
            console.warn("No worker profile found for user:", user.uid);
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
