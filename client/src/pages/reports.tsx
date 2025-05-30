import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Users,
  Clock,
  Shield,
  CheckCircle
} from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const { permissions, isIndividual } = useAccountType();
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState("3months");
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Redirect individual users
  if (isIndividual || !permissions.canGenerateReports) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Supervisor Features Required</h2>
        <p className="text-muted-foreground mb-4">
          Upgrade to a Supervisor or Enterprise plan to generate reports.
        </p>
        <Button>Upgrade Account</Button>
      </div>
    );
  }

  const { data: supervisees = [], isLoading: loadingSupervisees } = useQuery({
    queryKey: ['/api/supervisees', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch supervisees');
      return response.json();
    },
    enabled: !!user?.uid,
  });

  const generateReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    try {
      toast({
        title: "Generating report...",
        description: "This may take a moment to compile all data.",
      });

      const response = await fetch(`/api/reports/${reportType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          supervisorId: user?.uid, 
          timeframe: selectedTimeframe 
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report generated successfully",
        description: "Your report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports for licensing boards and professional development.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supervisees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {supervisees.filter((s: any) => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compliance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="progress">Progress Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Supervision Compliance Report</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive compliance documentation for licensing boards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Includes supervision hours, session frequency, compliance status, and documentation for all supervisees.
                </div>
                <Button 
                  onClick={() => generateReport('compliance')}
                  disabled={generatingReport === 'compliance'}
                  className="w-full"
                >
                  {generatingReport === 'compliance' ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Compliance Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Individual Supervisee Report</span>
                </CardTitle>
                <CardDescription>
                  Detailed report for specific supervisee progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Generate detailed progress reports for individual supervisees including hours, competencies, and development areas.
                </div>
                <Button 
                  onClick={() => generateReport('individual')}
                  disabled={generatingReport === 'individual'}
                  className="w-full"
                  variant="outline"
                >
                  {generatingReport === 'individual' ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Individual Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span>Progress Overview Report</span>
                </CardTitle>
                <CardDescription>
                  Track supervisee development and milestone achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Comprehensive overview of all supervisee progress, hours tracking, and developmental milestones.
                </div>
                <Button 
                  onClick={() => generateReport('progress')}
                  disabled={generatingReport === 'progress'}
                  className="w-full"
                >
                  {generatingReport === 'progress' ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Progress Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span>Competency Assessment Report</span>
                </CardTitle>
                <CardDescription>
                  Professional competency development tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Detailed competency assessments, skill development progress, and professional growth indicators.
                </div>
                <Button 
                  onClick={() => generateReport('competency')}
                  disabled={generatingReport === 'competency'}
                  className="w-full"
                  variant="outline"
                >
                  {generatingReport === 'competency' ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Competency Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supervision Analytics</CardTitle>
              <CardDescription>
                Data insights and trends across your supervision practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed analytics dashboard coming soon. Track supervision trends, 
                  supervisee progress patterns, and practice insights.
                </p>
                <Button variant="outline">Preview Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}