import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAccountType } from "@/hooks/use-account-type";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AddSuperviseeDialog } from "@/components/supervision/AddSuperviseeDialog";
import { MessagingDialog } from "@/components/supervision/MessagingDialog";
import { 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
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
  const { data: superviseeData = [], isLoading: loadingSupervisees, refetch: refetchSupervisees } = useQuery({
    queryKey: ['/api/supervisees', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch supervisees');
      return response.json();
    },
    enabled: !!user?.uid && !isIndividual,
  });

  // Redirect individual users
  if (isIndividual || !permissions.canManageSupervisees) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Supervisor Features Required</h2>
        <p className="text-muted-foreground mb-4">
          Upgrade to a Supervisor or Enterprise plan to manage supervisees.
        </p>
        <Button>Upgrade Account</Button>
      </div>
    );
  }

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

  const filteredSupervisees = superviseeData.filter((supervisee: any) =>
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

  if (loadingSupervisees) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supervisees Management</h1>
          <p className="text-muted-foreground">
            Manage your supervisees, track their progress, and ensure compliance.
          </p>
        </div>
        <div className="flex space-x-3">
          <MessagingDialog supervisees={superviseeData} />
          <AddSuperviseeDialog onSuperviseeAdded={refetchSupervisees} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superviseeData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {superviseeData.filter((s: any) => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {superviseeData.filter((s: any) => s.nextSupervision).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {superviseeData.filter((s: any) => s.complianceStatus === 'overdue').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="supervision">Supervision Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search supervisees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Supervisees List */}
          <div className="space-y-4">
            {filteredSupervisees.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No supervisees found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No supervisees match your search." : "Add your first supervisee to get started."}
                  </p>
                  <AddSuperviseeDialog onSuperviseeAdded={refetchSupervisees} />
                </CardContent>
              </Card>
            ) : (
              filteredSupervisees.map((supervisee: any) => (
                <Card key={supervisee.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-lg">{supervisee.name}</h3>
                          <Badge className={getStatusColor(supervisee.status)}>
                            {supervisee.status}
                          </Badge>
                          <Badge variant="outline">
                            {supervisee.licenseLevel || supervisee.licenseStage}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Contact</p>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{supervisee.email}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {supervisee.totalHours || 0}h / {supervisee.goalHours || 2000}h
                              </span>
                            </div>
                            <Progress 
                              value={((supervisee.totalHours || 0) / (supervisee.goalHours || 2000)) * 100} 
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Last Session</p>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {supervisee.lastEntry 
                                  ? new Date(supervisee.lastEntry).toLocaleDateString()
                                  : 'No sessions yet'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <MessagingDialog 
                          supervisees={superviseeData} 
                          preselectedRecipient={supervisee.id}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSupervisee(supervisee.id)}
                          disabled={deletingId === supervisee.id}
                        >
                          {deletingId === supervisee.id ? (
                            <LoadingSpinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="supervision">
          <Card>
            <CardHeader>
              <CardTitle>Supervision Sessions</CardTitle>
              <CardDescription>
                Track and schedule supervision sessions with your supervisees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Supervision Calendar</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage supervision sessions for all supervisees.
                </p>
                <Button>View Calendar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Supervision Reports</CardTitle>
              <CardDescription>
                Generate compliance and progress reports for your supervisees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-2">Compliance Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate comprehensive compliance reports for licensing boards.
                  </p>
                  <Button variant="outline">Generate Report</Button>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-2">Progress Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track supervisee progress and identify areas for development.
                  </p>
                  <Button variant="outline">Generate Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}