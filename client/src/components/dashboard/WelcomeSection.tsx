import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";

export const WelcomeSection = () => {
  const { userProfile } = useAuth();
  const { entries } = useLogEntries();
  const [personalizedMessage, setPersonalizedMessage] = useState("");

  const displayName = userProfile?.preferredName || "there";
  
  useEffect(() => {
    generatePersonalizedWelcome();
  }, [entries, userProfile]);

  const generatePersonalizedWelcome = () => {
    const sessionCount = entries?.length || 0;
    const totalHours = entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0;
    const timeOfDay = new Date().getHours();
    
    let greeting = "Good morning";
    if (timeOfDay >= 12 && timeOfDay < 17) greeting = "Good afternoon";
    if (timeOfDay >= 17) greeting = "Good evening";
    
    let message = "";
    
    if (sessionCount === 0) {
      message = "Ready to start your professional development journey? Your first session awaits!";
    } else if (sessionCount < 5) {
      message = `You're building great momentum with ${sessionCount} session${sessionCount === 1 ? '' : 's'} logged. Keep up the excellent work!`;
    } else if (totalHours >= 100) {
      message = `Incredible progress! You've logged ${Math.round(totalHours)} hours across ${sessionCount} sessions. You're making real strides toward your goals.`;
    } else {
      message = `You're doing amazing work! ${sessionCount} sessions logged and growing stronger as a counselor every day.`;
    }
    
    setPersonalizedMessage(message);
  };

  return (
    <section className="space-y-6">
      {/* Welcome Card - Inspired by the smart home dashboard */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-1">
                Hello, {displayName}!
              </h1>
              <p className="text-orange-100 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {entries?.length || 0}
              </div>
              <div className="text-orange-100 text-xs">Sessions logged</div>
            </div>
          </div>
          
          <p className="text-white/90 text-base mb-6 max-w-md">
            {personalizedMessage}
          </p>
          
          <Link href="/add-entry">
            <Button 
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl px-6 py-2.5 text-sm font-medium backdrop-blur-sm transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log New Session
            </Button>
          </Link>
        </div>
        
        {/* Decorative illustration space */}
        <div className="absolute right-4 top-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute right-8 bottom-8 w-16 h-16 bg-white/5 rounded-full"></div>
      </div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hours Progress */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0)}
          </div>
          <div className="text-blue-100 text-xs font-medium">Hours Logged</div>
        </div>

        {/* Supervision */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.supervisionHours || 0), 0) || 0)}
          </div>
          <div className="text-purple-100 text-xs font-medium">Supervision</div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">
            {entries?.filter((entry: any) => {
              const entryDate = new Date(entry.dateOfContact);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate >= weekAgo;
            }).length || 0}
          </div>
          <div className="text-green-100 text-xs font-medium">This Week</div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="text-amber-100 text-xs font-medium">AI Ready</div>
        </div>
      </div>
    </section>
  );
};
