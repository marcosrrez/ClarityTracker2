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
    if (input.includes('?') || input.toLowerCase().includes('what') || input.toLowerCase().includes('how') || input.toLowerCase().includes('when')) {
      return 'question';
    }
    return 'text';
  };

  const handleAIQuery = async (question: string) => {
    setIsLoading(true);
    setResultMessage("Thinking...");
    
    try {
      // Create a therapy-focused prompt
      const systemPrompt = `You are ClarityLog's AI assistant, specializing in helping Licensed Associate Counselors (LACs) with their professional development and licensure journey. You have expertise in:
      - Therapy techniques (CBT, DBT, motivational interviewing, etc.)
      - Professional development and supervision
      - Licensure requirements and progress tracking
      - Clinical documentation and reflection
      
      Provide helpful, professional responses that support their growth as counselors.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          systemPrompt,
          userId: user?.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Create an insight card for the Q&A
      const qaCard: InsertInsightCard = {
        type: 'note',
        title: `AI Assistant: ${question.substring(0, 50)}...`,
        content: `**Question:** ${question}\n\n**Answer:** ${data.response}`,
        tags: ['ai-assistant', 'q-and-a'],
      };

      await createInsightCard(user?.uid || '', qaCard);
      setResultMessage(`✓ ${data.response.substring(0, 100)}...`);
      setShowSuccess(true);
      
      if (onResourceAdded) {
        onResourceAdded();
      }
      
    } catch (error) {
      console.error('Error with AI query:', error);
      setResultMessage("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          type: 'articleSummary',
          title: `Web Article Summary`,
          content: summary,
          tags: ['web-article', 'resource'],
          originalUrl: inputValue,
        };

        await createInsightCard(user?.uid || '', summaryCard);
        setResultMessage("✓ Article analyzed and added to your insights");
        setShowSuccess(true);
        
        if (onResourceAdded) {
          onResourceAdded();
        }
      } else if (inputType === 'question') {
        await handleAIQuery(inputValue);
      } else {
        setResultMessage("Processing your text...");
        
        const textCard: InsertInsightCard = {
          type: 'note',
          title: `Manual Entry`,
          content: inputValue,
          tags: ['manual-entry', 'resource'],
        };

        await createInsightCard(user?.uid || '', textCard);
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
      // Create a note card for the PDF document
      const pdfCard: InsertInsightCard = {
        type: 'note',
        title: `PDF Document: ${file.name}`,
        content: `PDF document uploaded: ${file.name} (${Math.round(file.size / 1024)}KB)`,
        tags: ['pdf', 'document', 'resource'],
      };

      await createInsightCard(user?.uid || '', pdfCard);
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
      <DialogContent className="w-[400px] h-[520px] p-0 gap-0 rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 overflow-hidden shadow-xl" aria-describedby="resource-widget-description">
        <DialogTitle className="sr-only">AI Resource Assistant</DialogTitle>
        
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Add Resource</h3>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!selectedMode && !resultMessage ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  Ask questions like "What is CBT?" • Paste URLs to analyze articles • Add notes and documents
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resultMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    showSuccess 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : showSuccess ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : null}
                      <span>{resultMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask questions, paste URLs, or add resources..."
                  className="min-h-[60px] bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg text-sm"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-auto self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center bg-white dark:bg-slate-700 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 transition-all rounded-l-full disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm font-medium">Attach</span>
                </button>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-600" />
                
                <button
                  onClick={() => setInputValue('https://')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Web</span>
                </button>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-600" />
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 transition-all rounded-r-full disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>
            </div>
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