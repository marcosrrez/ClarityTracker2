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
      {/* Jony Ive: Sophisticated warmth through AI personalization */}
      <div className="ive-card bg-gradient-to-br from-primary/4 via-background to-accent/3 border-primary/8 overflow-hidden">
        <div className="p-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-light text-foreground tracking-tight leading-tight">
                {new Date().getHours() < 12 ? 'Good morning' : 
                 new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {displayName}
              </h1>
              <p className="text-lg text-muted-foreground/70 font-light">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="max-w-3xl">
              <p className="text-2xl text-foreground/85 leading-relaxed font-light tracking-wide">
                {personalizedMessage}
              </p>
            </div>
            
            <div className="pt-4">
              <Link href="/add-entry">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-base font-medium shadow-sm hover:shadow-md transition-all duration-300 ive-scale ive-focus rounded-2xl"
                >
                  <Plus className="h-5 w-5 mr-3" />
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
