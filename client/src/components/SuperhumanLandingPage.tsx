import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sprout, Clock, Brain, Users, BarChart3, ArrowRight, Menu, MessageCircle, Calendar, Target, Award, Shield, TrendingUp, UserPlus, Zap } from "lucide-react";

export const SuperhumanLandingPage = () => {
  const { signUp, signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
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
        <div className="absolute top-6 sm:top-8 left-6 sm:left-8 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 text-lg font-semibold tracking-tight">ClarityLog</span>
          </div>
        </div>

        {/* Signup form */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-4 sm:mx-8"
          >
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-2xl">
              <div className="text-center mb-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Start your journey to LPC licensure
                </h1>
              </div>

              <div className="mb-8">
                <Button
                  onClick={handleGoogleSignup}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition-all duration-300 text-lg"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-base">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-5">
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 rounded-2xl py-4 text-lg"
                />

                {isSignUp && (
                  <>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-300 rounded-2xl py-4 text-lg"
                    />

                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-gray-300 rounded-2xl py-4 text-lg"
                    />
                  </>
                )}

                {!isSignUp && (
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 rounded-2xl py-4 text-lg"
                  />
                )}

                <Button
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-4 rounded-2xl font-medium transition-all duration-300 text-lg mt-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  {isSignUp ? "Sign up with email" : "Sign in with email"}
                </Button>
              </div>

              <div className="text-center mt-8 space-y-4">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-gray-500 hover:text-gray-700 text-base transition-colors"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </button>

                {!isSignUp && (
                  <div>
                    <button
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Create scroll-triggered section component
  const ScrollSection = ({ children, className = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Navigation - Superhuman Style */}
      <nav className="relative z-50 flex items-center justify-between p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">ClarityLog</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost"
            className="text-white hover:bg-white/10 hidden sm:inline-flex"
          >
            Features
          </Button>
          <Button 
            variant="ghost"
            className="text-white hover:bg-white/10 hidden sm:inline-flex"
          >
            Pricing
          </Button>
          <Button 
            onClick={() => setShowSignupForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-medium"
          >
            Get Started
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 sm:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 sm:px-8 pt-16 sm:pt-24 pb-32 sm:pb-48">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-purple-200 mb-8">
              <Zap className="w-4 h-4" />
              The simplest counseling journey tracker ever made
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The simplest way to track your counseling journey
          </motion.h1>
          
          <motion.p 
            className="text-xl sm:text-2xl text-purple-100 mb-12 leading-relaxed max-w-3xl mx-auto font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform therapy with AI-powered insights, seamless session collaboration, and effortless progress tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button 
              onClick={() => setShowSignupForm(true)}
              className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>

        {/* Floating Demo Interface */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="max-w-5xl mx-auto mt-16 sm:mt-24"
        >
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl p-8 text-gray-900">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="ml-4 text-sm text-gray-500">ClarityLog Dashboard</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Session logged: 50 minutes</span>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">AI Insight: Client showed significant progress in CBT techniques...</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Progress Analytics</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">1,240 hours</div>
                    <div className="text-sm text-gray-600">Toward LPC licensure</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Session Intelligence Section */}
      <ScrollSection className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Session intelligence
                <br />
                <span className="text-purple-300">beyond transcription</span>
              </h2>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Real-time AI analysis transforms your sessions into actionable insights. Track progress, identify patterns, and enhance therapeutic outcomes with doctoral-level supervision.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-300" />
                  <span>AI-powered session analysis and insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-purple-300" />
                  <span>Real-time transcription and note-taking</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-300" />
                  <span>Progress tracking and outcome measurement</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 text-gray-900">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold">AI Session Analysis</span>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Key Insights</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Client demonstrated improved emotional regulation</li>
                        <li>• Effective use of cognitive restructuring techniques</li>
                        <li>• Recommend exploring family dynamics next session</li>
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 flex-1">
                        <div className="text-sm text-gray-600">Progress Score</div>
                        <div className="text-lg font-bold text-blue-700">8.5/10</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 flex-1">
                        <div className="text-sm text-gray-600">Engagement</div>
                        <div className="text-lg font-bold text-green-700">High</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Dual Portal Collaboration Section */}
      <ScrollSection className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Dual-portal
                <br />
                <span className="text-purple-300">collaboration</span>
              </h2>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Seamless collaboration between therapists and clients. Share session insights, track progress together, and maintain therapeutic alliance with transparent communication.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-300" />
                  <span>Shared session insights and progress tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-300" />
                  <span>HIPAA-compliant secure communication</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-purple-300" />
                  <span>Bidirectional invitation system</span>
                </div>
              </div>
            </div>
            <div className="lg:order-1 relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">Therapist View</div>
                    <div className="space-y-2">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <div className="text-xs text-gray-600">Session Notes</div>
                        <div className="text-sm font-medium">CBT techniques effective</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-2">
                        <div className="text-xs text-gray-600">Next Steps</div>
                        <div className="text-sm font-medium">Homework assignment</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">Client View</div>
                    <div className="space-y-2">
                      <div className="bg-green-100 rounded-lg p-2">
                        <div className="text-xs text-gray-600">My Progress</div>
                        <div className="text-sm font-medium">Feeling more confident</div>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-2">
                        <div className="text-xs text-gray-600">Goals</div>
                        <div className="text-sm font-medium">Practice daily mindfulness</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Bidirectional Invitations Section */}
      <ScrollSection className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Bidirectional
                <br />
                <span className="text-purple-300">invitations</span>
              </h2>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Revolutionary referral system where clients can create standalone accounts for self-reflection, then invite therapists to join. Creates organic referral opportunities both ways.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-purple-300" />
                  <span>Clients invite therapists to join their journey</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-300" />
                  <span>Therapists invite clients for collaboration</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-300" />
                  <span>Organic growth through authentic connections</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 text-gray-900">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">Invitation Flow</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                        <span>Client creates standalone account</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                        <span>Tracks personal growth journey</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                        <span>Invites therapist to collaborate</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                        <span>Shared therapeutic journey begins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Professional Development Section */}
      <ScrollSection className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Professional development
              <br />
              <span className="text-purple-300">at every level</span>
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              From supervision hours to peer consultation, ClarityLog supports your entire professional journey with comprehensive tools and insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Supervision Tracking",
                description: "Effortless hour logging with intelligent categorization and progress monitoring toward licensure requirements."
              },
              {
                icon: Award,
                title: "Competency Development",
                description: "AI-driven insights identify growth areas and recommend targeted development opportunities."
              },
              {
                icon: Users,
                title: "Peer Consultation",
                description: "Connect with colleagues for case consultation and collaborative learning experiences."
              }
            ].map((feature, index) => (
              <div key={feature.title} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-purple-100 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Final CTA Section */}
      <ScrollSection className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Transform your practice
            <br />
            <span className="text-purple-300">starting today</span>
          </h2>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Join thousands of mental health professionals who trust ClarityLog to enhance their practice and support their professional growth.
          </p>
          <Button 
            onClick={() => setShowSignupForm(true)}
            className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-8 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white text-lg font-semibold">ClarityLog</span>
            </div>
            <div className="flex gap-8 text-purple-200">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-purple-300">
            <p>&copy; 2025 ClarityLog. Transforming mental health practice with AI-powered insights.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};