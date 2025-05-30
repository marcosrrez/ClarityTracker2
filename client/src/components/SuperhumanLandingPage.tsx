import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sprout, Clock, Brain, Users, BarChart3, ArrowRight } from "lucide-react";

export const SuperhumanLandingPage = () => {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showSignupForm, setShowSignupForm] = useState(false);

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

  if (showSignupForm) {
    return (
      <div className="min-h-screen bg-white">
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 text-lg font-semibold tracking-tight">CLARITYLOG</span>
          </div>
        </div>

        {/* Signup form */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Start your journey to LPC licensure
                </h1>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleGoogleSignup}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
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
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                  Sign up with Microsoft
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-4">
                {isSignUp && (
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-gray-300 rounded-xl py-3"
                  />
                )}
                
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 rounded-xl py-3"
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-300 rounded-xl py-3"
                />

                {isSignUp && (
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-gray-300 rounded-xl py-3"
                  />
                )}

                <Button
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isSignUp ? "Sign up with email" : "Sign in with email"}
                </Button>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
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
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 text-lg font-semibold tracking-tight">CLARITYLOG</span>
        </div>
        
        <Button 
          onClick={() => setShowSignupForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Start Now
        </Button>
      </nav>

      {/* Hero section */}
      <div className="relative z-10 container mx-auto px-8 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            The simplest way to track your LPC journey
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Effortlessly log your supervision hours and gain insights that help you become a Licensed Professional Counselor.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              onClick={() => setShowSignupForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg"
            >
              Start Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Partner section */}
      <div className="relative z-10 border-t border-gray-100 py-12 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="text-center">
            <span className="text-gray-500 font-medium mb-6 block">Trusted by counselors at</span>
            <div className="flex items-center justify-center gap-8 text-gray-400">
              <span>Leading Training Programs</span>
              <span>•</span>
              <span>Clinical Supervisors</span>
              <span>•</span>
              <span>Healthcare Organizations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-8">
          <motion.div 
            className="grid grid-cols-3 gap-12 text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4+ hours</div>
              <div className="text-gray-600">Saved per week</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">2 minutes</div>
              <div className="text-gray-600">Average entry time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Compliance tracking</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features section */}
      <div className="relative z-10 py-24 bg-gray-50">
        <div className="container mx-auto px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-xl text-gray-600">Professional tools designed for your licensure journey</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Effortless Hour Tracking",
                description: "Log your supervision and client contact hours with intuitive, streamlined entry forms"
              },
              {
                icon: Brain,
                title: "AI-Powered Insights",
                description: "Get personalized recommendations and growth patterns from your session notes"
              },
              {
                icon: Users,
                title: "Supervision Support",
                description: "Seamless collaboration between supervisors and supervisees with progress monitoring"
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Clear reporting and insights that help you stay on track toward your LPC goals"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 + 0.1 * index }}
                className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};