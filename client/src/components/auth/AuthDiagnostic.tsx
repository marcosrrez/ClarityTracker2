import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AuthDiagnostic = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testEmail] = useState("test@claritylog.net");
  const [testPassword] = useState("testpass123");
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test 1: Firebase Configuration
      addResult("=== FIREBASE CONFIGURATION TEST ===");
      addResult(`API Key: ${import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Present" : "✗ Missing"}`);
      addResult(`Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓ Present" : "✗ Missing"}`);
      addResult(`App ID: ${import.meta.env.VITE_FIREBASE_APP_ID ? "✓ Present" : "✗ Missing"}`);
      
      // Test 2: Firebase Initialization
      addResult("=== FIREBASE INITIALIZATION TEST ===");
      if (auth && auth.app) {
        addResult("✓ Firebase Auth initialized successfully");
        addResult(`Auth Domain: ${auth.app.options.authDomain}`);
        addResult(`Project ID: ${auth.app.options.projectId}`);
      } else {
        addResult("✗ Firebase Auth initialization failed");
      }

      // Test 3: Auth Context
      addResult("=== AUTH CONTEXT TEST ===");
      try {
        const { user, loading } = useAuth();
        addResult(`✓ Auth context accessible`);
        addResult(`User: ${user?.email || "Not signed in"}`);
        addResult(`Loading: ${loading}`);
      } catch (error: any) {
        addResult(`✗ Auth context error: ${error.message}`);
      }

      // Test 4: Direct Firebase Sign-Up Test
      addResult("=== DIRECT FIREBASE SIGNUP TEST ===");
      try {
        // Try to create a test account
        const randomEmail = `test${Date.now()}@claritylog.net`;
        const result = await createUserWithEmailAndPassword(auth, randomEmail, testPassword);
        addResult(`✓ Account creation successful: ${result.user.email}`);
        
        // Clean up - delete the test account
        await result.user.delete();
        addResult("✓ Test account cleaned up");
      } catch (error: any) {
        addResult(`Account creation error: ${error.code} - ${error.message}`);
      }

      // Test 5: Direct Firebase Sign-In Test  
      addResult("=== DIRECT FIREBASE SIGNIN TEST ===");
      try {
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        addResult(`✓ Sign-in successful`);
        await auth.signOut();
        addResult("✓ Sign-out successful");
      } catch (error: any) {
        addResult(`Sign-in error: ${error.code} - ${error.message}`);
      }

      // Test 6: Network Connectivity
      addResult("=== NETWORK CONNECTIVITY TEST ===");
      try {
        const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + import.meta.env.VITE_FIREBASE_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'connectivity-test@example.com',
            password: 'testpass',
            returnSecureToken: true
          })
        });
        
        if (response.status === 400) {
          addResult("✓ Firebase API endpoint reachable");
        } else {
          addResult(`Firebase API response: ${response.status}`);
        }
      } catch (error: any) {
        addResult(`✗ Network connectivity error: ${error.message}`);
      }

    } catch (error: any) {
      addResult(`✗ Diagnostic error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication System Diagnostic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? "Running Diagnostics..." : "Run Full Authentication Audit"}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-medium mb-2">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};