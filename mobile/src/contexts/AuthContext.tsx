import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {Alert} from 'react-native';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            token,
          };
          
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          
          // Set global token for API requests
          global.userToken = token;
        } catch (error) {
          console.error('Error setting user:', error);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
        global.userToken = null;
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      if (userCredential.user) {
        const token = await userCredential.user.getIdToken();
        const userData: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          token,
        };
        
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        global.userToken = token;
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      Alert.alert('Sign In Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      if (userCredential.user && displayName) {
        await userCredential.user.updateProfile({displayName});
      }
      
      if (userCredential.user) {
        const token = await userCredential.user.getIdToken();
        const userData: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.displayName,
          token,
        };
        
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        global.userToken = token;
        
        // Create user profile in your backend
        await createUserProfile(userData);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'Account creation failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Sign Up Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await auth().signOut();
      setUser(null);
      await AsyncStorage.removeItem('user');
      global.userToken = null;
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Password Reset',
        'Password reset email sent! Check your inbox and follow the instructions to reset your password.'
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Password Reset Error', errorMessage);
      throw error;
    }
  };

  const createUserProfile = async (userData: User): Promise<void> => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          createdAt: new Date().toISOString(),
          goals: {
            totalHours: 4000,
            weeklyHours: 20,
          },
          preferences: {
            notifications: true,
            darkMode: false,
          },
        }),
      });

      if (!response.ok) {
        console.error('Failed to create user profile');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};