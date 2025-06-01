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
  const [selectedMode, setSelectedMode] = useState<'url' | 'manual' | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMode(null);
      setManualContent("");
      setManualUrl("");
      setShowManualInput(false);
      reset();
    }
    onOpenChange(newOpen);
  };

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
      handleOpenChange(false);
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
      handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden" aria-describedby="resource-widget-description">
        <DialogHeader className="border-b pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Professional Resource
          </DialogTitle>
          <p className="text-muted-foreground">
            Transform articles and content into actionable professional development insights
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-8 overflow-y-auto">
          {!selectedMode ? (
            <>
              {/* Premium Mode Selection */}
              <div className="grid gap-4">
                <div 
                  className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6"
                  onClick={() => setSelectedMode('url')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Web Article Analysis
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Paste any URL to automatically extract, summarize, and analyze content for therapeutic insights
                      </p>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Auto-extract
                        </div>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                          AI Analysis
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                <div 
                  className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-6"
                  onClick={() => setSelectedMode('manual')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Manual Content Entry
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Copy and paste article text when websites block automatic access
                      </p>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                          Manual Entry
                        </div>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                          AI Analysis
                        </div>
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Coming Soon Features */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">Coming Soon</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-center text-gray-600 dark:text-gray-400">PDF Analysis</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-center text-gray-600 dark:text-gray-400">Video Transcripts</p>
                  </div>
                </div>
              </div>
            </>
          ) : selectedMode === 'url' ? (
            /* URL Input Mode */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Web Article Analysis</h3>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSummarizeUrl)} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Article URL
                  </label>
                  <Input
                    {...register("url")}
                    placeholder="https://www.example.com/therapeutic-article"
                    disabled={isSummarizing}
                    className="h-12 text-base font-mono bg-white dark:bg-gray-800"
                  />
                  {errors.url && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.url.message}</p>
                  )}
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">AI will analyze for:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                        <li>Therapeutic techniques and modalities</li>
                        <li>Professional development insights</li>
                        <li>Key takeaways and action items</li>
                        <li>Relevance to counseling practice</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSummarizing}
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-3" />
                      Analyzing Content...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5 mr-3" />
                      Analyze Article
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* Manual Content Mode */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Manual Content Entry</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source URL (Optional)
                  </label>
                  <Input
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://www.example.com/article (for reference)"
                    disabled={isSummarizing}
                    className="h-10 text-sm font-mono"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Article Content
                  </label>
                  <textarea
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste the full article content here for AI analysis..."
                    className="w-full h-40 p-4 border rounded-lg resize-none text-sm leading-relaxed bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isSummarizing}
                  />
                  <p className="text-xs text-gray-500">
                    {manualContent.length} characters
                  </p>
                </div>
                
                <Button 
                  onClick={handleManualSubmit}
                  disabled={isSummarizing || !manualContent.trim()}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-3" />
                      Analyzing Content...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-3" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}