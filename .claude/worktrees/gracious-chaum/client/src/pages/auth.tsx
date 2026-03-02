import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Sprout, Brain, Target, TrendingUp, Award, Clock, BarChart3, Lightbulb } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const features = [
    {
      icon: Target,
      title: "Track Your Progress",
      description: "Monitor your journey to LPC licensure with precise hour tracking and milestone celebrations.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized coaching and pattern analysis from your session notes to accelerate your growth.",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Professional Development",
      description: "Build competencies across therapeutic relationships, assessments, and ethical practice.",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: Award,
      title: "Supervision Management",
      description: "Track individual, dyadic, and group supervision hours with automated reminders.",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Features Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-center p-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-50 rounded-full opacity-60"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-purple-50 rounded-full opacity-60"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-green-50 rounded-full opacity-60"></div>
        
        <div className="relative z-10 max-w-lg">
          {/* Logo and branding */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Sprout className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ClarityLog</h1>
              <p className="text-gray-500 font-medium">Your LPC Journey, Simplified</p>
            </div>
          </div>

          {/* Main headline */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              Transform Your Path to 
              <span className="text-blue-600"> Licensed Professional Counselor</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              The intelligent platform designed specifically for Licensed Associate Counselors to track hours, 
              gain insights, and accelerate professional growth with AI-powered coaching.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`p-2 rounded-xl ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats or social proof */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">4000+</div>
              <div className="text-xs text-gray-500 font-medium">Hours Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">200+</div>
              <div className="text-xs text-gray-500 font-medium">Supervision Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-xs text-gray-500 font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo (hidden on large screens) */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border border-gray-200 rounded-3xl shadow-sm">
                <Sprout className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">ClarityLog</h1>
            <p className="text-gray-600 mt-3 text-lg leading-relaxed font-medium">
              Professional development tracking for Licensed Associate Counselors
            </p>
          </div>

          {/* Desktop welcome message */}
          <div className="hidden lg:block text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? "Welcome back!" : "Get started today"}
            </h2>
            <p className="text-gray-600 font-medium">
              {isLogin 
                ? "Sign in to continue your professional journey" 
                : "Join thousands of counselors accelerating their careers"
              }
            </p>
          </div>

          {/* Authentication Forms */}
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
