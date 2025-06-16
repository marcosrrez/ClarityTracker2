import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile, updateUserProfile as updateUserProfileInFirestore } from "@/lib/firestore";
import type { UserProfile } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  sessionTimeout: number | null;
  setSessionTimeout: (timeout: number | null) => void;
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
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      
      try {
        setUser(user);
        
        if (user) {
          // Load user profile from Firestore
          try {
            const profile = await getUserProfile(user.uid);
            if (mounted) {
              setUserProfile(profile);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
            if (mounted) {
              setUserProfile(null);
            }
          }
        } else {
          if (mounted) {
            setUserProfile(null);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      // Set Firebase persistence based on user choice
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      // Add detailed logging for debugging
      console.log("Attempting Firebase sign in...", { 
        email, 
        hasPassword: !!password,
        rememberMe,
        persistence: rememberMe ? 'local' : 'session',
        firebaseConfigured: !!auth.app.options.apiKey 
      });
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", result.user.email);
      
      return result;
    } catch (error: any) {
      console.error("Firebase sign in failed:", {
        code: error.code,
        message: error.message,
        email,
        firebaseProject: auth.app.options.projectId
      });
      
      // Check for network connectivity issues with Firebase
      if (error.code === 'auth/network-request-failed') {
        console.log("Firebase connectivity issue detected. Please ensure your Firebase project has proper network access.");
        
        // For development: suggest checking Firebase configuration
        const userMessage = "Unable to connect to Firebase authentication. Please verify your Firebase project configuration and network connectivity.";
        const enhancedError = new Error(userMessage);
        enhancedError.name = error.code;
        throw enhancedError;
      }
      
      // Provide user-friendly error messages for other cases
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
      console.log("Attempting Firebase sign up...", { 
        email, 
        hasPassword: !!password,
        hasDisplayName: !!displayName,
        firebaseConfigured: !!auth.app.options.apiKey 
      });
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful:", result.user.email);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
        console.log("Display name updated:", displayName);
      }
      
      return result;
    } catch (error: any) {
      console.error("Detailed sign up error:", {
        code: error.code,
        message: error.message,
        email,
        firebaseProject: auth.app.options.projectId
      });
      
      // Provide user-friendly error messages
      let userMessage = "Failed to create account. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          userMessage = "An account with this email already exists. Try signing in instead.";
          break;
        case 'auth/invalid-email':
          userMessage = "Invalid email address format.";
          break;
        case 'auth/weak-password':
          userMessage = "Password is too weak. Please use at least 6 characters.";
          break;
        case 'auth/operation-not-allowed':
          userMessage = "Email/password accounts are not enabled. Please contact support.";
          break;
        case 'auth/network-request-failed':
          userMessage = "Network error. Please check your connection and try again.";
          break;
        case 'auth/too-many-requests':
          userMessage = "Too many requests. Please wait before trying again.";
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

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign-in...");
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("Attempting Google popup sign-in...");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful:", result.user.email);
      
      // If this is a new user, ensure they have a display name
      if (result.user && !result.user.displayName && result.user.email) {
        const emailName = result.user.email.split('@')[0];
        const formattedName = emailName
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        
        await updateProfile(result.user, { displayName: formattedName });
        console.log("Updated display name:", formattedName);
      }
    } catch (error: any) {
      console.error("Detailed Google sign-in error:", {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      
      // Enhanced error handling for Google sign-in specific issues
      let userMessage = "Google sign-in failed. Please try email signup instead.";
      
      switch (error.code) {
        case 'auth/popup-blocked':
          userMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.";
          break;
        case 'auth/popup-closed-by-user':
          userMessage = "Sign-in was cancelled. Please try again.";
          break;
        case 'auth/cancelled-popup-request':
          userMessage = "Another sign-in popup is already open. Please close it and try again.";
          break;
        case 'auth/unauthorized-domain':
          userMessage = "This domain is not authorized for Google sign-in. Please use email signup.";
          break;
        case 'auth/operation-not-allowed':
          userMessage = "Google sign-in is not enabled. Please use email signup.";
          break;
        case 'auth/account-exists-with-different-credential':
          userMessage = "An account already exists with this email using a different sign-in method.";
          break;
        case 'auth/network-request-failed':
          userMessage = "Network error. Please check your connection and try again.";
          break;
      }
      
      const enhancedError = new Error(userMessage);
      enhancedError.name = error.code;
      throw enhancedError;
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
    sessionTimeout,
    setSessionTimeout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
