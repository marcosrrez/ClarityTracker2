import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const WelcomeSection = () => {
  const { userProfile } = useAuth();

  const displayName = userProfile?.preferredName || "there";

  return (
    <section className="mb-8">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {displayName}!
          </h2>
          <p className="text-muted-foreground mb-6">
            Ready to log your professional development hours and track your progress toward licensure?
          </p>
          <Link href="/add-entry">
            <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Plus className="h-5 w-5 mr-2" />
              Log Hours
            </Button>
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};
