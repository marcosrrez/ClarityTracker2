/**
 * Enhanced Session Analysis Component
 * Integrates Phase 3A enhanced AI analysis into existing session workflow
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  Zap,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useFeatureFlag, ProgressiveFeature } from '@/utils/featureFlags';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedAnalysisProps {
  sessionData: {
    transcript: string;
    duration: number;
    sessionType: string;
    clinicalFocus?: string;
    userId: string;
  };
  onAnalysisComplete?: (analysis: any) => void;
}

interface EnhancedAnalysisResult {
  sessionId: string;
  enhancedInsights: string[];
  reliabilityScore: number;
  processingTime: number;
  fallbackUsed: boolean;
  clinicalRecommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
    recommendations: string[];
  };
}

export function EnhancedSessionAnalysis({ sessionData, onAnalysisComplete }: EnhancedAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<EnhancedAnalysisResult | null>(null);
  const enhancedAI = useFeatureFlag('enhancedAI');

  const enhancedAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/phase3a/analyze-session', {
        method: 'POST',
        body: JSON.stringify({
          userId: sessionData.userId,
          sessionData: {
            transcript: sessionData.transcript,
            duration: sessionData.duration,
            sessionType: sessionData.sessionType,
            clinicalFocus: sessionData.clinicalFocus
          }
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      onAnalysisComplete?.(data);
    }
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <ProgressiveFeature
      flag="enhancedAI"
      fallback={
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4" />
            <span>Enhanced AI analysis available with Phase 3A features</span>
          </div>
        </div>
      }
    >
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Enhanced Analysis
            <Badge variant="secondary" className="ml-2">Phase 3A</Badge>
          </CardTitle>
          <CardDescription>
            Advanced AI processing with automatic fallback protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Get enhanced clinical insights with reliability scoring
            </p>
            <Button 
              onClick={() => enhancedAnalysisMutation.mutate()}
              disabled={enhancedAnalysisMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {enhancedAnalysisMutation.isPending ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Enhance Analysis
                </>
              )}
            </Button>
          </div>

          {analysisResult && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
                <Badge variant={analysisResult.fallbackUsed ? 'secondary' : 'default'}>
                  {analysisResult.fallbackUsed ? 'Fallback Used' : 'Enhanced Processing'}
                </Badge>
              </div>

              {/* Reliability Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Reliability Score</span>
                  <span className="text-green-600 font-medium">{analysisResult.reliabilityScore}%</span>
                </div>
                <Progress value={analysisResult.reliabilityScore} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Processing Time: {analysisResult.processingTime}ms</span>
                  <span>Session ID: {analysisResult.sessionId}</span>
                </div>
              </div>

              {/* Risk Assessment */}
              {analysisResult.riskAssessment && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Risk Assessment</span>
                    <Badge className={getRiskColor(analysisResult.riskAssessment.level)}>
                      {analysisResult.riskAssessment.level.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {analysisResult.riskAssessment.indicators.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Risk Indicators:</span>
                      <ul className="text-sm space-y-1">
                        {analysisResult.riskAssessment.indicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-2">
                            {getRiskIcon(analysisResult.riskAssessment.level)}
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Insights */}
              {analysisResult.enhancedInsights.length > 0 && (
                <div className="space-y-3">
                  <span className="font-medium">Enhanced Insights:</span>
                  <div className="space-y-2">
                    {analysisResult.enhancedInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Recommendations */}
              {analysisResult.clinicalRecommendations?.length > 0 && (
                <div className="space-y-3">
                  <span className="font-medium">Clinical Recommendations:</span>
                  <div className="space-y-2">
                    {analysisResult.clinicalRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-md">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Risk Recommendations */}
              {analysisResult.riskAssessment?.recommendations.length > 0 && (
                <div className="space-y-3">
                  <span className="font-medium">Risk Management Recommendations:</span>
                  <div className="space-y-2">
                    {analysisResult.riskAssessment.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-md">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ProgressiveFeature>
  );
}