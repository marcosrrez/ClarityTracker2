import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";

export const WelcomeSection = () => {
  const { userProfile } = useAuth();
  const { data: entries = [] } = useLogEntries();
  const [personalizedMessage, setPersonalizedMessage] = useState("");

  const displayName = userProfile?.preferredName || "there";
  
  useEffect(() => {
    generatePersonalizedWelcome();
  }, [entries, userProfile]);

  const generatePersonalizedWelcome = () => {
    const sessionCount = entries.length;
    const totalHours = entries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
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
      {/* Warm, hospitable welcome with AI personalization */}
      <div className="ive-card bg-gradient-to-br from-primary/6 via-background to-accent/4 border-primary/10 overflow-hidden">
        <div className="p-10">
          <div className="flex items-start space-x-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/15 to-accent/10 rounded-3xl flex items-center justify-center ive-hover-lift ive-scale shadow-lg">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
                {new Date().getHours() < 12 ? 'Good morning' : 
                 new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {displayName}! 👋
              </h1>
              <p className="text-xl text-muted-foreground/90 font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="mb-10">
            <p className="text-xl text-foreground/90 leading-relaxed font-medium">
              {personalizedMessage}
            </p>
          </div>
          
          <Link href="/add-entry">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ive-scale ive-focus rounded-2xl"
            >
              <Plus className="h-6 w-6 mr-3" />
              Log New Session
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
