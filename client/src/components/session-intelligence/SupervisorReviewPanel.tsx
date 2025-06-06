import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Star,
  Clock,
  User,
  Shield
} from 'lucide-react';

interface SupervisorReviewPanelProps {
  sessionAnalysis: {
    id: string;
    superviseeId: string;
    superviseeName: string;
    sessionDate: Date;
    duration: number;
    clientInitials: string;
    complianceScore: number;
    engagementScore: number;
    riskIndicators: string[];
    strengths: string[];
    areasForImprovement: string[];
    ebpTechniques: string[];
    clinicalInsights: any;
  };
  onReviewSubmitted?: (review: any) => void;
}

export const SupervisorReviewPanel: React.FC<SupervisorReviewPanelProps> = ({
  sessionAnalysis,
  onReviewSubmitted
}) => {
  const [review, setReview] = useState({
    rating: 0,
    feedback: '',
    recommendations: '',
    approved: false,
    requiresFollowUp: false,
    nextSessionFocus: '',
    complianceNotes: '',
    developmentPriorities: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/supervision/session-analyses/${sessionAnalysis.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...review,
          reviewed: true,
          reviewedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      
      toast({
        title: "Review submitted successfully",
        description: "Supervisor feedback has been recorded for this session.",
      });

      onReviewSubmitted?.(result.review);
    } catch (error) {
      toast({
        title: "Error submitting review",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskLevel = (indicators: string[]) => {
    if (indicators.length >= 3) return { level: 'High', color: 'text-red-600' };
    if (indicators.length >= 1) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const riskLevel = getRiskLevel(sessionAnalysis.riskIndicators);

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Session Review: {sessionAnalysis.superviseeName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{sessionAnalysis.complianceScore}%</div>
              <div className="text-sm text-muted-foreground">EBP Compliance</div>
              <Progress value={sessionAnalysis.complianceScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{sessionAnalysis.engagementScore}%</div>
              <div className="text-sm text-muted-foreground">Client Engagement</div>
              <Progress value={sessionAnalysis.engagementScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${riskLevel.color}`}>{riskLevel.level}</div>
              <div className="text-sm text-muted-foreground">Risk Level</div>
              <div className="mt-2 text-sm">
                {sessionAnalysis.riskIndicators.length} indicator(s)
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Identified Strengths
              </h4>
              <div className="space-y-1">
                {sessionAnalysis.strengths.map((strength, index) => (
                  <Badge key={index} variant="outline" className="mr-2 mb-1">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Areas for Development
              </h4>
              <div className="space-y-1">
                {sessionAnalysis.areasForImprovement.map((area, index) => (
                  <Badge key={index} variant="secondary" className="mr-2 mb-1">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {sessionAnalysis.riskIndicators.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
                Risk Indicators Detected
              </h4>
              <div className="space-y-1">
                {sessionAnalysis.riskIndicators.map((indicator, index) => (
                  <div key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {indicator}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Review Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Supervisor Review & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-base font-medium">Overall Session Rating</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                  className={`p-1 ${
                    star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {review.rating}/5 stars
              </span>
            </div>
          </div>

          {/* Supervisor Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-base font-medium">
              Detailed Feedback
            </Label>
            <Textarea
              id="feedback"
              placeholder="Provide detailed feedback on the supervisee's performance, technique usage, and clinical decision-making..."
              value={review.feedback}
              onChange={(e) => setReview(prev => ({ ...prev, feedback: e.target.value }))}
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Recommendations */}
          <div>
            <Label htmlFor="recommendations" className="text-base font-medium">
              Specific Recommendations
            </Label>
            <Textarea
              id="recommendations"
              placeholder="Specific recommendations for improvement, additional training, or resources..."
              value={review.recommendations}
              onChange={(e) => setReview(prev => ({ ...prev, recommendations: e.target.value }))}
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Next Session Focus */}
          <div>
            <Label htmlFor="nextFocus" className="text-base font-medium">
              Next Session Focus Areas
            </Label>
            <Input
              id="nextFocus"
              placeholder="Key areas to focus on in the next supervision session..."
              value={review.nextSessionFocus}
              onChange={(e) => setReview(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
              className="mt-2"
            />
          </div>

          {/* Compliance Notes */}
          <div>
            <Label htmlFor="complianceNotes" className="text-base font-medium">
              Compliance & EBP Notes
            </Label>
            <Textarea
              id="complianceNotes"
              placeholder="Notes on evidence-based practice adherence, ethical considerations, and compliance..."
              value={review.complianceNotes}
              onChange={(e) => setReview(prev => ({ ...prev, complianceNotes: e.target.value }))}
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Action Items */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={review.approved}
                onChange={(e) => setReview(prev => ({ ...prev, approved: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium">Approve for independent practice</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={review.requiresFollowUp}
                onChange={(e) => setReview(prev => ({ ...prev, requiresFollowUp: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium">Requires immediate follow-up</span>
            </label>
          </div>

          {/* Submit Review */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline">
              Save Draft
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={isSubmitting || review.rating === 0 || !review.feedback.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};