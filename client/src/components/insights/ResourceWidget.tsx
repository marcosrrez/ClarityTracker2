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
      <DialogContent className="sm:max-w-sm p-0 gap-0 rounded-3xl bg-gray-900 border-gray-800" aria-describedby="resource-widget-description">
        <DialogTitle className="sr-only">Add Resource</DialogTitle>
        <div className="p-6">
          {!selectedMode ? (
            <>
              {/* Search Bar Style Input */}
              <div 
                className="flex items-center gap-3 p-4 bg-gray-800 rounded-full cursor-pointer hover:bg-gray-750 transition-colors mb-6"
                onClick={() => setSelectedMode('url')}
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-3 w-3 text-white" />
                </div>
                <span className="text-gray-300 text-sm flex-1">Paste article URL or search</span>
              </div>
              
              {/* Icon Actions Row */}
              <div className="flex justify-center gap-8">
                <button
                  onClick={() => setSelectedMode('url')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Globe className="h-6 w-6 text-gray-400 group-hover:text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Web</span>
                </button>

                <button
                  onClick={() => setSelectedMode('manual')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <FileText className="h-6 w-6 text-gray-400 group-hover:text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Paste</span>
                </button>

                <button className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group opacity-50">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-500">PDF</span>
                </button>

                <button className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group opacity-50">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    <Video className="h-6 w-6 text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-500">Video</span>
                </button>
              </div>
            </>
          ) : selectedMode === 'url' ? (
            /* URL Input Mode */
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <h3 className="font-medium text-white">Web Article</h3>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSummarizeUrl)} className="space-y-4">
                <div className="relative">
                  <Input
                    {...register("url")}
                    placeholder="https://example.com/article"
                    disabled={isSummarizing}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-full pl-4 pr-4 h-12 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.url && (
                    <p className="text-xs text-red-400 mt-2 px-4">{errors.url.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSummarizing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Analyze Article
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* Manual Input Mode */
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <h3 className="font-medium text-white">Manual Entry</h3>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Source URL (optional)"
                  disabled={isSummarizing}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-full px-4 h-10 text-sm font-mono focus:ring-purple-500 focus:border-purple-500"
                />
                
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste article content here..."
                  className="w-full h-32 p-4 text-sm bg-gray-800 border border-gray-700 rounded-2xl resize-none text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSummarizing}
                />
                
                <Button 
                  onClick={handleManualSubmit}
                  disabled={isSummarizing || !manualContent.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full h-12"
                >
                  {isSummarizing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
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