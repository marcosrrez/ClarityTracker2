// Direct Firebase authentication test
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  console.log('Testing Firebase Authentication...');
  
  try {
    // Test account creation
    const testEmail = `test${Date.now()}@claritylog.net`;
    const testPassword = 'testpass123';
    
    console.log(`Creating test account: ${testEmail}`);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✓ Account created successfully:', userCredential.user.email);
    
    // Test sign out
    await auth.signOut();
    console.log('✓ Signed out successfully');
    
    // Test sign in
    console.log('Testing sign in...');
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✓ Sign in successful');
    
    // Clean up
    await userCredential.user.delete();
    console.log('✓ Test account deleted');
    
  } catch (error) {
    console.error('Authentication test failed:', error.code, error.message);
  }
}

testAuth();