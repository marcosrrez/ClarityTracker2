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
    <section>
      {/* Claude-inspired: Elegant warmth through refined typography */}
      <div className="ive-card bg-gradient-to-br from-slate-50/50 to-blue-50/30 border-slate-200/60 overflow-hidden">
        <div className="p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-medium text-slate-800 tracking-tight leading-snug">
                {new Date().getHours() < 12 ? 'Good morning' : 
                 new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {displayName}
              </h1>
              <p className="text-base text-slate-500 font-normal">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="max-w-2xl">
              <p className="text-lg text-slate-700 leading-relaxed font-normal">
                {personalizedMessage}
              </p>
            </div>
            
            <div className="pt-2">
              <Link href="/add-entry">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200 ive-scale rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Session
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
