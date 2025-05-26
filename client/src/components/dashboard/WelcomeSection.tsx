import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";

export const WelcomeSection = () => {
  const { user, userProfile } = useAuth();
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
    
    // Contextual messages based on user activity and time
    let message = "";
    
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
      {/* Welcome Card - Notion-style clean white */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">
                {getIntelligentGreeting()}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {entries?.length || 0}
              </div>
              <div className="text-gray-500 text-xs font-medium">Sessions logged</div>
            </div>
          </div>
          
          <p className="text-gray-700 text-base mb-6 max-w-md font-medium">
            {personalizedMessage}
          </p>
          
          <Link href="/add-entry">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl px-6 py-2.5 text-sm font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log New Session
            </Button>
          </Link>
        </div>
        
        {/* Subtle decorative elements */}
        <div className="absolute right-4 top-4 w-24 h-24 bg-gray-50 rounded-full"></div>
        <div className="absolute right-8 bottom-8 w-16 h-16 bg-gray-100 rounded-full"></div>
      </div>

      {/* Dashboard Widgets - Slightly Smaller */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hours Progress - Notion Blue */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">

          <div className="text-3xl font-bold mb-2 text-gray-900">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0)}
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">Total Hours</div>
          <div className="text-gray-400 text-xs">Client Contact Sessions</div>
        </div>

        {/* Supervision - Notion Purple */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">

          <div className="text-3xl font-bold mb-2 text-gray-900">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.supervisionHours || 0), 0) || 0)}
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">Supervision</div>
          <div className="text-gray-400 text-xs">Hours Completed</div>
        </div>

        {/* This Week - Notion Green */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">

          <div className="text-3xl font-bold mb-2 text-gray-900">
            {entries?.filter((entry: any) => {
              const entryDate = new Date(entry.dateOfContact);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate >= weekAgo;
            }).length || 0}
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">This Week</div>
          <div className="text-gray-400 text-xs">Recent Sessions</div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">

          <div className="text-3xl font-bold mb-2 text-gray-900">
            {Math.round(((entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0) / 4000) * 100)}%
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">Progress</div>
          <div className="text-gray-400 text-xs">Toward Licensure Goal</div>
        </div>
      </div>
    </section>
  );
};
