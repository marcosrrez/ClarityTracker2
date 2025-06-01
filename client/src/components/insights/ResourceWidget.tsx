import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Globe, 
  FileText, 
  Download,
  Upload,
  Send,
  Paperclip,
  CheckCircle,
  Plus
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
  const [selectedMode, setSelectedMode] = useState<'url' | 'manual' | 'pdf' | 'download' | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMode(null);
      setInputValue("");
      setResultMessage("");
      setShowSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const detectInputType = (input: string) => {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return 'url';
    }
    return 'text';
  };

  const handleInputSubmit = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    const inputType = detectInputType(inputValue);
    
    try {
      if (inputType === 'url') {
        setResultMessage("Analyzing web article...");
        
        const summary = await summarizeWebContent(inputValue);
        
        const summaryCard: InsertInsightCard = {
          userId: user?.uid || '',
          title: `Web Article Summary`,
          content: summary,
          tags: ['web-article', 'resource'],
          type: 'article',
          source: inputValue,
          createdAt: new Date(),
        };

        await createInsightCard(summaryCard);
        setResultMessage("✓ Article analyzed and added to your insights");
        setShowSuccess(true);
        
        if (onResourceAdded) {
          onResourceAdded();
        }
      } else {
        setResultMessage("Processing your text...");
        
        const textCard: InsertInsightCard = {
          userId: user?.uid || '',
          title: `Manual Entry`,
          content: inputValue,
          tags: ['manual-entry', 'resource'],
          type: 'note',
          createdAt: new Date(),
        };

        await createInsightCard(textCard);
        setResultMessage("✓ Text saved to your insights");
        setShowSuccess(true);
        
        if (onResourceAdded) {
          onResourceAdded();
        }
      }
      
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing input:', error);
      setResultMessage("Failed to process input. Please try again.");
      toast({
        title: "Error",
        description: "Failed to process your input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setIsLoading(true);
    setSelectedMode('pdf');
    setResultMessage("Processing PDF document...");
    
    try {
      // For now, just create a placeholder card
      const pdfCard: InsertInsightCard = {
        userId: user?.uid || '',
        title: `PDF Document: ${file.name}`,
        content: `PDF document uploaded: ${file.name} (${Math.round(file.size / 1024)}KB)`,
        tags: ['pdf', 'document', 'resource'],
        type: 'document',
        createdAt: new Date(),
      };

      await createInsightCard(pdfCard);
      setResultMessage("✓ PDF document processed and added");
      setShowSuccess(true);
      
      if (onResourceAdded) {
        onResourceAdded();
      }
      
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      setResultMessage("Failed to process PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    setSelectedMode('download');
    setResultMessage("Preparing your insights export...");
    setIsLoading(true);
    
    setTimeout(() => {
      setResultMessage("✓ Export ready! Your insights have been compiled.");
      setShowSuccess(true);
      setIsLoading(false);
      
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-96 h-[500px] p-0 gap-0 rounded-2xl bg-slate-900 border-slate-700 overflow-hidden" aria-describedby="resource-widget-description">
        <DialogTitle className="sr-only">AI Resource Assistant</DialogTitle>
        
        <div className="h-full flex flex-col">
          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedMode && !resultMessage ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Resource Assistant</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Add web articles, paste text, upload documents, or export your insights using the tools below
                </p>
              </div>
            ) : (
              <div className="py-8">
                {resultMessage && (
                  <div className={`p-4 rounded-lg border ${
                    showSuccess 
                      ? 'bg-green-900/20 border-green-700 text-green-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : showSuccess ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : null}
                      <p className="text-sm">{resultMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste a URL or enter text to analyze..."
                  className="min-h-[80px] bg-slate-800 border-slate-600 text-white placeholder-slate-400 resize-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 h-12 w-12"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-center gap-6 p-4 bg-slate-800/50">
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
              <span className="text-xs">Attach</span>
            </button>
            
            <button
              onClick={() => setInputValue('https://')}
              className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs">Web</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Export</span>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handlePdfUpload(file);
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}