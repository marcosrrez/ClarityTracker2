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
      {/* Enhanced Welcome Section - Apple-inspired */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50/30 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-50/20 to-transparent rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-black dark:text-white mb-3 tracking-tight">
                {getWelcomeMessage()}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Your supervisees are making progress
              </p>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-6 mt-4">
                {activeSupervisees > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      {activeSupervisees} active
                    </span>
                  </div>
                )}
                
                {complianceIssues === 0 && totalSupervisees > 0 && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    All compliant
                  </div>
                )}
              </div>
            </div>
            
            {/* Primary Metric - Enhanced circular progress */}
            <div className="relative">
              <div className="w-32 h-32 relative">
                {/* Progress ring */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="314"
                    strokeDashoffset="314"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (activeSupervisees / Math.max(totalSupervisees, 1)) * 314}
                    className="transition-all duration-2000 ease-out drop-shadow-sm"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))'
                    }}
                  />
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-black text-black dark:text-white">
                    {activeSupervisees}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    / {totalSupervisees} supervisees
                  </div>
                </div>
              </div>
              
              {/* Active status */}
              <div className="text-center mt-2">
                <div className="text-sm font-bold text-black dark:text-white">
                  {Math.round((activeSupervisees / Math.max(totalSupervisees, 1)) * 100)}% Active
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick action button */}
          <div className="mt-6 flex justify-start">
            <Link href="/supervisees">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg">
                <Users className="w-4 h-4 mr-2" />
                Manage Supervisees
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Essential Supervisor Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Supervision Capacity & Load */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                {Math.round((totalSupervisionHours / Math.max(totalSupervisees * 2, 1)) * 100)}% capacity
              </span>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {totalSupervisionHours.toFixed(1)}h
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Total Supervision
            </div>
            
            {/* Load distribution */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {activeSupervisees > 0 ? `${(totalSupervisionHours / activeSupervisees).toFixed(1)}h avg/supervisee` : 'No active supervisees'}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            complianceIssues === 0 ? 'from-blue-50/30' : 'from-orange-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                complianceIssues === 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'
              }`}>
                <CheckCircle className={`h-4 w-4 ${
                  complianceIssues === 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              
              <div className={`w-1.5 h-1.5 rounded-full ${
                complianceIssues === 0 ? 'bg-blue-500' : 'bg-orange-500 animate-pulse'
              }`} />
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {totalSupervisees - complianceIssues}/{totalSupervisees}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Compliance Status
            </div>
            
            {/* Compliance breakdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Compliant</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {Math.round(((totalSupervisees - complianceIssues) / Math.max(totalSupervisees, 1)) * 100)}%
                </span>
              </div>
              {complianceIssues > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 dark:text-orange-400">Need attention</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {complianceIssues}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supervisee Progress Summary */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Progress tracking
              </span>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {superviseeProgress.filter(s => s.isOnTrack).length}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              On Track
            </div>
            
            {/* Progress indicators */}
            <div className="flex items-center space-x-1">
              {superviseeProgress.slice(0, 4).map((supervisee, index) => (
                <div 
                  key={supervisee.id}
                  className={`w-2 h-2 rounded-full ${
                    supervisee.isOnTrack ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
              {superviseeProgress.length > 4 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  +{superviseeProgress.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Supervision Schedule */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {activeSupervisees * 1} {/* Assume 1 session per active supervisee per week */}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Weekly Sessions
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeSupervisees > 0 
                ? `${activeSupervisees}h scheduled this week`
                : 'No sessions scheduled'
              }
            </div>
          </div>
        </div>
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