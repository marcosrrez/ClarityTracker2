import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  FileText,
  Zap,
  Timer,
  TrendingUp
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ComplianceCheck {
  rule: string;
  status: 'pass' | 'warning' | 'fail';
  suggestion: string;
}

interface AIAssistance {
  originalContent: string;
  suggestedImprovements: string[];
  complianceChecks: ComplianceCheck[];
  billingCodes: string[];
  estimatedCompletionTime: number;
}

interface EnhancedNoteEditorProps {
  initialContent?: string;
  logEntryId: string;
  userId: string;
  onSave: (content: string) => void;
  sessionContext?: {
    transcript?: string;
    analysis?: any;
  };
}

export function EnhancedNoteEditor({
  initialContent = '',
  logEntryId,
  userId,
  onSave,
  sessionContext
}: EnhancedNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [aiAssistance, setAIAssistance] = useState<AIAssistance | null>(null);
  const [showingSuggestions, setShowingSuggestions] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const enhanceNoteMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      const startTime = Date.now();
      const response = await apiRequest('/api/notes/ai-enhance', {
        method: 'POST',
        body: JSON.stringify({
          content: noteContent,
          logEntryId,
          userId,
          sessionContext
        })
      });
      setProcessingTime(Date.now() - startTime);
      return response;
    },
    onSuccess: (data) => {
      setAIAssistance(data.assistance);
      setShowingSuggestions(true);
    }
  });

  const handleEnhanceNote = () => {
    if (content.trim()) {
      enhanceNoteMutation.mutate(content);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setContent(prev => prev + '\n\n' + suggestion);
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'fail': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const calculateTimeSavings = () => {
    if (!aiAssistance) return null;
    const manualTime = 45; // Average manual note time in minutes
    const aiTime = aiAssistance.estimatedCompletionTime;
    const savings = Math.round(((manualTime - aiTime) / manualTime) * 100);
    return { manualTime, aiTime, savings };
  };

  return (
    <div className="space-y-6">
      {/* Note Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI-Enhanced Progress Notes
            </CardTitle>
            <div className="flex items-center gap-2">
              {processingTime && (
                <Badge variant="outline" className="text-xs">
                  <Timer className="h-3 w-3 mr-1" />
                  {processingTime}ms
                </Badge>
              )}
              <Button
                onClick={handleEnhanceNote}
                disabled={enhanceNoteMutation.isPending || !content.trim()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                {enhanceNoteMutation.isPending ? 'Analyzing...' : 'AI Enhance'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your progress notes here. Use AI Enhancement to get suggestions for improvements, compliance checks, and billing codes..."
            className="min-h-[200px] resize-none"
          />
          
          {enhanceNoteMutation.isPending && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 animate-pulse" />
                Analyzing your notes with AI for compliance, improvements, and efficiency...
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistance Panel */}
      {aiAssistance && showingSuggestions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiAssistance.suggestedImprovements.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion(suggestion)}
                    className="text-xs"
                  >
                    Apply Suggestion
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiAssistance.complianceChecks.map((check, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getComplianceColor(check.status)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getComplianceIcon(check.status)}
                    <span className="font-medium text-sm">{check.rule}</span>
                  </div>
                  <p className="text-xs text-gray-600">{check.suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Codes & Efficiency Metrics */}
      {aiAssistance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Billing Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Suggested Billing Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {aiAssistance.billingCodes.map((code, index) => (
                  <Badge key={index} variant="secondary">{code}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const savings = calculateTimeSavings();
                return savings ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Manual Documentation:</span>
                      <span>{savings.manualTime} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI-Assisted Time:</span>
                      <span>{savings.aiTime} min</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Time Saved:</span>
                      <span className="text-green-600">{savings.savings}%</span>
                    </div>
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        You're saving approximately {savings.manualTime - savings.aiTime} minutes per note with AI assistance - matching industry-leading 70% efficiency gains!
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowingSuggestions(false)}>
          Cancel
        </Button>
        <Button onClick={() => onSave(content)} className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Save Enhanced Notes
        </Button>
      </div>
    </div>
  );
}