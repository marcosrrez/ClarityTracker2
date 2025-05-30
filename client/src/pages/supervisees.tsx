import { useState } from "react";
import { useLocation } from "wouter";
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
  const [, setLocation] = useLocation();
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

  // Use only authentic data from API
  const displaySupervisees = apiSupervisees;
  


  // Debug logging
  console.log('API Supervisees:', apiSupervisees);
  console.log('Display Supervisees:', displaySupervisees);

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
    supervisee.superviseeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisee.notes?.toLowerCase().includes(searchTerm.toLowerCase())
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
          {displaySupervisees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Supervisees Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first supervisee to start tracking their progress</p>
                <AddSuperviseeDialog />
              </CardContent>
            </Card>
          ) : (
            displaySupervisees.map((supervisee: any) => (
              <Card 
                key={supervisee.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/supervisee/${supervisee.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {supervisee.superviseeId}
                      </CardTitle>
                      <CardDescription>
                        Started: {new Date(supervisee.startDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={supervisee.status === 'active' ? 'default' : 'secondary'}>
                        {supervisee.status}
                      </Badge>
                      <Badge variant="outline">LAC</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Required Hours</div>
                      <div className="text-2xl font-bold">{supervisee.requiredHours || 4000}</div>
                      <Progress 
                        value={(supervisee.completedHours || 0) / (supervisee.requiredHours || 4000) * 100} 
                        className="mt-1"
                      />
                      <div className="text-sm mt-1">
                        {supervisee.completedHours || 0} / {supervisee.requiredHours || 4000} hours
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Contract Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        {supervisee.contractSigned ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">
                          {supervisee.contractSigned ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Background Check</div>
                      <div className="flex items-center gap-2 mt-1">
                        {supervisee.backgroundCheckCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">
                          {supervisee.backgroundCheckCompleted ? 'Complete' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/supervisee/${supervisee.id}`);
                      }}
                    >
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
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
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Supervision Trends</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed supervision analytics and trends will appear here as you conduct more supervision sessions.
                  </p>
                  <Button variant="outline">View Full Analytics</Button>
                </div>
              </CardContent>
            </Card>
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