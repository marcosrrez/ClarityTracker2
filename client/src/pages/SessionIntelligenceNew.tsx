import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Video, Mic, Eye, Shield, TrendingUp, Users, AlertTriangle, Database, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveSessionRecorder from '@/components/session-intelligence/LiveSessionRecorder';
import { SessionManagement } from '@/components/session-intelligence/SessionManagement';
import { RealTimeEBPFeedback } from '@/components/session-intelligence/RealTimeEBPFeedback';
import { SupervisorReviewPanel } from '@/components/session-intelligence/SupervisorReviewPanel';
import { useAuth } from '@/hooks/use-auth';

const SessionIntelligenceNew = () => {
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('live-session');
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);
  const { user } = useAuth();

  const handleSessionComplete = (sessionData: any) => {
    setCurrentSessionData(sessionData);
    setActiveTab('session-management');
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Session Intelligence Enhancement
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Revolutionary multi-modal AI system combining Azure Speech transcription with real-time video analysis 
            for unprecedented clinical decision support and privacy-first behavioral pattern detection.
          </p>
        </motion.div>

        {/* Main Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="live-session" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Live Session Analysis
              </TabsTrigger>
              <TabsTrigger value="ebp-feedback" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                EBP Feedback
              </TabsTrigger>
              <TabsTrigger value="supervisor-review" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Supervisor Review
              </TabsTrigger>
              <TabsTrigger value="session-management" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Session Management
                {currentSessionData && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    New
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-session" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Interactive Session Recording
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Experience the Enhanced Session Recorder with real-time multi-modal analysis
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Demo Mode Active</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          This demonstration uses simulated analysis for privacy. In production, the system integrates with your existing Azure Speech Service for real transcription and clinical analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <LiveSessionRecorder />
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
                      <div className="space-y-2">
                        <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                             onClick={() => setSelectedSessionForReview({
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
                             })}>
                          <div className="text-left">
                            <div className="font-medium">Sarah Johnson - Client A.B.</div>
                            <div className="text-sm text-muted-foreground">Today, 50 minutes • CBT Session</div>
                            <div className="text-sm text-muted-foreground">Compliance: 85% • Engagement: 78%</div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                             onClick={() => setSelectedSessionForReview({
                               id: "session-002",
                               superviseeId: "supervisee-002",
                               superviseeName: "Michael Chen",
                               sessionDate: new Date(Date.now() - 86400000),
                               duration: 45,
                               clientInitials: "C.D.",
                               complianceScore: 92,
                               engagementScore: 88,
                               riskIndicators: [],
                               strengths: ["Rapport building", "Treatment planning", "Crisis assessment"],
                               areasForImprovement: ["Documentation", "Boundary setting"],
                               ebpTechniques: ["DBT", "Mindfulness"],
                               clinicalInsights: {}
                             })}>
                          <div className="text-left">
                            <div className="font-medium">Michael Chen - Client C.D.</div>
                            <div className="text-sm text-muted-foreground">Yesterday, 45 minutes • DBT Session</div>
                            <div className="text-sm text-muted-foreground">Compliance: 92% • Engagement: 88%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="session-management" className="space-y-6">
              <SessionManagement 
                currentSessionData={currentSessionData || undefined}
                onSessionSaved={() => setCurrentSessionData(null)}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Comprehensive Session Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-600">Real-time Insights</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Therapeutic alliance quality assessment</li>
                        <li>• Client engagement level monitoring</li>
                        <li>• Treatment effectiveness indicators</li>
                        <li>• Risk indicator early detection</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">Multi-modal Correlation</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Audio-visual emotional alignment</li>
                        <li>• Incongruence pattern detection</li>
                        <li>• Behavioral marker fusion</li>
                        <li>• Clinical significance scoring</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-purple-600">Professional Standards</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Automated compliance monitoring</li>
                        <li>• Documentation completeness tracking</li>
                        <li>• Ethical guideline adherence</li>
                        <li>• Supervision support analytics</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technology Stack */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Advanced Technology Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Audio Analysis Pipeline
                      </h4>
                      <div className="space-y-2">
                        <Badge variant="outline">Azure Speech Services</Badge>
                        <Badge variant="outline">Real-time Transcription</Badge>
                        <Badge variant="outline">Clinical NLP</Badge>
                        <Badge variant="outline">Sentiment Analysis</Badge>
                        <Badge variant="outline">Risk Detection</Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Intelligence Pipeline
                      </h4>
                      <div className="space-y-2">
                        <Badge variant="outline">TensorFlow.js</Badge>
                        <Badge variant="outline">Facial Recognition</Badge>
                        <Badge variant="outline">Emotion Detection</Badge>
                        <Badge variant="outline">Pose Estimation</Badge>
                        <Badge variant="outline">Engagement Tracking</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Shield className="h-5 w-5" />
                    Privacy-First Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">Client-Side Processing</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Video analysis performed locally in browser</li>
                        <li>• No video data transmitted to servers</li>
                        <li>• Only anonymized behavioral metrics stored</li>
                        <li>• HIPAA-compliant architecture design</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">Data Protection</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• End-to-end encryption for all transmissions</li>
                        <li>• Role-based access control systems</li>
                        <li>• Audit trail for all data access</li>
                        <li>• Automated compliance monitoring</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Tabs>
        </motion.div>

        {/* Floating Action Buttons for Quick Access */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-6 right-6 flex flex-col gap-3"
        >
          <Button 
            size="lg"
            className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
            onClick={() => setActiveTab('live-session')}
          >
            <Video className="h-5 w-5 mr-2" />
            Start Analysis
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionIntelligenceNew;