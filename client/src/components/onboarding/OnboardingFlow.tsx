import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sprout, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const onboardingSchema = z.object({
  preferredName: z.string().min(1, "Preferred name is required"),
  focus: z.enum(["licensure", "renewal"]),
  stateRegion: z.string().min(1, "State/region is required"),
  commitment: z.boolean().refine(val => val === true, "Please commit to regular logging"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 1, title: "Welcome to ClarityLog", description: "Your professional development companion" },
  { id: 2, title: "Set Your Focus", description: "Tell us about your current professional stage" },
  { id: 3, title: "Personalize Your Experience", description: "Help us customize ClarityLog for you" },
  { id: 4, title: "Your Location", description: "Set your state/region for accurate requirements" },
  { id: 5, title: "Make a Commitment", description: "Commit to your professional growth journey" },
];

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { updateUserProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      commitment: false,
    },
  });

  const watchedFocus = watch("focus");
  const watchedCommitment = watch("commitment");

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      await updateUserProfile({
        preferredName: data.preferredName,
        focus: data.focus,
        stateRegion: data.stateRegion,
        mainOnboardingCompleted: true,
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  ClarityLog is designed to help Licensed Associate Counselors track their professional 
                  hours and gain insights on their journey toward full licensure.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-semibold">Track Hours</div>
                    <div className="text-muted-foreground">Log and monitor your professional development</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-semibold">AI Insights</div>
                    <div className="text-muted-foreground">Get intelligent analysis of your progress</div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">What best describes your current focus?</Label>
                <RadioGroup
                  value={watchedFocus}
                  onValueChange={(value) => setValue("focus", value as "licensure" | "renewal")}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="licensure" id="licensure" />
                    <Label htmlFor="licensure" className="flex-1 cursor-pointer">
                      <div className="font-medium">Initial Licensure (LAC to LPC)</div>
                      <div className="text-sm text-muted-foreground">
                        I'm working toward my first professional counselor license
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="renewal" id="renewal" />
                    <Label htmlFor="renewal" className="flex-1 cursor-pointer">
                      <div className="font-medium">Maintaining My License (Renewal)</div>
                      <div className="text-sm text-muted-foreground">
                        I'm already licensed and tracking renewal requirements
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.focus && (
                  <p className="text-sm text-destructive">{errors.focus.message}</p>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferredName" className="text-base font-semibold">
                    What should we call you?
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be displayed throughout the app
                  </p>
                </div>
                <Input
                  id="preferredName"
                  placeholder="Enter your preferred name"
                  {...register("preferredName")}
                  className="text-lg"
                />
                {errors.preferredName && (
                  <p className="text-sm text-destructive">{errors.preferredName.message}</p>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stateRegion" className="text-base font-semibold">
                    What state/region are you in?
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    This helps us provide accurate licensing requirements
                  </p>
                </div>
                <Input
                  id="stateRegion"
                  placeholder="e.g., Texas, California, Ontario"
                  {...register("stateRegion")}
                  className="text-lg"
                />
                {errors.stateRegion && (
                  <p className="text-sm text-destructive">{errors.stateRegion.message}</p>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Regular logging is key to successful professional development tracking. 
                    Are you ready to commit to this journey?
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Checkbox
                    id="commitment"
                    checked={watchedCommitment}
                    onCheckedChange={(checked) => setValue("commitment", !!checked)}
                  />
                  <Label htmlFor="commitment" className="flex-1 cursor-pointer">
                    <div className="font-medium">Yes, I commit to regular logging</div>
                    <div className="text-sm text-muted-foreground">
                      I understand that consistent tracking will help me achieve my professional goals
                    </div>
                  </Label>
                </div>
                {errors.commitment && (
                  <p className="text-sm text-destructive">{errors.commitment.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit">
                  Complete Setup
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
