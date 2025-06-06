import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Video, Mic, Eye, Shield, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveSessionRecorder from '@/components/session-intelligence/LiveSessionRecorder';

const SessionIntelligenceDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
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

        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <Card className="text-center">
            <CardContent className="pt-6">
              <Mic className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Azure Speech Integration</h3>
              <p className="text-sm text-muted-foreground">
                Real-time transcription with clinical context analysis
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Video className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">Video Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Facial expression and body language analysis
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Eye className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2">Behavioral Patterns</h3>
              <p className="text-sm text-muted-foreground">
                Advanced pattern recognition and engagement tracking
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="font-semibold mb-2">Privacy-First</h3>
              <p className="text-sm text-muted-foreground">
                Client-side processing with HIPAA compliance
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Clinical Decision Support Benefits
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
        </motion.div>

        {/* Technology Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
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
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Shield className="h-5 w-5" />
                Privacy-First Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">Client-Side Processing</h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>• Video analysis runs locally in browser</li>
                    <li>• No raw video data transmitted to servers</li>
                    <li>• Only anonymized behavioral metrics stored</li>
                    <li>• Full user control over data retention</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">HIPAA Compliance</h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>• End-to-end encryption for all communications</li>
                    <li>• Secure Azure Speech Service integration</li>
                    <li>• Audit trail for all data processing</li>
                    <li>• Configurable data retention policies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Interactive Demo
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

              <EnhancedSessionRecorder />
            </CardContent>
          </Card>
        </motion.div>

        {/* Implementation Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Implementation & Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Azure Speech Service Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Seamlessly connects with your existing Azure Speech Service subscription for production-grade transcription with clinical context understanding.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">TensorFlow.js Models</h4>
                  <p className="text-sm text-muted-foreground">
                    Leverages pre-trained models for facial recognition, emotion detection, and pose estimation that run entirely in the client browser for maximum privacy.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Database Schema</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete database schema extensions included for storing session intelligence data, behavioral patterns, and compliance metrics with full HIPAA compliance.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">API Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    RESTful API endpoints for session intelligence data processing, real-time analysis, and multi-modal data fusion with comprehensive error handling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionIntelligenceDemo;