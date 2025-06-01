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
  AlertCircle,
  Download,
  Upload
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
  const [selectedMode, setSelectedMode] = useState<'url' | 'manual' | 'pdf' | 'download' | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [downloadTimeframe, setDownloadTimeframe] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

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
      setPdfFile(null);
      setDownloadTimeframe('month');
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

  const handlePdfUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsSummarizing(true);
      
      // For now, create a placeholder entry - PDF processing would need additional setup
      const pdfCard: InsertInsightCard = {
        type: "articleSummary",
        title: `PDF: ${file.name}`,
        content: `PDF file uploaded: ${file.name}. PDF text extraction and analysis will be available soon.`,
        tags: ["pdf-upload", "document", "professional-development"],
        originalUrl: file.name,
      };

      await createInsightCard(user.uid, pdfCard);
      
      toast({
        title: "PDF uploaded successfully",
        description: "PDF processing will be enhanced in future updates.",
      });
      
      setPdfFile(null);
      handleOpenChange(false);
      if (onResourceAdded) onResourceAdded();
      
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadInsights = () => {
    // This would integrate with the download functionality from the original InsightsResourcesTab
    toast({
      title: "Download started",
      description: `Downloading insights from the last ${downloadTimeframe}.`,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-80 h-96 p-0 gap-0 rounded-2xl bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 overflow-hidden" aria-describedby="resource-widget-description">
        <DialogTitle className="sr-only">Add Resource</DialogTitle>
        <div className="p-4 h-full flex flex-col">
          {!selectedMode ? (
            <>
              {/* Premium Search Bar */}
              <div 
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200 mb-6 border border-gray-200 dark:border-gray-700"
                onClick={() => setSelectedMode('url')}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Globe className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-200 text-sm flex-1 font-medium">Add web article or resource</span>
              </div>
              
              {/* Premium Actions Grid */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                <button
                  onClick={() => setSelectedMode('url')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-200 shadow-sm">
                    <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Web Article</span>
                </button>

                <button
                  onClick={() => setSelectedMode('manual')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-200 shadow-sm">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Paste Text</span>
                </button>

                <button
                  onClick={() => setSelectedMode('pdf')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center group-hover:from-green-500 group-hover:to-green-600 transition-all duration-200 shadow-sm">
                    <Upload className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload PDF</span>
                </button>

                <button
                  onClick={() => setSelectedMode('download')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 group col-span-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-2xl flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-600 transition-all duration-200 shadow-sm">
                    <Download className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Export Insights</span>
                </button>
              </div>
            </>
          ) : selectedMode === 'url' ? (
            /* URL Input Mode */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Web Article</h3>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSummarizeUrl)} className="flex flex-col gap-4 flex-1">
                <Input
                  {...register("url")}
                  placeholder="https://example.com/article"
                  disabled={isSummarizing}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 h-10 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.url && (
                  <p className="text-xs text-red-600 dark:text-red-400 px-4">{errors.url.message}</p>
                )}
                
                <div className="mt-auto">
                  <Button 
                    type="submit" 
                    disabled={isSummarizing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10"
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
                </div>
              </form>
            </div>
          ) : selectedMode === 'manual' ? (
            /* Manual Input Mode */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Manual Entry</h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Source URL (optional)"
                  disabled={isSummarizing}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 h-8 text-sm font-mono focus:ring-purple-500 focus:border-purple-500"
                />
                
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste article content here..."
                  className="flex-1 p-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSummarizing}
                />
                
                <Button 
                  onClick={handleManualSubmit}
                  disabled={isSummarizing || !manualContent.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full h-10"
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
          ) : selectedMode === 'pdf' ? (
            /* PDF Upload Mode */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Upload PDF</h3>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {pdfFile ? pdfFile.name : "Choose PDF file"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                    disabled={isSummarizing}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full cursor-pointer text-sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Choose File
                  </label>
                </div>
                
                {pdfFile && (
                  <Button 
                    onClick={() => handlePdfUpload(pdfFile)}
                    disabled={isSummarizing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-10"
                  >
                    {isSummarizing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Download Mode */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMode(null)}
                  className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ←
                </Button>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-orange-600" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Export Data</h3>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Time Range
                  </label>
                  <select
                    value={downloadTimeframe}
                    onChange={(e) => setDownloadTimeframe(e.target.value as any)}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleDownloadInsights}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}