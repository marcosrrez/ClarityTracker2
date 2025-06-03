import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { useLogEntries } from "@/hooks/use-firestore";
import { QuickLogWidget } from "@/components/entries/QuickLogWidget";

export const WelcomeSection = () => {
  const { user, userProfile } = useAuth();
  const { accountType } = useAccountType();
  const { entries } = useLogEntries();
  const [personalizedMessage, setPersonalizedMessage] = useState("");

  const displayName = userProfile?.preferredName || user?.displayName || user?.email?.split('@')[0] || "there";
  
  // Get intelligent greeting with time awareness
  const getIntelligentGreeting = () => {
    const timeOfDay = new Date().getHours();
    let timeGreeting = "Good morning";
    if (timeOfDay >= 12 && timeOfDay < 17) timeGreeting = "Good afternoon";
    if (timeOfDay >= 17 && timeOfDay < 22) timeGreeting = "Good evening";
    if (timeOfDay >= 22 || timeOfDay < 6) timeGreeting = "Working late";
    
    return `${timeGreeting}, ${displayName}!`;
  };
  
  useEffect(() => {
    generatePersonalizedWelcome();
  }, [entries, userProfile]);

  const generatePersonalizedWelcome = () => {
    const sessionCount = entries?.length || 0;
    const totalHours = entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0;
    
    // Smart, rule-based personalized messages without greeting duplication
    let message = "";
    
    if (accountType === 'supervisor' || accountType === 'enterprise') {
      message = "Monitor supervisee progress and maintain compliance standards";
    } else if (sessionCount === 0) {
      message = "Ready to start your professional journey? Let's log your first session and begin tracking your path to LPC licensure.";
    } else if (totalHours < 50) {
      message = "You're building momentum! Each session gets you closer to your LPC goals.";
    } else if (totalHours < 500) {
      message = "Great progress! You're developing strong clinical skills and professional habits.";
    } else if (totalHours < 2000) {
      message = "Impressive dedication! You're well on your way to meeting licensure requirements.";
    } else {
      message = "Outstanding commitment! You're approaching licensure readiness with excellent clinical experience.";
    }
    
    setPersonalizedMessage(message);
  };

  return (
    <section className="space-y-6">
      {/* Apple-inspired Welcome Section - Clean & Focused */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 pb-16 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-black dark:text-white tracking-tight">
              {getIntelligentGreeting()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-relaxed max-w-lg">
              {personalizedMessage}
            </p>
          </div>
          
          {/* Primary Progress Ring - Apple Watch Style */}
          <div className="relative">
            <div className="w-24 h-24 relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min((entries?.length || 0) * 1.5, 100)}, 100`}
                  className="transition-all duration-1500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-black dark:text-white">
                  {entries?.length || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  sessions
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Area */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-shrink-0">
            {/* Placeholder space for the overlay widget */}
          </div>
          
          {/* Smart Status Indicators */}
          <div className="flex items-center space-x-4">
            {entries && entries.length > 2 && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Building consistency
                </span>
              </div>
            )}
            
            {/* Weekly progress indicator */}
            {entries && entries.filter((entry: any) => {
              const entryDate = new Date(entry.dateOfContact);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate >= weekAgo;
            }).length >= 2 && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Strong week
              </div>
            )}
          </div>
        </div>
        
        {/* QuickLog Widget as overlay */}
        <div className="absolute bottom-4 left-8">
          <QuickLogWidget />
        </div>
      </div>


    </section>
  );
};
