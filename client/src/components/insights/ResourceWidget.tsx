import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  FileText, 
  BookOpen,
  Video,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { summarizeWebContent } from "@/lib/ai";
import { createInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { InsertInsightCard } from "@shared/schema";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface ResourceWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResourceAdded?: () => void;
}

export function ResourceWidget({ open, onOpenChange, onResourceAdded }: ResourceWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });

  const onSummarizeUrl = async (data: UrlFormData) => {
    if (!user) return;

    try {
      setIsSummarizing(true);
      
      // Get the page title from URL for better UX
      let title = data.url;
      try {
        const urlObj = new URL(data.url);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {
        // Use URL as-is if parsing fails
      }
      
      const summary = await summarizeWebContent(data.url);
      
      const summaryCard: InsertInsightCard = {
        type: "articleSummary",
        title: `Article from ${title}`,
        content: summary,
        tags: ["web-content", "summary", "professional-development"],
        originalUrl: data.url,
      };

      await createInsightCard(user.uid, summaryCard);
      
      toast({
        title: "Article summarized successfully",
        description: "The web content has been analyzed and saved to your insights.",
      });
      
      reset();
      onOpenChange(false);
      if (onResourceAdded) onResourceAdded();
      
    } catch (error) {
      console.error("Error summarizing URL:", error);
      
      // Smart fallback: offer manual content paste
      const shouldTryManual = confirm(
        "Website blocked automatic access. Would you like to paste the article content manually? This will still provide the same AI analysis."
      );
      
      if (shouldTryManual) {
        setShowManualInput(true);
        setManualUrl(data.url);
      } else {
        toast({
          title: "Content capture failed",
          description: "Website blocked access. Try copying the content manually.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!user || !manualContent.trim()) return;

    try {
      setIsSummarizing(true);
      
      const summary = await summarizeWebContent(manualContent);
      
      let title = manualUrl;
      try {
        const urlObj = new URL(manualUrl);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {
        title = "Manual Content";
      }
      
      const summaryCard: InsertInsightCard = {
        type: "articleSummary",
        title: `Article from ${title}`,
        content: summary,
        tags: ["web-content", "summary", "professional-development", "manual-entry"],
        originalUrl: manualUrl,
      };

      await createInsightCard(user.uid, summaryCard);
      
      toast({
        title: "Content analyzed successfully",
        description: "Your pasted content has been analyzed and saved.",
      });
      
      setShowManualInput(false);
      setManualContent("");
      setManualUrl("");
      onOpenChange(false);
      if (onResourceAdded) onResourceAdded();
      
    } catch (error) {
      console.error("Error analyzing manual content:", error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby="resource-widget-description">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!showManualInput ? (
            <>
              {/* URL Summarization */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Web Article</CardTitle>
                  </div>
                  <CardDescription>
                    Paste a URL to automatically extract and analyze the content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmit(onSummarizeUrl)} className="space-y-4">
                    <div>
                      <Input
                        {...register("url")}
                        placeholder="https://example.com/article"
                        disabled={isSummarizing}
                        className="font-mono text-sm"
                      />
                      {errors.url && (
                        <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSummarizing}
                      className="w-full"
                    >
                      {isSummarizing ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Summarize Article
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Resource Type Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">PDF Document</p>
                    <p className="text-xs text-muted-foreground">Upload & analyze</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Video/Audio</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  AI analysis will extract key insights, therapeutic techniques, and professional development opportunities from your resources.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            /* Manual Content Input */
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paste Article Content</CardTitle>
                <CardDescription>
                  Copy and paste the article text for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste the article content here..."
                  className="w-full h-32 p-3 border rounded-md resize-none"
                  disabled={isSummarizing}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={isSummarizing || !manualContent.trim()}
                    className="flex-1"
                  >
                    {isSummarizing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Content"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualInput(false)}
                    disabled={isSummarizing}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}