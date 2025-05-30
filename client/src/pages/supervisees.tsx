import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccountType } from "@/hooks/use-account-type";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ComplianceAlerts } from "@/components/supervision/ComplianceAlerts";
import { AddSuperviseeDialog } from "@/components/supervision/AddSuperviseeDialog";
import { MessagingDialog } from "@/components/supervision/MessagingDialog";
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Bell,
  BarChart3,
  FileText,
  Trash2,
  Mail,
  Phone,
  MoreVertical
} from "lucide-react";

export default function SuperviseesPage() {
  const { permissions, isIndividual } = useAccountType();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch supervisees data
  const { data: apiSupervisees = [], isLoading: loadingSupervisees, refetch: refetchSupervisees } = useQuery({
    queryKey: ['/api/supervisees', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch supervisees');
      return response.json();
    },
    enabled: !!user?.uid && !isIndividual,
  });

  // Fetch compliance data
  const { data: complianceData } = useQuery({
    queryKey: ['/api/supervision/compliance', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervision/compliance/${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch compliance data');
      return response.json();
    },
    enabled: !!user?.uid && !isIndividual,
  });

  // Redirect individual users
  if (isIndividual || !permissions.canManageSupervisees) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Supervisor Features Required</h2>
        <p className="text-muted-foreground mb-4">
          Upgrade to a Supervisor or Enterprise plan to manage supervisees.
        </p>
        <Button>Upgrade Account</Button>
      </div>
    );
  }

  // Use real data from API, fallback to demo data if needed
  const displaySupervisees = apiSupervisees.length > 0 ? apiSupervisees : [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      status: "active",
      licenseStage: "LAC",
      totalHours: 850,
      goalHours: 2000,
      supervisionHours: 45,
      lastEntry: new Date("2024-01-15"),
      riskLevel: "low",
      nextSupervision: new Date("2024-01-20"),
    },
    {
      id: "2", 
      name: "Michael Chen",
      email: "m.chen@email.com",
      status: "active",
      licenseStage: "LAC",
      totalHours: 1650,
      goalHours: 2000,
      supervisionHours: 82,
      lastEntry: new Date("2024-01-14"),
      riskLevel: "medium",
      nextSupervision: new Date("2024-01-18"),
    },
    {
      id: "3",
      name: "Emily Rodriguez", 
      email: "emily.r@email.com",
      status: "active",
      licenseStage: "Student",
      totalHours: 320,
      goalHours: 1000,
      supervisionHours: 18,
      lastEntry: new Date("2024-01-10"),
      riskLevel: "high",
      nextSupervision: new Date("2024-01-16"),
    },
  ];

  const handleDeleteSupervisee = async (superviseeId: string) => {
    setDeletingId(superviseeId);
    try {
      const response = await fetch(`/api/supervisees/${superviseeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove supervisee');
      }

      toast({
        title: "Supervisee removed",
        description: "The supervisee has been removed from your roster.",
      });

      // Refresh the supervisees list
      queryClient.invalidateQueries({ queryKey: ['/api/supervisees'] });
      refetchSupervisees();
    } catch (error) {
      toast({
        title: "Error removing supervisee",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSupervisees = displaySupervisees.filter((supervisee: any) =>
    supervisee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "at-risk": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supervisees</h1>
          <p className="text-muted-foreground">
            Manage and track your supervisees' progress
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Supervisee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displaySupervisees.length}</div>
            <p className="text-xs text-muted-foreground">Active under supervision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervision Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2</div>
            <p className="text-xs text-muted-foreground">Meeting goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search supervisees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Supervisees List */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="supervision">Supervision Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filteredSupervisees.map((supervisee) => (
            <Card key={supervisee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{supervisee.name}</CardTitle>
                    <CardDescription>{supervisee.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(supervisee.status)}>
                      {supervisee.status}
                    </Badge>
                    <Badge variant="outline">{supervisee.licenseStage}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <Progress 
                      value={(supervisee.totalHours / supervisee.goalHours) * 100} 
                      className="mt-1"
                    />
                    <div className="text-sm mt-1">
                      {supervisee.totalHours} / {supervisee.goalHours} hours
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                    <div className={`text-sm font-medium ${getRiskColor(supervisee.riskLevel)}`}>
                      {supervisee.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Next Supervision</div>
                    <div className="text-sm">
                      {supervisee.nextSupervision.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid gap-6">
            {/* Real-time Compliance Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Supervision Compliance Overview
                </CardTitle>
                <CardDescription>
                  Real-time compliance metrics across all supervisees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {complianceData ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round(complianceData.complianceRate * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Compliance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {complianceData.activeSupervisees}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Supervisees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {complianceData.atRiskCount}
                      </div>
                      <div className="text-sm text-muted-foreground">At Risk</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No compliance data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supervision Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Supervision Trends
                </CardTitle>
                <CardDescription>
                  6-month supervision activity and progress trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendsData ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Session Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Sessions:</span>
                          <span className="font-medium">{trendsData.totalSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Hours:</span>
                          <span className="font-medium">{trendsData.totalHours?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Compliance:</span>
                          <span className="font-medium">{trendsData.averageComplianceRate?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recent Activity</h4>
                      <div className="text-sm text-muted-foreground">
                        Supervision activity trends show consistent engagement across all supervisees
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No trend data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supervision">
          {user?.uid && (
            <ComplianceAlerts supervisorId={user.uid} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}