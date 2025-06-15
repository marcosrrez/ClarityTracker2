import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Video, Mic, Eye, Shield, TrendingUp, Users, AlertTriangle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveSessionRecorder from '@/components/session-intelligence/LiveSessionRecorder';
import { SessionManagement } from '@/components/session-intelligence/SessionManagement';
import AzureIntegrationStatus from '@/components/session-intelligence/AzureIntegrationStatus';
import LocalVideoAnalysis from '@/components/session-intelligence/LocalVideoAnalysis';

const SessionIntelligenceNew = () => {
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('live-session');

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
              <TabsTrigger value="privacy-test" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Test
                <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700">
                  Local
                </Badge>
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
              <TabsTrigger value="system-overview" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                System Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-session" className="space-y-6">
              <AzureIntegrationStatus />
              
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
                  <LiveSessionRecorder />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy-test" className="space-y-6">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Shield className="h-5 w-5" />
                    Privacy-First Local Processing Test
                  </CardTitle>
                  <p className="text-green-700 dark:text-green-300">
                    Test our new privacy-conscious video analysis using TensorFlow.js and MediaPipe for 100% local processing
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <LocalVideoAnalysis 
                      isRecording={false}
                      videoElement={null}
                      sessionId="privacy-test-session"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Privacy Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2">Azure Cloud Processing</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Video frames sent to Microsoft servers</li>
                        <li>• Advanced clinical-grade AI analysis</li>
                        <li>• Requires internet connection</li>
                        <li>• Per-request API costs</li>
                        <li>• Potential data retention concerns</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-medium text-green-700 mb-2">Local Processing</h4>
                      <ul className="text-sm space-y-1 text-green-600">
                        <li>• All analysis happens on your device</li>
                        <li>• No data transmitted externally</li>
                        <li>• Works offline</li>
                        <li>• No ongoing API costs</li>
                        <li>• Complete privacy protection</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="session-management" className="space-y-6">
              <SessionManagement 
                currentSessionData={currentSessionData || undefined}
                onSessionSaved={() => setCurrentSessionData(null)}
              />
            </TabsContent>

            <TabsContent value="system-overview" className="space-y-6">
              {/* Feature Overview */}
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionIntelligenceNew;