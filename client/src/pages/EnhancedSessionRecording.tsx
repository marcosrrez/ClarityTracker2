import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Users, FileText, Activity, TrendingUp } from 'lucide-react';
import EnhancedClinicalRecorder from '@/components/session-intelligence/EnhancedClinicalRecorder';

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

      {/* Feature Overview */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle className="ml-2 text-lg">Real-Time Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Live analysis of therapeutic alliance, engagement metrics, and clinical insights during sessions
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Speaker diarization active
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Video emotion analysis
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Therapeutic alliance tracking
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Target className="h-5 w-5 text-green-600" />
              <CardTitle className="ml-2 text-lg">EBP Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evidence-based practice technique detection with adherence scoring and effectiveness analysis
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  CBT/DBT/ACT detection
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Adherence scoring
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Supervisor feedback
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <CardTitle className="ml-2 text-lg">Supervision Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automated supervision markers with transcript linking and professional development insights
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Risk assessment alerts
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Technique feedback
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Ethics monitoring
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitive Advantages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Clinical Intelligence Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-green-600">Beyond Documentation Tools</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Real-time clinical insights during sessions vs post-session notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Multi-modal video analysis with emotion detection and nonverbal cues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Live EBP technique detection with adherence scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Research integration with PubMed access during sessions</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-blue-600">Professional Development Focus</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Supervision markers with transcript linking for targeted feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Competency tracking and progressive skill development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Measurement-based care integration with visual trend analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>AI clinical supervision with Dinger expert guidance</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recording Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">In-Person</h4>
                <p className="text-xs text-muted-foreground">Live session with full video analysis</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Telehealth</h4>
                <p className="text-xs text-muted-foreground">Remote session capture and analysis</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">Upload</h4>
                <p className="text-xs text-muted-foreground">Process recorded audio files</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-medium mb-2">Dictate</h4>
                <p className="text-xs text-muted-foreground">Voice-to-text documentation</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-medium mb-2">Describe</h4>
                <p className="text-xs text-muted-foreground">Manual session summary entry</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Recording Interface */}
        <EnhancedClinicalRecorder />
      </div>
    </div>
  );
};

export default EnhancedSessionRecording;