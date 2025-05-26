import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Sprout } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo - Notion-style clean design */}
        <div className="text-center">
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

        {/* Form */}
        {isLogin ? (
          <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
