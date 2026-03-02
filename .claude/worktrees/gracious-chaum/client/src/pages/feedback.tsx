import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, MessageSquare, Bug, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createFeedback } from "@/lib/firestore";
import { insertFeedbackSchema } from "@shared/schema";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "general"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  email: z.string().email("Please enter a valid email address").optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
  });

  const feedbackType = watch("type");

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    
    try {
      // Send email notification to you
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      const result = await response.json();
      setSubmitted(true);
      reset();
      
      // Show different messages based on feedback type
      if (data.type === 'bug') {
        toast({
          title: "Bug Report Submitted",
          description: "Your bug report has been sent directly to Replit for automated analysis and fixing. Issue ID: " + (result.issueId || 'Generated'),
        });
      } else {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback! We'll review it and get back to you if needed.",
        });
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "feature":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve ClarityLog.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Feedback & Support</h1>
        <p className="text-muted-foreground">
          Help us improve ClarityLog by sharing your feedback, reporting bugs, or suggesting new features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Submit Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Feedback Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Feedback Type *</Label>
              <Select onValueChange={(value) => setValue("type", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    <div className="flex items-center space-x-2">
                      <Bug className="h-4 w-4" />
                      <span>Bug Report</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="feature">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>Feature Request</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="general">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>General Feedback</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder={
                  feedbackType === "bug" 
                    ? "Brief description of the bug"
                    : feedbackType === "feature"
                    ? "What feature would you like to see?"
                    : "What's on your mind?"
                }
                {...register("subject")}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={6}
                placeholder={
                  feedbackType === "bug"
                    ? "Please describe the bug in detail. Include steps to reproduce, what you expected to happen, and what actually happened."
                    : feedbackType === "feature"
                    ? "Describe the feature you'd like to see. How would it help you? What should it do?"
                    : "Share your thoughts, suggestions, or any other feedback about ClarityLog."
                }
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register("email")}
              />
              <p className="text-xs text-muted-foreground">
                Provide your email if you'd like us to follow up with you about this feedback.
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Feedback Info */}
      {feedbackType === 'bug' ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <Bug className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Automated Bug Fixing:</strong> Bug reports are sent directly to Replit for automated analysis and fixing. 
            This enables much faster resolution times compared to traditional manual review processes.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your feedback helps us make ClarityLog better for all Licensed Associate Counselors. 
            We review all submissions and prioritize improvements based on user needs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}