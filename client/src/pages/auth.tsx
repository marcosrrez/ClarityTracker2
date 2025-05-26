import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Sprout } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/8 via-background to-accent/6 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo - Apple-inspired rounded design */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary/15 to-accent/10 rounded-3xl shadow-lg">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">ClarityLog</h1>
          <p className="text-muted-foreground/80 mt-3 text-lg leading-relaxed">
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
