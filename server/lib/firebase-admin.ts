/**
 * Firebase Admin SDK configuration for server-side operations
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const initFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // For development, we'll use the same config as the client
    // In production, you'd use proper Firebase Admin SDK credentials
    const firebaseConfig = {
      type: "service_account",
      project_id: process.env.VITE_FIREBASE_PROJECT_ID,
      // Add other service account fields as needed
    };
    
    // For now, initialize with minimal config for development
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
};

// Initialize Firebase Admin
initFirebaseAdmin();

// Get Firestore instance
export const adminDb = getFirestore();

/**
 * Get log entries for a user from Firebase
 */
export const getLogEntries = async (userId: string): Promise<any[]> => {
  try {
    const entriesRef = adminDb.collection('users').doc(userId).collection('entries');
    const snapshot = await entriesRef.orderBy('dateOfContact', 'desc').get();
    
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data(),
      // Convert Firestore timestamps to JavaScript dates
      dateOfContact: doc.data().dateOfContact?.toDate() || new Date(),
      supervisionDate: doc.data().supervisionDate?.toDate() || null,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
    
    return entries;
  } catch (error) {
    console.error('Error getting log entries from Firebase:', error);
    return [];
  }
};

/**
 * Get app settings for a user from Firebase
 */
export const getAppSettings = async (userId: string): Promise<any | null> => {
  try {
    const settingsRef = adminDb.collection('users').doc(userId).collection('settings').doc('appSettings');
    const doc = await settingsRef.get();
    
    if (doc.exists) {
      return {
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting app settings from Firebase:', error);
    return null;
  }
};