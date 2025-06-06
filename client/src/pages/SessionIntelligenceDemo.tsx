import React from 'react';
import { Brain } from 'lucide-react';
import LiveSessionRecorder from '@/components/session-intelligence/LiveSessionRecorder';

const SessionIntelligenceDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Session Intelligence
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered session recording with real-time analysis and clinical insights
          </p>
        </div>

        {/* Main Recording Interface */}
        <div className="max-w-6xl mx-auto">
          <LiveSessionRecorder />
        </div>
      </div>
    </div>
  );
};

export default SessionIntelligenceDemo;