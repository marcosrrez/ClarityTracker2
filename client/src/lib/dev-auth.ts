// Development-only authentication bypass
// This allows testing the application when Firebase has connectivity issues

export interface DevUser {
  uid: string;
  email: string;
  displayName: string;
}

export const DEV_USERS: Record<string, DevUser> = {
  'leadershipcoachmarcos@gmail.com': {
    uid: 'dev-user-1',
    email: 'leadershipcoachmarcos@gmail.com',
    displayName: 'Marcos Leadership Coach'
  },
  'test@claritylog.net': {
    uid: 'dev-user-2', 
    email: 'test@claritylog.net',
    displayName: 'Test User'
  }
};

export const devSignIn = (email: string, password: string): Promise<DevUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = DEV_USERS[email.toLowerCase()];
      if (user && password.length >= 6) {
        console.log('✅ Development authentication successful:', user.email);
        resolve(user);
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 500); // Simulate network delay
  });
};

export const isDevMode = () => {
  return import.meta.env.NODE_ENV === 'development' && 
         import.meta.env.VITE_USE_DEV_AUTH === 'true';
};