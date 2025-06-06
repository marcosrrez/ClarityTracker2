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

              <LiveSessionRecorder />
            </CardContent>
          </Card>
        </motion.div>


      </div>
    </div>
  );
};

export default SessionIntelligenceDemo;