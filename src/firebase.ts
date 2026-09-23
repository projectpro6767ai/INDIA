/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import firebaseConfigFile from '../firebase-applet-config.json';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyANVAGOFZLSBdQPr7zEg3nY4uoihPo3j5Q",
  authDomain: "india999-e2749.firebaseapp.com",
  projectId: "india999-e2749",
  storageBucket: "india999-e2749.firebasestorage.app",
  messagingSenderId: "724401564319",
  appId: "1:724401564319:web:d8112766f5f562136d10aa",
  measurementId: "G-3RXETJLGR8",
  ...firebaseConfigFile,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId from configuration
export const db = getFirestore(
  app, 
  firebaseConfigFile.firestoreDatabaseId || "ai-studio-indiabiomeexpert-28cd3f17-9da8-4bb9-93a3-d05eb3162a22"
);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Operation Types for error diagnosis
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data Model Interface for Saved Biomes
export interface SavedBiomeDoc {
  id: string;
  userId: string;
  biomeName: string;
  isIndiaLandscape: boolean;
  visualMarkers: string[];
  geographicContext: string;
  environmentalStatus: string;
  imageUrl?: string;
  createdAt: string;
}

// Firestore CRUD operations
export async function saveBiomeRecord(
  biome: Omit<SavedBiomeDoc, 'id' | 'userId' | 'createdAt'>, 
  customId?: string
): Promise<SavedBiomeDoc> {
  if (!auth.currentUser) {
    throw new Error("Please sign in to save biomes to your account.");
  }
  const userId = auth.currentUser.uid;
  const docId = customId || `biome_${Date.now()}`;
  const docPath = `users/${userId}/savedBiomes/${docId}`;
  
  const payload: SavedBiomeDoc = {
    id: docId,
    userId,
    biomeName: biome.biomeName.slice(0, 200),
    isIndiaLandscape: Boolean(biome.isIndiaLandscape),
    visualMarkers: (biome.visualMarkers || []).slice(0, 20),
    geographicContext: biome.geographicContext.slice(0, 5000),
    environmentalStatus: biome.environmentalStatus.slice(0, 5000),
    createdAt: new Date().toISOString(),
  };

  if (biome.imageUrl) {
    payload.imageUrl = biome.imageUrl.slice(0, 2000);
  }

  try {
    await setDoc(doc(db, 'users', userId, 'savedBiomes', docId), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
    throw error;
  }
}

export async function deleteSavedBiomeRecord(docId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("Please sign in to manage your saved biomes.");
  }
  const userId = auth.currentUser.uid;
  const docPath = `users/${userId}/savedBiomes/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedBiomes', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

export function subscribeSavedBiomes(
  userId: string, 
  onUpdate: (items: SavedBiomeDoc[]) => void, 
  onError?: (err: any) => void
) {
  const collectionPath = `users/${userId}/savedBiomes`;
  const q = query(collection(db, 'users', userId, 'savedBiomes'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedBiomeDoc[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as SavedBiomeDoc);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      if (onError) onError(error);
    }
  );
}

// Authentication Helpers
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Force Google to show the account chooser prompt so the user can select their account
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return await signInWithPopup(auth, provider);
}

export async function logOut() {
  return await signOut(auth);
}

export { onAuthStateChanged, type User };

// Analytics Helper
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase Analytics could not be initialized:", err);
    });
}

export function logAnalyticsEvent(eventName: string, eventParams?: Record<string, any>) {
  try {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (err) {
    console.debug("Analytics event log skipped:", err);
  }
}
