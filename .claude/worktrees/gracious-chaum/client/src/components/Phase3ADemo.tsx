/**
 * Phase 3A Feature Demo Component
 * Demonstrates new Phase 3A capabilities with progressive enhancement
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Globe, 
  Shield, 
  Smartphone, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useFeatureFlag, ProgressiveFeature } from '@/utils/featureFlags';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface Phase3AStatus {
  phase: string;
  status: string;
  services: {
    ai: string;
    mobile: string;
    compliance: string;
  };
  timestamp: string;
}

interface EnhancedAnalysis {
  sessionId: string;
  enhancedInsights: string[];
  reliabilityScore: number;
  processingTime: number;
  fallbackUsed: boolean;
}

interface MobileSync {
  syncId: string;
  itemsSynced: number;
  offlineCapable: boolean;
  lastSync: string;
}

interface ComplianceCheck {
  region: string;
  compliant: boolean;
  validationResults: Array<{
    rule: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
  }>;
}

export function Phase3ADemo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRegion, setSelectedRegion] = useState<'US' | 'EU' | 'CA'>('US');
  const [testResults, setTestResults] = useState<{
    enhanced?: EnhancedAnalysis;
    mobile?: MobileSync;
    compliance?: ComplianceCheck;
  }>({});

  // Feature flag checks
  const enhancedAI = useFeatureFlag('enhancedAI');
  const offlineSync = useFeatureFlag('offlineSync');
  const complianceValidation = useFeatureFlag('complianceValidation');

  // Query Phase 3A system status
  const { data: phase3AStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/phase3a/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Enhanced AI Analysis Test
  const enhancedAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/phase3a/analyze-session', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          sessionData: {
            transcript: "Sample session transcript for enhanced analysis testing",
            duration: 45,
            sessionType: "individual",
            clinicalFocus: "anxiety"
          }
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => ({ ...prev, enhanced: data }));
    }
  });

  // Mobile Sync Test
  const mobileSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/phase3a/sync-mobile', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          deviceInfo: {
            platform: 'web',
            version: '1.0.0',
            capabilities: ['offline-storage', 'background-sync']
          },
          pendingItems: [
            { type: 'session', data: { id: 'test-session-1' } },
            { type: 'entry', data: { id: 'test-entry-1' } }
          ]
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => ({ ...prev, mobile: data }));
    }
  });

  // Compliance Check Test
  const complianceCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/phase3a/check-compliance', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          region: selectedRegion,
          operationType: 'data_processing',
          dataTypes: ['session_recordings', 'client_notes', 'personal_information']
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => ({ ...prev, compliance: data }));
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Phase 3A Advanced Features</h2>
          <p className="text-muted-foreground">
            Enhanced AI capabilities, mobile sync, and international compliance
          </p>
        </div>
        <Button 
          onClick={() => refetchStatus()}
          variant="outline"
          size="sm"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Real-time status of Phase 3A foundation services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="font-medium">Enhanced AI</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(phase3AStatus?.services?.ai || 'unknown')}
                <Badge variant={phase3AStatus?.services?.ai === 'operational' ? 'default' : 'secondary'}>
                  {phase3AStatus?.services?.ai || 'Unknown'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">Mobile Sync</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(phase3AStatus?.services?.mobile || 'unknown')}
                <Badge variant={phase3AStatus?.services?.mobile === 'operational' ? 'default' : 'secondary'}>
                  {phase3AStatus?.services?.mobile || 'Unknown'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Compliance</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(phase3AStatus?.services?.compliance || 'unknown')}
                <Badge variant={phase3AStatus?.services?.compliance === 'operational' ? 'default' : 'secondary'}>
                  {phase3AStatus?.services?.compliance || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Demos */}
      <Tabs defaultValue="enhanced-ai" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhanced-ai">Enhanced AI</TabsTrigger>
          <TabsTrigger value="mobile-sync">Mobile Sync</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced-ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Enhanced AI Analysis
              </CardTitle>
              <CardDescription>
                Advanced AI processing with automatic fallback protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressiveFeature
                flag="enhancedAI"
                fallback={
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Enhanced AI features are currently disabled. Contact your administrator for access.
                    </AlertDescription>
                  </Alert>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Test enhanced AI analysis with automatic fallback protection
                    </p>
                    <Button 
                      onClick={() => enhancedAnalysisMutation.mutate()}
                      disabled={enhancedAnalysisMutation.isPending}
                    >
                      {enhancedAnalysisMutation.isPending ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Test Analysis
                        </>
                      )}
                    </Button>
                  </div>

                  {testResults.enhanced && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Analysis Results</span>
                        <Badge variant={testResults.enhanced.fallbackUsed ? 'secondary' : 'default'}>
                          {testResults.enhanced.fallbackUsed ? 'Fallback Used' : 'Enhanced Processing'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Reliability Score</span>
                          <span className="font-medium">{testResults.enhanced.reliabilityScore}%</span>
                        </div>
                        <Progress value={testResults.enhanced.reliabilityScore} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Processing Time</span>
                        <span className="font-medium">{testResults.enhanced.processingTime}ms</span>
                      </div>
                      
                      {testResults.enhanced.enhancedInsights.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-medium text-sm">Enhanced Insights:</span>
                          <ul className="text-sm space-y-1">
                            {testResults.enhanced.enhancedInsights.map((insight, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ProgressiveFeature>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile-sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile Offline Sync
              </CardTitle>
              <CardDescription>
                Offline-first capabilities with background synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressiveFeature
                flag="offlineSync"
                fallback={
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Offline sync features are currently disabled. Contact your administrator for access.
                    </AlertDescription>
                  </Alert>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Test mobile synchronization capabilities
                    </p>
                    <Button 
                      onClick={() => mobileSyncMutation.mutate()}
                      disabled={mobileSyncMutation.isPending}
                    >
                      {mobileSyncMutation.isPending ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Test Sync
                        </>
                      )}
                    </Button>
                  </div>

                  {testResults.mobile && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Sync Results</span>
                        <Badge variant={testResults.mobile.offlineCapable ? 'default' : 'secondary'}>
                          {testResults.mobile.offlineCapable ? 'Offline Ready' : 'Online Only'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Items Synced</span>
                          <p className="font-medium">{testResults.mobile.itemsSynced}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Sync</span>
                          <p className="font-medium">{new Date(testResults.mobile.lastSync).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Mobile sync capability verified
                      </div>
                    </div>
                  )}
                </div>
              </ProgressiveFeature>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                International Compliance
              </CardTitle>
              <CardDescription>
                Automated compliance validation for global markets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressiveFeature
                flag="complianceValidation"
                fallback={
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Compliance validation features are currently disabled. Contact your administrator for access.
                    </AlertDescription>
                  </Alert>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Test compliance validation for different regions
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value as 'US' | 'EU' | 'CA')}
                        className="px-3 py-1 border rounded-md text-sm"
                      >
                        <option value="US">United States (HIPAA)</option>
                        <option value="EU">European Union (GDPR)</option>
                        <option value="CA">Canada (PIPEDA)</option>
                      </select>
                      <Button 
                        onClick={() => complianceCheckMutation.mutate()}
                        disabled={complianceCheckMutation.isPending}
                      >
                        {complianceCheckMutation.isPending ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Check Compliance
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {testResults.compliance && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Compliance Check - {testResults.compliance.region}</span>
                        <Badge variant={testResults.compliance.compliant ? 'default' : 'destructive'}>
                          {testResults.compliance.compliant ? 'Compliant' : 'Issues Found'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {testResults.compliance.validationResults.map((result, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {result.status === 'passed' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : result.status === 'warning' ? (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium">{result.rule}</span>
                            <span className="text-muted-foreground">- {result.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ProgressiveFeature>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Flag Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Feature Availability
          </CardTitle>
          <CardDescription>
            Current status of Phase 3A features for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Enhanced AI</span>
              <Badge variant={enhancedAI ? 'default' : 'secondary'}>
                {enhancedAI ? 'Available' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Offline Sync</span>
              <Badge variant={offlineSync ? 'default' : 'secondary'}>
                {offlineSync ? 'Available' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Compliance Validation</span>
              <Badge variant={complianceValidation ? 'default' : 'secondary'}>
                {complianceValidation ? 'Available' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}