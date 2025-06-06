import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile, updateUserProfile as updateUserProfileInFirestore } from "@/lib/firestore";
import type { UserProfile } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile from Firestore
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Add detailed logging for debugging
      console.log("Attempting Firebase sign in...", { 
        email, 
        hasPassword: !!password,
        firebaseConfigured: !!auth.app.options.apiKey 
      });
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", result.user.email);
      
      return result;
    } catch (error: any) {
      console.error("Detailed sign in error:", {
        code: error.code,
        message: error.message,
        email,
        firebaseProject: auth.app.options.projectId
      });
      
      // Provide user-friendly error messages
      let userMessage = "Failed to sign in. Please check your credentials.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          userMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          userMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          userMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          userMessage = "This account has been disabled.";
          break;
        case 'auth/too-many-requests':
          userMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/network-request-failed':
          userMessage = "Network error. Please check your connection.";
          break;
        case 'auth/configuration-not-found':
          userMessage = "Authentication service is not properly configured.";
          break;
      }
      
      const enhancedError = new Error(userMessage);
      enhancedError.name = error.code;
      throw enhancedError;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // If this is a new user, ensure they have a display name
      if (result.user && !result.user.displayName && result.user.email) {
        const emailName = result.user.email.split('@')[0];
        const formattedName = emailName
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        
        await updateProfile(result.user, { displayName: formattedName });
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    
    try {
      if (!userProfile) {
        // Create new profile
        await createUserProfile(user.uid, updates);
        const newProfile = await getUserProfile(user.uid);
        setUserProfile(newProfile);
      } else {
        // Update existing profile
        await updateUserProfileInFirestore(user.uid, updates);
        const updatedProfile = await getUserProfile(user.uid);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
