import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  UserProfile,
  LogEntry,
  InsertLogEntry,
  AppSettings,
  InsightCard,
  InsertInsightCard,
  AiAnalysis,
  InsertAiAnalysis,
  Milestone,
  Feedback,
  InsertFeedback,
} from "@shared/schema";

// Helper function to convert Firestore timestamps to dates
const convertTimestamps = (data: any) => {
  if (!data) return data;
  
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  return converted;
};

// User Profile operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", userId, "profile", "data");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertTimestamps(docSnap.data()) as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const createUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "profile", "data");
    await setDoc(docRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "profile", "data");
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Log Entry operations
export const getLogEntries = async (userId: string): Promise<LogEntry[]> => {
  try {
    const q = query(
      collection(db, "users", userId, "entries"),
      orderBy("dateOfContact", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...convertTimestamps(doc.data()),
    })) as LogEntry[];
  } catch (error) {
    console.error("Error getting log entries:", error);
    throw error;
  }
};

export const createLogEntry = async (userId: string, entry: InsertLogEntry): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "users", userId, "entries"), {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating log entry:", error);
    throw error;
  }
};

export const updateLogEntry = async (userId: string, entryId: string, updates: Partial<InsertLogEntry>): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "entries", entryId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating log entry:", error);
    throw error;
  }
};

export const deleteLogEntry = async (userId: string, entryId: string): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "entries", entryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting log entry:", error);
    throw error;
  }
};

// App Settings operations
export const getAppSettings = async (userId: string): Promise<AppSettings | null> => {
  try {
    const docRef = doc(db, "users", userId, "settings", "appSettings");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertTimestamps(docSnap.data()) as AppSettings;
    }
    return null;
  } catch (error) {
    console.error("Error getting app settings:", error);
    throw error;
  }
};

export const updateAppSettings = async (userId: string, settings: Partial<AppSettings>): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "settings", "appSettings");
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating app settings:", error);
    throw error;
  }
};

// Insight Card operations
export const getInsightCards = async (userId: string): Promise<InsightCard[]> => {
  try {
    const q = query(
      collection(db, "users", userId, "insightCards"),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...convertTimestamps(doc.data()),
    })) as InsightCard[];
  } catch (error) {
    console.error("Error getting insight cards:", error);
    throw error;
  }
};

export const createInsightCard = async (userId: string, card: InsertInsightCard): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "users", userId, "insightCards"), {
      ...card,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating insight card:", error);
    throw error;
  }
};

export const updateInsightCard = async (userId: string, cardId: string, updates: Partial<InsightCard>): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "insightCards", cardId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating insight card:", error);
    throw error;
  }
};

export const deleteInsightCard = async (userId: string, cardId: string): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "insightCards", cardId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting insight card:", error);
    throw error;
  }
};

// AI Analysis operations
export const getAiAnalysis = async (userId: string, logEntryId: string): Promise<AiAnalysis | null> => {
  try {
    const docRef = doc(db, "users", userId, "galleryAnalyses", logEntryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertTimestamps(docSnap.data()) as AiAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Error getting AI analysis:", error);
    throw error;
  }
};

export const createAiAnalysis = async (userId: string, analysis: InsertAiAnalysis): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "galleryAnalyses", analysis.logEntryId);
    await setDoc(docRef, {
      id: analysis.logEntryId,
      userId,
      ...analysis,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating AI analysis:", error);
    throw error;
  }
};

export const deleteAiAnalysis = async (userId: string, logEntryId: string): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "galleryAnalyses", logEntryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting AI analysis:", error);
    throw error;
  }
};

// Milestone operations
export const getMilestones = async (userId: string): Promise<Milestone[]> => {
  try {
    const q = query(collection(db, "users", userId, "milestones"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...convertTimestamps(doc.data()),
    })) as Milestone[];
  } catch (error) {
    console.error("Error getting milestones:", error);
    throw error;
  }
};

export const updateMilestone = async (userId: string, milestoneType: string, achieved: boolean): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, "milestones", milestoneType);
    await setDoc(docRef, {
      id: milestoneType,
      userId,
      type: milestoneType,
      achieved,
      achievedAt: achieved ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating milestone:", error);
    throw error;
  }
};

// Feedback functions
export const createFeedback = async (feedback: InsertFeedback): Promise<string> => {
  try {
    const feedbackData = {
      ...feedback,
      status: "new",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "feedback"), feedbackData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
};

export const getFeedback = async (): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Feedback));
  } catch (error) {
    console.error("Error getting feedback:", error);
    throw error;
  }
};
