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
      {/* Rams: Pure function over decoration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-medium text-foreground mb-1">
            Welcome back, {displayName}
          </h2>
          <p className="text-muted-foreground">
            Ready to log your professional development?
          </p>
        </div>
        <Link href="/add-entry">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground border-0 px-6 py-2.5 rounded-sm font-medium transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        </Link>
      </div>
    </section>
  );
};
