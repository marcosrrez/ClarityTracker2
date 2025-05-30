import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Clock,
  FileText,
  TrendingUp,
  UserPlus,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SuperviseeData {
  id: string;
  superviseeName: string;
  superviseeEmail: string;
  completedHours: number;
  requiredHours: number;
  status: string;
  startDate: string;
  contractSigned: boolean;
  backgroundCheckCompleted: boolean;
  licenseVerified: boolean;
}

export const SupervisorDashboard = () => {
  const { user, userProfile } = useAuth();
  
  // Fetch supervisees data
  const { data: supervisees = [], isLoading } = useQuery({
    queryKey: ['/api/supervisees', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/supervisees?supervisorId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch supervisees');
      return response.json();
    },
    enabled: !!user?.uid
  });

  const getWelcomeMessage = () => {
    const displayName = userProfile?.displayName || userProfile?.preferredName || user?.displayName || "there";
    const timeOfDay = new Date().getHours();
    let greeting = "Good morning";
    if (timeOfDay >= 12 && timeOfDay < 17) greeting = "Good afternoon";
    if (timeOfDay >= 17) greeting = "Good evening";

    return `${greeting}, ${displayName}!`;
  };

  // Calculate supervision metrics
  const totalSupervisees = supervisees.length;
  const activeSupervisees = supervisees.filter((s: SuperviseeData) => s.status === 'active').length;
  const totalSupervisionHours = supervisees.reduce((sum: number, s: SuperviseeData) => 
    sum + Math.floor(s.completedHours / 40), 0); // Estimate supervision hours (1 hour per 40 client hours)
  
  const complianceIssues = supervisees.filter((s: SuperviseeData) => 
    !s.contractSigned || !s.backgroundCheckCompleted || !s.licenseVerified
  ).length;

  const superviseeProgress = supervisees.map((supervisee: SuperviseeData) => ({
    ...supervisee,
    progressPercentage: Math.round((supervisee.completedHours / supervisee.requiredHours) * 100),
    weeklyTarget: Math.round(supervisee.requiredHours / 104), // 2 years = 104 weeks
    isOnTrack: supervisee.completedHours >= (supervisee.requiredHours * 0.25) // 25% benchmark
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-50 via-white to-purple-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">
                  {getWelcomeMessage()}
                </h1>
                <p className="text-gray-600">
                  Monitor supervisee progress and maintain compliance standards
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{activeSupervisees}</span>
                  <span className="text-gray-500">Active Supervisees</span>
                </div>
                {complianceIssues > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {complianceIssues} Compliance Issues
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supervision Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Total Supervisees</h3>
            <p className="text-2xl font-bold text-blue-600">{totalSupervisees}</p>
            <p className="text-sm text-gray-500">{activeSupervisees} active</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Supervision Hours</h3>
            <p className="text-2xl font-bold text-green-600">{totalSupervisionHours}</p>
            <p className="text-sm text-gray-500">this period</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Compliant</h3>
            <p className="text-2xl font-bold text-purple-600">
              {totalSupervisees - complianceIssues}
            </p>
            <p className="text-sm text-gray-500">of {totalSupervisees} supervisees</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Alerts</h3>
            <p className="text-2xl font-bold text-orange-600">{complianceIssues}</p>
            <p className="text-sm text-gray-500">require attention</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions for Supervisors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle>Supervision Management</CardTitle>
            <CardDescription>
              Manage your supervisees and track their professional development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/supervisees">
                <Card className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Manage Supervisees</h3>
                        <p className="text-sm text-muted-foreground">
                          Add new supervisees and track their progress
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/compliance">
                <Card className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Review Compliance</h3>
                        <p className="text-sm text-muted-foreground">
                          Monitor documentation and requirements
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/reports">
                <Card className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Generate Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Export supervision data and progress reports
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supervisee Progress Overview */}
      {superviseeProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="backdrop-blur-sm bg-white/70">
            <CardHeader>
              <CardTitle>Supervisee Progress</CardTitle>
              <CardDescription>
                Track each supervisee's journey toward licensure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {superviseeProgress.slice(0, 5).map((supervisee: any) => (
                  <div key={supervisee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{supervisee.superviseeName}</h4>
                        <Badge variant={supervisee.isOnTrack ? "default" : "secondary"}>
                          {supervisee.isOnTrack ? "On Track" : "Needs Attention"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{supervisee.completedHours} / {supervisee.requiredHours} hours</span>
                        <span>•</span>
                        <span>{supervisee.progressPercentage}% complete</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={supervisee.progressPercentage} className="h-2" />
                    </div>
                  </div>
                ))}
                
                {superviseeProgress.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/supervisees">
                      <Button variant="outline">
                        View All Supervisees ({superviseeProgress.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {totalSupervisees === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="backdrop-blur-sm bg-white/70">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Start Supervising?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your first supervisee to begin tracking their progress toward LPC licensure 
                and manage compliance requirements.
              </p>
              <Link href="/supervisees">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Supervisee
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};