import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sprout } from "lucide-react";

export const SuperhumanLandingPage = () => {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  // Pre-fill email if stored
  useEffect(() => {
    const storedEmail = localStorage.getItem('claritylog_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleGoogleSignup = async () => {
    toast({
      title: "Coming Soon",
      description: "Google sign-up will be available soon. Please use email signup for now.",
    });
  };

  const handleMicrosoftSignup = async () => {
    toast({
      title: "Coming Soon", 
      description: "Microsoft sign-up will be available soon. Please use email signup for now.",
    });
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('claritylog_email', email);
      
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast({
          title: "Welcome to ClarityLog!",
          description: "Your account has been created successfully.",
        });
      } else {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Superhuman-style gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-emerald-900/30" />
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">CLARITYLOG</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Main card */}
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-white mb-2">
                Save 4 hours per person every single week
              </h1>
            </div>

            {/* Social login buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={handleGoogleSignup}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <Button
                onClick={handleMicrosoftSignup}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Sign up with Microsoft
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            {/* Email form */}
            <div className="space-y-4">
              {isSignUp && (
                <Input
                  type="text"
                  placeholder="Full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-xl py-3"
                />
              )}
              
              <Input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-xl py-3"
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-xl py-3"
              />

              {isSignUp && (
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-xl py-3"
                />
              )}

              <Button
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isSignUp ? "Sign up with email" : "Sign in with email"}
              </Button>
            </div>

            {/* Toggle auth mode */}
            <div className="text-center mt-6">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};