import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Target, 
  TrendingUp,
  BookOpen,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  Sprout,
  Brain,
  Clock,
  Award,
  Zap,
  CheckCircle
} from "lucide-react";

export const PremiumLandingPage = () => {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  // Premium features showcase - static display
  const features = [
    {
      icon: Brain,
      title: "Session Intelligence",
      description: "Advanced AI analysis that goes beyond transcription to reveal deep therapeutic patterns and insights"
    },
    {
      icon: Users,
      title: "Dual-Portal Collaboration",
      description: "Seamless real-time collaboration between supervisors and supervisees with intelligent progress monitoring"
    },
    {
      icon: Award,
      title: "Professional Development",
      description: "Personalized growth recommendations and competency tracking at every level of your career"
    },
    {
      icon: Zap,
      title: "Transform Your Practice",
      description: "Revolutionary AI-powered tools that help you enhance your therapeutic effectiveness starting today"
    }
  ];

  // Pre-fill email if stored
  useEffect(() => {
    const storedEmail = localStorage.getItem('claritylog_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Auto-suggest display name from email
  useEffect(() => {
    if (email && isSignUp) {
      const emailName = email.split('@')[0];
      const formattedName = emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      setDisplayName(formattedName);
    }
  }, [email, isSignUp]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    localStorage.setItem('claritylog_email', email);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Email auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: "Weak", color: "text-red-500" };
    if (password.length < 10) return { strength: "Good", color: "text-yellow-500" };
    return { strength: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Premium header with logo */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-40 p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sprout className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              ClarityLog
            </span>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-4 py-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              <Zap className="w-3 h-3 mr-1" />
              Professional
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Premium welcome overlay */}
      <AnimatePresence>
        {showWelcomeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setShowWelcomeOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-16 max-w-3xl mx-auto text-center shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 rounded-3xl mx-auto mb-10 flex items-center justify-center shadow-xl"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sprout className="w-16 h-16 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 tracking-tight"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Welcome to ClarityLog
              </motion.h1>
              
              <motion.p 
                className="text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto font-light"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                The simplest way for Licensed Associate Counselors to track their path to LPC licensure. 
                Effortlessly log hours, gain insights, and achieve your professional goals.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <Button
                  onClick={() => setShowWelcomeOverlay(false)}
                  className="px-12 py-6 text-xl font-medium bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Begin Your Journey
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                
                <p className="text-base text-gray-500 font-medium">
                  Join thousands of counselors achieving their professional goals
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - Premium dual panel layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left panel - Features showcase */}
        <motion.div 
          className="flex-1 flex items-center justify-center p-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                Everything you need to succeed
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                A thoughtfully designed platform that grows with you from LAC to LPC
              </p>
            </motion.div>

            {/* Features grid - calm and static */}
            <div className="grid grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    {feature.icon === Clock && <Clock className="w-8 h-8 text-white" />}
                    {feature.icon === Brain && <Brain className="w-8 h-8 text-white" />}
                    {feature.icon === Users && <Users className="w-8 h-8 text-white" />}
                    {feature.icon === BarChart3 && <BarChart3 className="w-8 h-8 text-white" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Trust indicators */}
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Professional Grade</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>Trusted by LACs</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right panel - Authentication */}
        <motion.div 
          className="flex-1 flex items-center justify-center p-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-10">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h3>
                <p className="text-gray-600 font-medium">
                  {isSignUp 
                    ? "Start your professional journey today" 
                    : "Continue your path to licensure"
                  }
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      type="text"
                      placeholder="Your Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-14 text-lg rounded-2xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <p className="text-sm text-gray-500 mt-2 ml-1">
                      This is how you'll appear in ClarityLog
                    </p>
                  </motion.div>
                )}

                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-lg rounded-2xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  required
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-lg rounded-2xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {isSignUp && password && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className={`font-medium ${passwordStrength.color}`}>
                      {passwordStrength.strength}
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 'Weak' ? 'w-1/3 bg-red-400' :
                          passwordStrength.strength === 'Good' ? 'w-2/3 bg-yellow-400' :
                          'w-full bg-green-400'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}

                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 text-lg rounded-2xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      required
                    />
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-center"
                >
                  <p className="text-xs text-gray-500 leading-relaxed">
                    By creating an account, you agree to our Terms of Service and Privacy Policy. 
                    Your data is protected with enterprise-grade security.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};