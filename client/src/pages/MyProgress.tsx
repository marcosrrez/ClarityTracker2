import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  FileText, 
  Award,
  Calendar,
  Download,
  AlertCircle
} from "lucide-react";

interface RequirementStatus {
  id: string;
  name: string;
  required: number;
  completed: number;
  status: "not_started" | "in_progress" | "completed";
  dueDate?: Date;
}

interface CompetencyProgress {
  area: string;
  currentLevel: string;
  targetLevel: string;
  progress: number;
  lastAssessed: Date;
}

export default function MyProgress() {
  const { user } = useAuth();

  const { data: requirements, isLoading: loadingRequirements } = useQuery({
    queryKey: ["/api/requirements", user?.id],
    enabled: !!user?.id,
  });

  const { data: logEntries, isLoading: loadingEntries } = useQuery({
    queryKey: ["/api/log-entries", user?.id],
    enabled: !!user?.id,
  });

  const { data: competencies, isLoading: loadingCompetencies } = useQuery({
    queryKey: ["/api/competency-assessments", user?.id],
    enabled: !!user?.id,
  });

  // Calculate progress metrics
  const totalHours = logEntries?.reduce((sum: number, entry: any) => sum + entry.clientContactHours, 0) || 0;
  const requiredHours = 4000; // Standard LPC requirement
  const progressPercentage = Math.min((totalHours / requiredHours) * 100, 100);

  const mockRequirements: RequirementStatus[] = [
    {
      id: "1",
      name: "Direct Client Contact Hours",
      required: 4000,
      completed: totalHours,
      status: totalHours >= 4000 ? "completed" : totalHours > 0 ? "in_progress" : "not_started"
    },
    {
      id: "2", 
      name: "Supervision Hours",
      required: 100,
      completed: 45,
      status: "in_progress"
    },
    {
      id: "3",
      name: "Professional Development",
      required: 40,
      completed: 28,
      status: "in_progress"
    },
    {
      id: "4",
      name: "Ethics Training",
      required: 6,
      completed: 6,
      status: "completed"
    }
  ];

  const mockCompetencies: CompetencyProgress[] = [
    {
      area: "Assessment & Diagnosis",
      currentLevel: "Advanced Beginner",
      targetLevel: "Competent", 
      progress: 65,
      lastAssessed: new Date(2024, 4, 15)
    },
    {
      area: "Therapeutic Interventions",
      currentLevel: "Competent",
      targetLevel: "Proficient",
      progress: 80,
      lastAssessed: new Date(2024, 4, 20)
    },
    {
      area: "Crisis Management",
      currentLevel: "Novice",
      targetLevel: "Advanced Beginner",
      progress: 40,
      lastAssessed: new Date(2024, 4, 10)
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track your journey toward Licensed Professional Counselor certification
          </p>
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Hours</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalHours}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">of 4,000 required</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <Progress value={progressPercentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {mockRequirements.filter(r => r.status === "completed").length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">requirements</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">In Progress</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {mockRequirements.filter(r => r.status === "in_progress").length}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">requirements</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Competency Avg</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {Math.round(mockCompetencies.reduce((sum, c) => sum + c.progress, 0) / mockCompetencies.length)}%
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">proficiency</p>
              </div>
              <Award className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Licensure Requirements
          </TabsTrigger>
          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Competency Development
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Progress Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Licensure Requirements Progress</CardTitle>
              <CardDescription>
                Track your progress toward meeting all LPC licensure requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRequirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(requirement.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{requirement.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {requirement.completed} of {requirement.required} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={requirement.status === "completed" ? "default" : "secondary"}>
                        {Math.round((requirement.completed / requirement.required) * 100)}%
                      </Badge>
                      <Progress 
                        value={(requirement.completed / requirement.required) * 100} 
                        className="w-24 mt-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competency Development</CardTitle>
              <CardDescription>
                Monitor your growth across key therapeutic competency areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCompetencies.map((competency, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{competency.area}</h4>
                      <Badge variant="outline">{competency.progress}%</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                      <span>Current: {competency.currentLevel}</span>
                      <span>Target: {competency.targetLevel}</span>
                    </div>
                    <Progress value={competency.progress} className="mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last assessed: {competency.lastAssessed.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Timeline</CardTitle>
              <CardDescription>
                Visualize your progress over time and upcoming milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Timeline visualization coming soon</p>
                  <p className="text-sm">Track your progress milestones and predict completion dates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}