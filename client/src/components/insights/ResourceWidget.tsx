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
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl" aria-describedby="resource-widget-description">
        <div className="p-6">
          {!selectedMode ? (
            <>
              {/* Compact Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Resource</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered analysis</p>
              </div>
              
              {/* Compact Mode Cards */}
              <div className="space-y-3">
                <div 
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedMode('url')}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Web Article</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Auto-extract from URL</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>

                <div 
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedMode('manual')}
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Manual Entry</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Paste content directly</p>
                  </div>
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                </div>
              </div>

              {/* Coming Soon - Compact */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400">PDF</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Video className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400">Video</p>
                  </div>
                </div>
              </div>
            </>
          ) : selectedMode === 'url' ? (
            /* Compact URL Input */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-1 h-8 w-8"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">Web Article</h3>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSummarizeUrl)} className="space-y-4">
                <div>
                  <Input
                    {...register("url")}
                    placeholder="https://example.com/article"
                    disabled={isSummarizing}
                    className="font-mono text-sm"
                  />
                  {errors.url && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.url.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSummarizing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* Compact Manual Input */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-1 h-8 w-8"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold">Manual Entry</h3>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Source URL (optional)"
                  disabled={isSummarizing}
                  className="text-sm font-mono"
                />
                
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste article content here..."
                  className="w-full h-24 p-3 text-sm border rounded-lg resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSummarizing}
                />
                
                <Button 
                  onClick={handleManualSubmit}
                  disabled={isSummarizing || !manualContent.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Analyze
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