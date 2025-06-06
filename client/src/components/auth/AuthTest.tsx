import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AuthTest = () => {
  const [email, setEmail] = useState("test@claritylog.net");
  const [password, setPassword] = useState("testpass123");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testFirebaseAuth = async () => {
    setLoading(true);
    setResult("Testing Firebase authentication...");
    
    try {
      // Test Firebase configuration
      console.log("Firebase config:", {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing",
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "✓ Set" : "✗ Missing"
      });

      // Test authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setResult(`✅ Authentication successful! User: ${userCredential.user.email}`);
      
      // Sign out immediately for testing
      await auth.signOut();
      
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      setResult(`❌ Authentication failed: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firebase Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label>Email:</label>
          <Input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div>
          <label>Password:</label>
          <Input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>
        <Button 
          onClick={testFirebaseAuth} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Testing..." : "Test Firebase Auth"}
        </Button>
        {result && (
          <div className="p-3 bg-gray-50 rounded text-sm">
            <pre>{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};