import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Video,
  Mic,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import LiveSessionRecorder from '@/components/session-intelligence/LiveSessionRecorder';

const SessionRecording = () => {
  const [activeTab, setActiveTab] = useState('record');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Session Intelligence Recording
          </h1>
          <p className="text-muted-foreground mt-2">
            Multi-modal AI analysis with Azure Speech Service and real-time video intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            HIPAA Compliant
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Live Analysis
          </Badge>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <Card className="text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="pt-3 pb-3">
            <Mic className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <h3 className="text-xs font-medium">Azure Speech</h3>
            <p className="text-xs text-muted-foreground">Real-time transcription</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="pt-3 pb-3">
            <Video className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <h3 className="text-xs font-medium">Video Analysis</h3>
            <p className="text-xs text-muted-foreground">Facial expressions & engagement</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="pt-3 pb-3">
            <Brain className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <h3 className="text-xs font-medium">AI Documentation</h3>
            <p className="text-xs text-muted-foreground">80% automation rate</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="pt-3 pb-3">
            <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <h3 className="text-xs font-medium">Compliance AI</h3>
            <p className="text-xs text-muted-foreground">100% note scanning</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="pt-3 pb-3">
            <Shield className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <h3 className="text-xs font-medium">HIPAA Compliant</h3>
            <p className="text-xs text-muted-foreground">SOC 2 certified</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Live Recording
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-6">
          <LiveSessionRecorder />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    80% provider acceptance rate for AI suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    70% reduction in documentation time
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Generates 80% of progress note content
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Multilingual support (100+ languages)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Behavioral health-specific AI models
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Facial expression recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Engagement level monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Body language analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Pose estimation and tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Behavioral pattern detection
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Compliance AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Scans 100% of notes for compliance red flags
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Proactive error detection before fines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Continuous quality improvement (CQI)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Clinical documentation improvement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    90% of notes submitted within 24 hours
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Clinical Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    3-4x better treatment outcomes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Double client engagement rates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    80% reduction in administrative burden
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Multimodal large language model
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    200+ years combined clinical experience
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                All video analysis is performed locally in your browser. No raw video data is transmitted to servers.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300">
                    Client-Side Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>• Video analysis runs entirely in browser</li>
                    <li>• TensorFlow.js models for local processing</li>
                    <li>• No video data leaves your device</li>
                    <li>• Only anonymized metrics are stored</li>
                    <li>• Complete user control over data</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-300">
                    HIPAA Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
                    <li>• End-to-end encryption for all data</li>
                    <li>• Secure Azure Speech Service integration</li>
                    <li>• Audit trails for all processing</li>
                    <li>• Configurable data retention policies</li>
                    <li>• Professional-grade security standards</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                <CardHeader>
                  <CardTitle className="text-purple-700 dark:text-purple-300">
                    Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-200">
                    <li>• Zero-knowledge video processing</li>
                    <li>• Encrypted transcription transmission</li>
                    <li>• Automatic session data purging</li>
                    <li>• User-controlled privacy settings</li>
                    <li>• Transparent data handling</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="text-orange-700 dark:text-orange-300">
                    Professional Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-200">
                    <li>• APA ethical guidelines compliance</li>
                    <li>• State licensing requirement adherence</li>
                    <li>• Professional liability protection</li>
                    <li>• Clinical documentation standards</li>
                    <li>• Supervision and oversight support</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionRecording;