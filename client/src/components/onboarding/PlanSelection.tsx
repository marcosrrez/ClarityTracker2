import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Building2, User } from "lucide-react";

interface PlanSelectionProps {
  onPlanSelect: (accountType: "individual" | "supervisor" | "enterprise") => void;
  selectedPlan?: string;
}

export const PlanSelection = ({ onPlanSelect, selectedPlan }: PlanSelectionProps) => {
  const [selected, setSelected] = useState<string>(selectedPlan || "");

  const plans = [
    {
      id: "individual",
      name: "Individual Counselor",
      price: "Free Trial",
      period: "",
      description: "Perfect for counselors tracking their own licensure progress",
      icon: <User className="h-6 w-6" />,
      features: [
        "Personal hour tracking",
        "AI-powered insights",
        "Progress analytics",
        "Goal setting & milestones",
        "Mobile quick-entry",
        "Excel import/export"
      ],
      popular: true
    },
    {
      id: "supervisor",
      name: "Clinical Supervisor",
      price: "Early Access",
      period: "",
      description: "For clinical supervisors managing multiple supervisees",
      icon: <Users className="h-6 w-6" />,
      features: [
        "Everything in Individual",
        "Multi-supervisee dashboard",
        "Compliance tracking",
        "Supervision hour calculations",
        "Group supervision tools",
        "Progress reports",
        "AI supervision insights"
      ],
      popular: false
    },
    {
      id: "enterprise",
      name: "Training Program",
      price: "Early Access",
      period: "",
      description: "For training programs and large organizations",
      icon: <Building2 className="h-6 w-6" />,
      features: [
        "Everything in Supervisor",
        "Unlimited supervisees",
        "Admin role management",
        "Bulk user management",
        "Custom reporting",
        "API integration",
        "Priority support"
      ],
      popular: false
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelected(planId);
    onPlanSelect(planId as "individual" | "supervisor" | "enterprise");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your professional needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all ${
              selected === plan.id 
                ? "border-primary shadow-lg scale-105" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                {plan.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full"
                variant={selected === plan.id ? "default" : "outline"}
              >
                {selected === plan.id ? "Selected" : "Choose Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          All features available during early access. No payment required.
        </p>
        <p className="text-xs text-muted-foreground">
          Help us improve ClarityLog by sharing your feedback and suggestions.
        </p>
      </div>
    </div>
  );
};