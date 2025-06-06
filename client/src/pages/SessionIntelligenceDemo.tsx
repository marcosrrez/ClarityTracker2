import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, Video, Mic, Eye, Shield, TrendingUp, Users, AlertTriangle, MessageSquare, Star, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { RealTimeEBPFeedback } from '@/components/session-intelligence/RealTimeEBPFeedback';
import { SupervisorReviewPanel } from '@/components/session-intelligence/SupervisorReviewPanel';
import { useAuth } from '@/hooks/use-auth';

const SessionIntelligenceDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);
  const { user } = useAuth();

  const mockSessionData = {
    id: "session-001",
    superviseeId: "supervisee-001", 
    superviseeName: "Sarah Johnson",
    sessionDate: new Date(),
    duration: 50,
    clientInitials: "A.B.",
    complianceScore: 85,
    engagementScore: 78,
    riskIndicators: ["Mild anxiety indicators"],
    strengths: ["Active listening", "Empathy building", "Goal setting"],
    areasForImprovement: ["Cognitive restructuring", "Homework assignment"],
    ebpTechniques: ["CBT", "Motivational Interviewing"],
    clinicalInsights: {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Session Intelligence Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            AI-Powered Multi-Modal Session Analysis with Supervisor Integration
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <Brain className="h-4 w-4 mr-2" />
              Real-time Analysis
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              HIPAA Compliant
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Supervisor Integration
            </Badge>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ebp-feedback">EBP Feedback</TabsTrigger>
              <TabsTrigger value="supervisor-review">Supervisor Review</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      Live Session Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Real-time multi-modal analysis with Azure Speech, facial landmark tracking, and emotion detection.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li>• 68+ facial landmark tracking</li>
                      <li>• Multi-emotion detection</li>
                      <li>• Therapeutic alliance monitoring</li>
                      <li>• Crisis indicator detection</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      EBP Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Evidence-based practice suggestions delivered in real-time during sessions.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li>• CBT technique suggestions</li>
                      <li>• Intervention timing guidance</li>
                      <li>• Therapeutic rapport insights</li>
                      <li>• Session flow optimization</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Supervisor Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive supervision tools for LAC development and mentorship.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li>• Session review panels</li>
                      <li>• Crisis alert notifications</li>
                      <li>• Competency tracking</li>
                      <li>• Development planning</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Session Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Sarah Johnson - Client A.B.</div>
                        <div className="text-sm text-muted-foreground">Today, 50 minutes • CBT Session</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Compliance: 85%</Badge>
                        <Badge variant="outline">Engagement: 78%</Badge>
                        <Button size="sm" onClick={() => setSelectedSessionForReview(mockSessionData)}>
                          Review
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Michael Chen - Client C.D.</div>
                        <div className="text-sm text-muted-foreground">Yesterday, 45 minutes • DBT Session</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Compliance: 92%</Badge>
                        <Badge variant="outline">Engagement: 88%</Badge>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ebp-feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Real-Time Evidence-Based Practice Feedback
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Live EBP recommendations, crisis detection alerts, and therapeutic alliance monitoring
                  </p>
                </CardHeader>
                <CardContent>
                  <RealTimeEBPFeedback
                    sessionId="demo-session"
                    superviseeId={user?.uid || "demo-user"}
                    isLive={true}
                    onCrisisDetected={(crisis) => {
                      console.log('Crisis detected:', crisis);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supervisor-review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Supervisor Review & Feedback System
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Review completed sessions, provide feedback, and track supervisee development
                  </p>
                </CardHeader>
                <CardContent>
                  {selectedSessionForReview ? (
                    <SupervisorReviewPanel
                      sessionAnalysis={selectedSessionForReview}
                      onReviewSubmitted={(review) => {
                        console.log('Review submitted:', review);
                        setSelectedSessionForReview(null);
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Session to Review</h3>
                      <p className="text-muted-foreground mb-6">
                        Choose a completed session from your supervisees to provide feedback and review
                      </p>
                      <Button onClick={() => setSelectedSessionForReview(mockSessionData)}>
                        Review Sample Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">24</CardTitle>
                    <p className="text-sm text-muted-foreground">Sessions This Month</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">87%</CardTitle>
                    <p className="text-sm text-muted-foreground">Avg Compliance Score</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">3</CardTitle>
                    <p className="text-sm text-muted-foreground">Active Supervisees</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">0</CardTitle>
                    <p className="text-sm text-muted-foreground">Crisis Alerts</p>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Supervisee Development Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Sarah Johnson</span>
                        <span className="text-sm text-muted-foreground">85% Overall</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Michael Chen</span>
                        <span className="text-sm text-muted-foreground">92% Overall</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionIntelligenceDemo;