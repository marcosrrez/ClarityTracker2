import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Users, FileText, Activity, TrendingUp, Shield } from 'lucide-react';
import { MinimalistRecorder } from '@/components/session-intelligence/MinimalistRecorder';

const EnhancedSessionRecording: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Recording</h1>
            <p className="text-muted-foreground">Real-time clinical intelligence and analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              HIPAA Compliant
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Main Recording Interface */}
        <MinimalistRecorder />
      </div>
    </div>
  );
};

export default EnhancedSessionRecording;