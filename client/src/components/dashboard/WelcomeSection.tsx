import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const WelcomeSection = () => {
  const { userProfile } = useAuth();

  const displayName = userProfile?.preferredName || "there";

  return (
    <section>
      {/* Jony Ive: Material honesty with emotional warmth */}
      <div className="ive-card bg-gradient-to-r from-primary/8 to-accent/8 border-primary/15 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ive-hover-lift ive-scale">
              <span className="text-xl font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Welcome back, {displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
            Ready to continue your professional development journey?
          </p>
          
          <Link href="/add-entry">
            <Button 
              size="lg" 
              className="ive-button ive-scale ive-focus bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-medium shadow-sm ive-hover-lift"
            >
              <Plus className="h-5 w-5 mr-3" />
              Log New Session
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
