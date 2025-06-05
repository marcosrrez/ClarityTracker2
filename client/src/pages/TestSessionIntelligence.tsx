import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Activity,
  Shield
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const SAMPLE_TRANSCRIPT = `Counselor: Good morning, Sarah. How are you feeling today?

Client: I've been having a really tough week. The anxiety has been overwhelming, especially at work.

Counselor: I can see that's been difficult for you. Can you tell me more about what specifically triggers the anxiety at work?

Client: It's mostly when I have to present to my team. I start thinking everyone will judge me, and then my heart races and I can't focus.

Counselor: That sounds like anticipatory anxiety around social evaluation. Have you noticed any patterns in your thoughts when this happens?

Client: Yeah, I keep thinking "I'm going to mess up" or "Everyone will think I'm incompetent." I know it's not rational, but it feels so real.

Counselor: Those automatic thoughts are very common with social anxiety. Let's try a cognitive restructuring exercise. When you think "I'm going to mess up," what evidence do you have for and against that thought?

Client: Well, I've actually never really messed up a presentation before. My boss even complimented my last one.

Counselor: That's excellent insight. So the evidence suggests your presentations go well. How might we reframe that automatic thought?

Client: Maybe something like "I've prepared well and have succeeded before"?

Counselor: Perfect. That's a much more balanced and evidence-based thought. How does that feel when you say it?

Client: Actually, it does make me feel a bit calmer. Less like I'm doomed to fail.

Counselor: Excellent. Let's practice this technique this week before your next presentation.`;

