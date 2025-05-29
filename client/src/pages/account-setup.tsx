import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanSelection } from "@/components/onboarding/PlanSelection";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function AccountSetupPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const handlePlanSelect = (accountType: "individual" | "supervisor" | "enterprise") => {
    setSelectedPlan(accountType);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast({
        title: "Please select an account type",
        description: "Choose the plan that best fits your professional needs.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserProfile({
        accountType: selectedPlan as any,
        subscriptionTier: "free",
      });

      toast({
        title: "Account setup complete!",
        description: `Your ${selectedPlan} account is ready to use.`,
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Setup failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Complete Your Account Setup</h1>
          <p className="text-muted-foreground">
            Choose your account type to get started with ClarityLog
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Account Created Successfully
            </CardTitle>
            <CardDescription>
              Welcome {userProfile?.preferredName || "to ClarityLog"}! Now let's set up your account based on your professional role.
            </CardDescription>
          </CardHeader>
        </Card>

        <PlanSelection 
          onPlanSelect={handlePlanSelect}
          selectedPlan={selectedPlan}
        />

        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleContinue}
            disabled={!selectedPlan || isUpdating}
            size="lg"
            className="px-8"
          >
            {isUpdating ? "Setting up..." : "Continue to ClarityLog"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            You can change your account type later in Settings
          </p>
        </div>
      </div>
    </div>
  );
}