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
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Get last session date
    const lastSession = entries?.length > 0 ? 
      new Date(Math.max(...entries.map((e: any) => new Date(e.dateOfContact).getTime()))) : null;
    
    const daysSinceLastSession = lastSession ? 
      Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    // Time-based greeting
    let greeting = "Good morning";
    if (timeOfDay >= 12 && timeOfDay < 17) greeting = "Good afternoon";
    if (timeOfDay >= 17 && timeOfDay < 22) greeting = "Good evening";
    if (timeOfDay >= 22 || timeOfDay < 6) greeting = "Working late";
    
    // Contextual messages based on user activity, time, and account type
    let message = "";
    
    if (accountType === 'supervisor' || accountType === 'enterprise') {
      // Supervisor-specific messaging focused on managing supervisees
      if (sessionCount === 0) {
        message = `${greeting}! Ready to start managing your supervisees? Begin tracking supervision sessions and supporting their professional development.`;
      } else if (daysSinceLastSession === 0) {
        message = `${greeting}! Great to see you back today. Your continued supervision is helping shape the next generation of counselors.`;
      } else if (daysSinceLastSession === 1) {
        message = `${greeting}! Welcome back from yesterday. Ready to continue your important supervision work?`;
      } else if (daysSinceLastSession && daysSinceLastSession <= 3) {
        message = `${greeting}! Good to have you back. Let's check on your supervisees' progress and schedule any needed sessions.`;
      } else if (daysSinceLastSession && daysSinceLastSession <= 7) {
        message = `${greeting}! It's been a week since your last supervision session. Time to reconnect with your supervisees.`;
      } else if (daysSinceLastSession && daysSinceLastSession > 7) {
        message = `${greeting}! Welcome back! Let's get your supervision schedule back on track.`;
      } else if (isWeekend && timeOfDay < 12) {
        message = `${greeting}! Taking time on the weekend for supervision planning - your supervisees are fortunate to have you.`;
      } else if (timeOfDay >= 22) {
        message = `${greeting}! Working late on supervision? Don't forget to document today's supervisory activities.`;
      } else if (timeOfDay < 6) {
        message = `${greeting}, early bird! Early supervision planning sets a strong foundation for the day.`;
      }
    } else {
      // Individual user messaging focused on personal LPC journey
      if (sessionCount === 0) {
        message = `${greeting}! Ready to start your professional journey? Let's log your first session and begin tracking your path to LPC licensure.`;
      } else if (daysSinceLastSession === 0) {
        message = `${greeting}! Great to see you back today. You're building excellent momentum in your professional development.`;
      } else if (daysSinceLastSession === 1) {
        message = `${greeting}! Welcome back from yesterday. Ready to continue documenting your growth and insights?`;
      } else if (daysSinceLastSession && daysSinceLastSession <= 3) {
        message = `${greeting}! Good to have you back. Let's catch up on your recent sessions and keep that progress flowing.`;
      } else if (daysSinceLastSession && daysSinceLastSession <= 7) {
        message = `${greeting}! It's been a week since your last entry. Ready to document this week's professional experiences?`;
      } else if (daysSinceLastSession && daysSinceLastSession > 7) {
        message = `${greeting}! Welcome back! Let's get your professional development tracking back on track.`;
      } else if (isWeekend && timeOfDay < 12) {
        message = `${greeting}! Taking time on the weekend to reflect on your professional growth - that's dedication!`;
      } else if (timeOfDay >= 22) {
        message = `${greeting}! Burning the midnight oil? Don't forget to capture today's insights while they're fresh.`;
      } else if (timeOfDay < 6) {
        message = `${greeting}, early bird! Starting your day with professional reflection sets a powerful tone.`;
      }
    }
    
    // Add milestone celebrations
    if (totalHours >= 1000 && totalHours < 1010) {
      message += " 🎉 Congratulations on reaching 1,000+ hours - a major milestone in your journey!";
    } else if (totalHours >= 500 && totalHours < 510) {
      message += " 🌟 You've hit 500+ hours! You're making incredible progress toward your goals.";
    } else if (sessionCount % 50 === 0 && sessionCount > 0) {
      message += ` 🎯 Impressive! You've logged ${sessionCount} sessions - your consistency is paying off.`;
    }
    
    // Default fallback if no specific condition matched
    if (!message) {
      message = `${greeting}! Ready to continue your professional development journey?`;
    }
    
    setPersonalizedMessage(message);
  };

  return (
    <section className="space-y-6">
      {/* Apple-inspired Welcome Section - Clean & Focused */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 pb-12 relative overflow-hidden">
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
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
              onClick={() => window.location.href = '/add-entry'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Session (Test)
            </Button>
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
      </div>


    </section>
  );
};