export default function TestSessionIntelligence() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [duration, setDuration] = useState(50);
  const [userId] = useState('test-user-123');
  const [logEntryId] = useState('test-entry-456');
  const [results, setResults] = useState<any>(null);

  // Session Analysis
  const analyzeSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/session/analyze', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          sessionDuration: duration,
          clientPopulation: 'Adult anxiety disorders',
          counselorExperience: 'LAC in training',
          userId
        })
      });
    },
    onSuccess: (data) => {
      setResults(prev => ({ ...prev, sessionAnalysis: data }));
    }
  });

  // Progress Note Enhancement
  const enhanceNoteMutation = useMutation({
    mutationFn: async () => {
      const sampleNote = "Client presented with anxiety symptoms related to work presentations. Used CBT techniques to address automatic thoughts.";
      
      return await apiRequest('/api/session/progress-note-assist', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          existingNotes: sampleNote,
          sessionAnalysis: results?.sessionAnalysis?.analysis,
          userId
        })
      });
    },
    onSuccess: (data) => {
      setResults(prev => ({ ...prev, noteAssistance: data }));
    }
  });

  // Risk Assessment
  const riskAssessmentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/session/risk-assessment', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          sessionAnalysis: results?.sessionAnalysis?.analysis,
          userId,
          logEntryId
        })
      });
    },
    onSuccess: (data) => {
      setResults(prev => ({ ...prev, riskAssessment: data }));
    }
  });

  // EBP Analysis
  const ebpAnalysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/session/ebp-analysis', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          counselorModalities: ['CBT', 'Mindfulness', 'Person-Centered'],
          userId
        })
      });
    },
    onSuccess: (data) => {
      setResults(prev => ({ ...prev, ebpAnalysis: data }));
    }
  });

  const runAllTests = async () => {
    setResults({});
    analyzeSessionMutation.mutate();
  };

  const isPending = analyzeSessionMutation.isPending || 
                   enhanceNoteMutation.isPending || 
                   riskAssessmentMutation.isPending || 
                   ebpAnalysisMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Intelligence Testing</h1>
        <p className="text-muted-foreground">
          Test the new AI-powered session analysis features that compete with industry leaders like Eleos Health
        </p>
      </div>

      {/* Input Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transcript">Session Transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] mt-2"
              placeholder="Enter session transcript here..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Session Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={runAllTests} 
                disabled={isPending || !transcript.trim()}
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isPending ? 'Analyzing...' : 'Run AI Analysis'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {results && (
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Session Analysis</TabsTrigger>
            <TabsTrigger value="notes">Note Enhancement</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="ebp">EBP Analysis</TabsTrigger>
          </TabsList>

          {/* Session Analysis Results */}
          <TabsContent value="analysis">
            {results.sessionAnalysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Therapeutic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.sessionAnalysis.analysis.themes?.map((theme: string, i: number) => (
                          <Badge key={i} variant="secondary">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Interventions Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.sessionAnalysis.analysis.interventions?.map((intervention: string, i: number) => (
                          <Badge key={i} variant="outline">{intervention}</Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Therapeutic Alliance Score</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {results.sessionAnalysis.analysis.therapeuticAlliance}/10
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Efficiency Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Manual Time:</span>
                        <div className="text-lg font-semibold">
                          {results.sessionAnalysis.timeEfficiency.estimatedManualTime} min
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">AI Time:</span>
                        <div className="text-lg font-semibold">
                          {results.sessionAnalysis.timeEfficiency.aiAssistedTime} min
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Time Saved: {results.sessionAnalysis.timeEfficiency.timeSaved} minutes</strong>
                        <br />
                        Efficiency Gain: {results.sessionAnalysis.timeEfficiency.efficiencyGain}
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Button 
                        onClick={() => enhanceNoteMutation.mutate()}
                        disabled={enhanceNoteMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Test Note Enhancement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Run analysis to see results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Note Enhancement Results */}
          <TabsContent value="notes">
            {results.noteAssistance ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    AI-Enhanced Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Suggested Improvements</h4>
                    <div className="space-y-2">
                      {results.noteAssistance.assistance.suggestedImprovements?.map((improvement: string, i: number) => (
                        <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          {improvement}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Compliance Checks</h4>
                    <div className="space-y-2">
                      {results.noteAssistance.assistance.complianceChecks?.map((check: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded">
                          {check.status === 'pass' ? 
                            <CheckCircle className="h-4 w-4 text-green-500" /> :
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          }
                          <span className="text-sm">{check.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Suggested Billing Codes</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.noteAssistance.assistance.billingCodes?.map((code: string, i: number) => (
                        <Badge key={i} variant="secondary">{code}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Complete session analysis first, then test note enhancement</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Risk Assessment Results */}
          <TabsContent value="risk">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => riskAssessmentMutation.mutate()}
                    disabled={riskAssessmentMutation.isPending}
                    className="w-full mb-4"
                  >
                    Run Risk Assessment
                  </Button>
                  
                  {results.riskAssessment && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge 
                          variant={results.riskAssessment.riskAssessment.riskLevel === 'low' ? 'secondary' : 'destructive'}
                          className="ml-2"
                        >
                          {results.riskAssessment.riskAssessment.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Risk Indicators</h4>
                        <div className="space-y-1 text-sm">
                          {Object.entries(results.riskAssessment.riskAssessment.indicators).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                              <span className={value ? 'text-red-600' : 'text-green-600'}>
                                {value ? 'Present' : 'Not detected'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    EBP Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => ebpAnalysisMutation.mutate()}
                    disabled={ebpAnalysisMutation.isPending}
                    className="w-full mb-4"
                  >
                    Analyze Evidence-Based Practices
                  </Button>
                  
                  {results.ebpAnalysis && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">EBP Adherence Score</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(results.ebpAnalysis.ebpAnalysis.adherenceScore * 100)}%
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Interventions Used</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.ebpAnalysis.ebpAnalysis.interventionsUsed?.map((intervention: string, i: number) => (
                            <Badge key={i} variant="outline">{intervention}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ebp">
            {results.ebpAnalysis ? (
              <Card>
                <CardHeader>
                  <CardTitle>Evidence-Based Practice Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {results.ebpAnalysis.ebpAnalysis.recommendations?.map((rec: string, i: number) => (
                        <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Missed Opportunities</h4>
                    <div className="space-y-2">
                      {results.ebpAnalysis.ebpAnalysis.missedOpportunities?.map((opp: string, i: number) => (
                        <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                          {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Run EBP analysis to see detailed results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}