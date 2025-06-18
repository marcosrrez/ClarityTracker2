import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Users, FileText, Activity, TrendingUp } from 'lucide-react';
import { MinimalistRecorder } from '@/components/session-intelligence/MinimalistRecorder';

const EnhancedSessionRecording: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhanced Clinical Session Recording</h1>
              <p className="text-blue-100 text-lg">
                Real-time clinical intelligence with evidence-based practice analysis and supervision support
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Multi-Modal Analysis
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                EBP Integration
              </Badge>
            </div>
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