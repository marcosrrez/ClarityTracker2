import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  TrendingUp, 
  MessageSquare,
  Shield,
  Clock,
  Eye
} from 'lucide-react';

interface EBPRecommendation {
  id: string;
  technique: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  category: 'cognitive' | 'behavioral' | 'humanistic' | 'systemic';
  timing: 'immediate' | 'next_segment' | 'next_session';
}

interface CrisisIndicator {
  id: string;
  type: 'suicide_risk' | 'self_harm' | 'violence_risk' | 'substance_abuse' | 'severe_distress';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  evidence: string[];
  recommendedAction: string;
  supervisorNotified: boolean;
}

interface RealTimeEBPFeedbackProps {
  sessionId: string;
  superviseeId: string;
  isLive?: boolean;
  onCrisisDetected?: (crisis: CrisisIndicator) => void;
}

export const RealTimeEBPFeedback: React.FC<RealTimeEBPFeedbackProps> = ({
  sessionId,
  superviseeId,
  isLive = false,
  onCrisisDetected
}) => {
  const [ebpRecommendations, setEbpRecommendations] = useState<EBPRecommendation[]>([]);
  const [crisisIndicators, setCrisisIndicators] = useState<CrisisIndicator[]>([]);
  const [complianceScore, setComplianceScore] = useState(85);
  const [sessionMetrics, setSessionMetrics] = useState({
    therapeuticAlliance: 78,
    goalProgress: 65,
    clientEngagement: 82,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });

  // Simulate real-time EBP analysis
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Simulate EBP recommendations based on session content
      const newRecommendation: EBPRecommendation = {
        id: `ebp_${Date.now()}`,
        technique: getRandomTechnique(),
        rationale: getRandomRationale(),
        priority: getRandomPriority(),
        category: getRandomCategory(),
        timing: getRandomTiming()
      };

      setEbpRecommendations(prev => {
        const updated = [newRecommendation, ...prev].slice(0, 5);
        return updated;
      });

      // Update compliance score
      setComplianceScore(prev => Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 10)));

      // Update session metrics
      setSessionMetrics(prev => ({
        therapeuticAlliance: Math.max(50, Math.min(100, prev.therapeuticAlliance + (Math.random() - 0.5) * 8)),
        goalProgress: Math.max(40, Math.min(100, prev.goalProgress + (Math.random() - 0.5) * 6)),
        clientEngagement: Math.max(60, Math.min(100, prev.clientEngagement + (Math.random() - 0.5) * 5)),
        riskLevel: prev.riskLevel
      }));

      // Occasionally simulate crisis detection
      if (Math.random() < 0.05) { // 5% chance
        const crisisIndicator: CrisisIndicator = {
          id: `crisis_${Date.now()}`,
          type: getRandomCrisisType(),
          severity: getRandomSeverity(),
          evidence: getRandomEvidence(),
          recommendedAction: getRecommendedAction(),
          supervisorNotified: false
        };

        setCrisisIndicators(prev => [crisisIndicator, ...prev]);
        onCrisisDetected?.(crisisIndicator);
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [isLive, onCrisisDetected]);

  const handleNotifySupervisor = async (crisisId: string) => {
    try {
      const response = await fetch('/api/supervision/crisis-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          superviseeId,
          crisisId,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setCrisisIndicators(prev => 
          prev.map(crisis => 
            crisis.id === crisisId 
              ? { ...crisis, supervisorNotified: true }
              : crisis
          )
        );
      }
    } catch (error) {
      console.error('Failed to notify supervisor:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Session Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Session Metrics
            {isLive && (
              <Badge variant="secondary" className="animate-pulse">
                LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>EBP Compliance</span>
                <span>{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="mb-3" />
              
              <div className="flex justify-between text-sm mb-1">
                <span>Therapeutic Alliance</span>
                <span>{sessionMetrics.therapeuticAlliance}%</span>
              </div>
              <Progress value={sessionMetrics.therapeuticAlliance} className="mb-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Goal Progress</span>
                <span>{sessionMetrics.goalProgress}%</span>
              </div>
              <Progress value={sessionMetrics.goalProgress} className="mb-3" />
              
              <div className="flex justify-between text-sm mb-1">
                <span>Client Engagement</span>
                <span>{sessionMetrics.clientEngagement}%</span>
              </div>
              <Progress value={sessionMetrics.clientEngagement} className="mb-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Indicators */}
      {crisisIndicators.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              Crisis Indicators Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crisisIndicators.map((crisis) => (
                <Alert key={crisis.id} className={getSeverityColor(crisis.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize mb-1">
                          {crisis.type.replace('_', ' ')} - {crisis.severity} severity
                        </div>
                        <div className="text-sm mb-2">
                          Evidence: {crisis.evidence.join(', ')}
                        </div>
                        <div className="text-sm font-medium">
                          Recommended: {crisis.recommendedAction}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {crisis.supervisorNotified ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Supervisor Notified
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleNotifySupervisor(crisis.id)}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Notify Supervisor
                          </Button>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EBP Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Real-Time EBP Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ebpRecommendations.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>EBP recommendations will appear as the session progresses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ebpRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(recommendation.priority)}`} />
                      <span className="font-medium">{recommendation.technique}</span>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.category}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recommendation.timing.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {recommendation.rationale}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Apply Now
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Clock className="h-3 w-3 mr-1" />
                      Save for Later
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions for simulation
function getRandomTechnique(): string {
  const techniques = [
    'Cognitive Restructuring',
    'Behavioral Activation',
    'Mindfulness Integration',
    'Motivational Interviewing',
    'Solution-Focused Questioning',
    'Psychoeducation',
    'Grounding Techniques',
    'Exposure Therapy',
    'EMDR Processing',
    'DBT Skills Training'
  ];
  return techniques[Math.floor(Math.random() * techniques.length)];
}

function getRandomRationale(): string {
  const rationales = [
    'Client showing signs of cognitive distortion patterns',
    'Low motivation detected, behavioral activation recommended',
    'High anxiety levels observed, grounding techniques suggested',
    'Trauma response indicators present',
    'Client expressing readiness for change',
    'Emotional dysregulation patterns identified'
  ];
  return rationales[Math.floor(Math.random() * rationales.length)];
}

function getRandomPriority(): 'high' | 'medium' | 'low' {
  const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  return priorities[Math.floor(Math.random() * priorities.length)];
}

function getRandomCategory(): 'cognitive' | 'behavioral' | 'humanistic' | 'systemic' {
  const categories: ('cognitive' | 'behavioral' | 'humanistic' | 'systemic')[] = 
    ['cognitive', 'behavioral', 'humanistic', 'systemic'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomTiming(): 'immediate' | 'next_segment' | 'next_session' {
  const timings: ('immediate' | 'next_segment' | 'next_session')[] = 
    ['immediate', 'next_segment', 'next_session'];
  return timings[Math.floor(Math.random() * timings.length)];
}

function getRandomCrisisType(): CrisisIndicator['type'] {
  const types: CrisisIndicator['type'][] = [
    'suicide_risk', 'self_harm', 'violence_risk', 'substance_abuse', 'severe_distress'
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomSeverity(): 'low' | 'moderate' | 'high' | 'critical' {
  const severities: ('low' | 'moderate' | 'high' | 'critical')[] = 
    ['low', 'moderate', 'high', 'critical'];
  return severities[Math.floor(Math.random() * severities.length)];
}

function getRandomEvidence(): string[] {
  const evidencePool = [
    'Verbal indicators in transcript',
    'Facial expression analysis',
    'Voice tone patterns',
    'Behavioral markers',
    'Historical risk factors',
    'Session content themes'
  ];
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = evidencePool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRecommendedAction(): string {
  const actions = [
    'Immediate safety assessment required',
    'Supervisor consultation recommended',
    'Safety planning intervention',
    'Risk assessment protocol',
    'Emergency contact procedures',
    'Documentation and follow-up required'
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}