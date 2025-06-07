import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";

export const FirebaseConnectivityTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runConnectivityTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    addResult("=== FIREBASE CONNECTIVITY DIAGNOSTIC ===");
    
    // Test 1: Environment Variables
    addResult("1. Environment Configuration:");
    addResult(`API Key: ${import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Present" : "✗ Missing"}`);
    addResult(`Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID || "✗ Missing"}`);
    addResult(`App ID: ${import.meta.env.VITE_FIREBASE_APP_ID ? "✓ Present" : "✗ Missing"}`);
    
    // Test 2: Firebase App Initialization
    addResult("\n2. Firebase App Initialization:");
    try {
      addResult(`Auth Domain: ${auth.app.options.authDomain}`);
      addResult(`Project ID: ${auth.app.options.projectId}`);
      addResult("✓ Firebase app initialized successfully");
    } catch (error: any) {
      addResult(`✗ Firebase initialization failed: ${error.message}`);
    }
    
    // Test 3: Network Connectivity to Firebase
    addResult("\n3. Network Connectivity Tests:");
    
    try {
      addResult("Testing Firebase Auth endpoint...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✓ Firebase Auth API accessible`);
        addResult(`Project ID: ${data.projectId}`);
        addResult(`Authorized Domains: ${data.authorizedDomains?.join(', ')}`);
      } else {
        const errorText = await response.text();
        addResult(`✗ Firebase Auth API error: ${response.status} ${response.statusText}`);
        addResult(`Response: ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addResult(`✗ Firebase request timed out - possible network connectivity issue`);
      } else {
        addResult(`✗ Network error accessing Firebase: ${error.message}`);
      }
    }
    
    // Test 4: Current Domain Check
    addResult("\n4. Domain Authorization Check:");
    const currentDomain = window.location.hostname;
    addResult(`Current domain: ${currentDomain}`);
    addResult(`Full URL: ${window.location.origin}`);
    
    // Test 5: Browser Environment
    addResult("\n5. Browser Environment:");
    addResult(`User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    addResult(`Online: ${navigator.onLine ? "✓ Yes" : "✗ No"}`);
    addResult(`Cookies enabled: ${navigator.cookieEnabled ? "✓ Yes" : "✗ No"}`);
    
    // Test 6: Firebase Auth Configuration
    addResult("\n6. Firebase Auth Configuration:");
    try {
      addResult(`Auth instance: ${auth ? "✓ Available" : "✗ Not available"}`);
      addResult(`Current user: ${auth.currentUser?.email || "None"}`);
      await auth.authStateReady();
      addResult(`Auth ready: ✓ Ready`);
    } catch (error: any) {
      addResult(`✗ Auth configuration error: ${error.message}`);
    }
    
    addResult("\n=== DIAGNOSTIC COMPLETE ===");
    addResult("\nRecommended Actions:");
    addResult("1. Verify Firebase project configuration in console");
    addResult("2. Ensure current domain is in authorized domains list");
    addResult("3. Check network connectivity and firewall settings");
    addResult("4. Verify API keys are correctly configured");
    
    setIsRunning(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Firebase Connectivity Diagnostic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runConnectivityTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? "Running Diagnostic..." : "Run Firebase Connectivity Test"}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-medium mb-2">Diagnostic Results:</h3>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="text-xs font-mono whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};