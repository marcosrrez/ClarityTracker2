import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Users, BookOpen, AlertCircle } from "lucide-react";
import { useAppSettings } from "@/hooks/use-firestore";

export default function RequirementsPage() {
  const { settings, loading } = useAppSettings();

  const stateRegion = settings?.goals?.stateRegion || "General";

  // Sample requirements - in a real app, this would be fetched based on state/region
  const licensureRequirements = [
    {
      category: "Client Contact Hours",
      icon: Clock,
      requirements: [
        { item: "Total Client Contact Hours", amount: "2,000 hours", description: "Direct and indirect client contact combined" },
        { item: "Direct Client Contact Hours", amount: "1,500 hours minimum", description: "Face-to-face counseling sessions" },
        { item: "Indirect Client Contact Hours", amount: "500 hours maximum", description: "Documentation, treatment planning, consultation" },
      ]
    },
    {
      category: "Supervision",
      icon: Users,
      requirements: [
        { item: "Total Supervision Hours", amount: "200 hours", description: "Individual, dyadic, or group supervision" },
        { item: "Individual Supervision", amount: "100 hours minimum", description: "One-on-one supervision sessions" },
        { item: "Group Supervision", amount: "100 hours maximum", description: "Group supervision sessions (max 6 supervisees)" },
      ]
    },
    {
      category: "Education & Ethics",
      icon: BookOpen,
      requirements: [
        { item: "Master's Degree", amount: "Required", description: "From CACREP-accredited program or equivalent" },
        { item: "Ethics Training", amount: "20 hours", description: "Continuing education in professional ethics" },
        { item: "Crisis Intervention", amount: "6 hours", description: "Training in crisis intervention techniques" },
      ]
    },
  ];

  const renewalRequirements = [
    {
      category: "Continuing Education",
      icon: BookOpen,
      requirements: [
        { item: "Total CE Hours", amount: "24 hours/year", description: "Continuing education hours annually" },
        { item: "Ethics Training", amount: "3 hours/year", description: "Ethics-specific continuing education" },
        { item: "Cultural Competency", amount: "3 hours/year", description: "Multicultural and diversity training" },
      ]
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Requirements</h1>
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Licensing Requirements</h1>
        <p className="text-muted-foreground">
          Professional counselor licensing requirements for {stateRegion}. 
          Please verify current requirements with your state licensing board.
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Important Notice
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Requirements vary by state and are subject to change. Always verify current requirements 
                with your state licensing board. This information is for general guidance only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licensure Requirements */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Initial Licensure Requirements (LAC to LPC)
          </h2>
          <div className="grid gap-6">
            {licensureRequirements.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span>{section.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.requirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium text-foreground">{req.item}</h4>
                            <p className="text-sm text-muted-foreground">{req.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-4 whitespace-nowrap">
                            {req.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Renewal Requirements */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            License Renewal Requirements
          </h2>
          <div className="grid gap-6">
            {renewalRequirements.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span>{section.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.requirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium text-foreground">{req.item}</h4>
                            <p className="text-sm text-muted-foreground">{req.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-4 whitespace-nowrap">
                            {req.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Important links and contacts for licensing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>State Licensing Board:</strong> Contact your state's professional counseling licensing board for official requirements and applications.
            </div>
            <div>
              <strong>CACREP:</strong> Council for Accreditation of Counseling and Related Educational Programs - for degree verification.
            </div>
            <div>
              <strong>National Board for Certified Counselors (NBCC):</strong> Additional certification opportunities and resources.
            </div>
            <div>
              <strong>Professional Associations:</strong> Join state and national counseling associations for support and continuing education opportunities.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
