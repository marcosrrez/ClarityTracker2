import React from 'react';
import { Brain, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedSessionRecorder } from '@/components/session-intelligence/EnhancedSessionRecorder';

const SessionRecording = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Session Recording
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start recording your therapy session with AI-powered insights
          </p>
        </div>

        {/* Main Recording Interface */}
        <div className="max-w-6xl mx-auto mb-12">
          <EnhancedSessionRecorder />
        </div>

        {/* Privacy Information */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-green-700 dark:text-green-200">
                  All video analysis is performed locally in your browser. No raw video data is transmitted to servers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">Client-Side Processing</h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>• Video analysis runs entirely in browser</li>
                    <li>• No video data leaves your device</li>
                    <li>• Only anonymized metrics are stored</li>
                    <li>• Complete user control over data</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">HIPAA Compliance</h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>• End-to-end encryption for all data</li>
                    <li>• Secure speech service integration</li>
                    <li>• Audit trails for all processing</li>
                    <li>• Professional-grade security standards</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionRecording;