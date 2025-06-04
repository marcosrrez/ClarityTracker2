import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Users, Target, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/lib/firebase';

interface EducationalContentProps {
  topic: string;
  context: any;
  onBack: () => void;
}

interface EducationalContent {
  title: string;
  introduction: string;
  sections: Array<{
    heading: string;
    content: string;
    examples?: string[];
  }>;
  keyTakeaways: string[];
  practicalApplications: string[];
  additionalResources: Array<{
    title: string;
    description: string;
    url?: string;
    type: 'article' | 'video' | 'course' | 'book';
  }>;
  relatedTopics: string[];
  estimatedReadTime: number;
}

export function EducationalContentView({ topic, context, onBack }: EducationalContentProps) {
  const { user } = useUser();
  const [content, setContent] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchEducationalContent();
    }
  }, [user?.uid, topic]);

  const fetchEducationalContent = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/progressive-disclosure/educational-content/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userId: user.uid })
      });
      const result = await response.json();
      setContent(result);
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-64 animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{content?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {content?.estimatedReadTime} min read
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Educational Content
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed">{content?.introduction}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      {content?.sections?.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{section.content}</p>
            </div>
            
            {section.examples && section.examples.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Examples:</h4>
                <div className="space-y-2">
                  {section.examples.map((example, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Key Takeaways */}
      {content?.keyTakeaways && content.keyTakeaways.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Target className="h-5 w-5" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {content.keyTakeaways.map((takeaway, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-green-900 dark:text-green-100">{takeaway}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practical Applications */}
      {content?.practicalApplications && content.practicalApplications.length > 0 && (
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Users className="h-5 w-5" />
              Apply This in Your Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {content.practicalApplications.map((application, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-purple-900 dark:text-purple-100">{application}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Resources */}
      {content?.additionalResources && content.additionalResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {content.additionalResources.map((resource, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => resource.url && window.open(resource.url, '_blank')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{resource.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                  {resource.url && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                      <ExternalLink className="h-3 w-3" />
                      Open resource
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Topics */}
      {content?.relatedTopics && content.relatedTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.relatedTopics.map((relatedTopic, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                >
                  {relatedTopic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />
      
      {/* Return to Analysis */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Ready to continue your analysis?</h4>
              <p className="text-xs text-muted-foreground">
                Return to your data insights and track your progress
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              Back to Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}