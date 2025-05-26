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
      {/* Welcome Card - Notion-style clean white */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">
                Hello, {displayName}!
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

      {/* Enhanced Dashboard Widgets - Bigger with full descriptions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Hours Progress - Notion Blue */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
          <div className="text-5xl font-bold mb-3 text-gray-900">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0)}
          </div>
          <div className="text-gray-600 text-base font-medium mb-2">Total Hours</div>
          <div className="text-gray-400 text-sm">Client Contact Sessions</div>
        </div>

        {/* Supervision - Notion Purple */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
          <div className="text-5xl font-bold mb-3 text-gray-900">
            {Math.round(entries?.reduce((sum: number, entry: any) => sum + (entry.supervisionHours || 0), 0) || 0)}
          </div>
          <div className="text-gray-600 text-base font-medium mb-2">Supervision</div>
          <div className="text-gray-400 text-sm">Hours Completed</div>
        </div>

        {/* This Week - Notion Green */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="text-5xl font-bold mb-3 text-gray-900">
            {entries?.filter((entry: any) => {
              const entryDate = new Date(entry.dateOfContact);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate >= weekAgo;
            }).length || 0}
          </div>
          <div className="text-gray-600 text-base font-medium mb-2">This Week</div>
          <div className="text-gray-400 text-sm">Recent Sessions</div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
          <div className="text-5xl font-bold mb-3 text-gray-900">
            {Math.round(((entries?.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0) || 0) / 4000) * 100)}%
          </div>
          <div className="text-gray-600 text-base font-medium mb-2">Progress</div>
          <div className="text-gray-400 text-sm">Toward Licensure Goal</div>
        </div>
      </div>
    </section>
  );
};
