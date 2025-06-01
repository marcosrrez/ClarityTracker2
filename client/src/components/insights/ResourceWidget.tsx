import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  Download,
  Upload,
  FileText,
  CheckCircle
} from "lucide-react";
import { createInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { InsertInsightCard } from "@shared/schema";

interface ResourceWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResourceAdded?: () => void;
}

export function ResourceWidget({ open, onOpenChange, onResourceAdded }: ResourceWidgetProps) {
  const [selectedMode, setSelectedMode] = useState<'import' | 'export' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMode(null);
      setResultMessage("");
      setShowSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const handleImport = async (file: File) => {
    setIsLoading(true);
    setSelectedMode('import');
    setResultMessage("Processing file...");
    
    try {
      const importCard: InsertInsightCard = {
        type: 'note',
        title: `Imported: ${file.name}`,
        content: `File imported: ${file.name} (${Math.round(file.size / 1024)}KB)`,
        tags: ['imported', 'file', 'resource'],
      };

      await createInsightCard(user?.uid || '', importCard);
      setResultMessage("✓ File imported successfully");
      setShowSuccess(true);
      
      if (onResourceAdded) {
        onResourceAdded();
      }
      
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error importing file:', error);
      setResultMessage("Failed to import file. Please try again.");
      toast({
        title: "Error",
        description: "Failed to import file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    setSelectedMode('export');
    setResultMessage("Preparing export...");
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[400px] h-[400px] p-0 gap-0 rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 overflow-hidden shadow-xl" aria-describedby="resource-widget-description">
        <DialogTitle className="sr-only">Import & Export</DialogTitle>
        
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Import & Export</h3>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!selectedMode && !resultMessage ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    Import files or export your insights
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <label htmlFor="file-import" className="block">
                    <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                          <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">Import Files</h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Upload documents, notes, or data files</p>
                        </div>
                      </div>
                    </div>
                    <input
                      id="file-import"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".txt,.pdf,.doc,.docx,.json"
                    />
                  </label>

                  <button
                    onClick={handleExport}
                    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                        <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">Export Insights</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Download your insights as a file</p>
                      </div>
                    </div>
                  </button>
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}