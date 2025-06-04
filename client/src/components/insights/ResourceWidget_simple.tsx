import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResourceWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResourceAdded?: () => void;
}

export function ResourceWidget({ open, onOpenChange, onResourceAdded }: ResourceWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleImport = () => {
    toast({
      title: "Import Feature",
      description: "Import functionality will be available soon",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Feature", 
      description: "Export functionality will be available soon",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[400px] h-[300px] p-0 gap-0 rounded-xl bg-white dark:bg-slate-900">
        <DialogTitle className="sr-only">Import & Export</DialogTitle>
        
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Import & Export</h3>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-4 justify-center">
            <Button 
              onClick={handleImport}
              disabled={isLoading}
              className="flex items-center gap-2 h-12"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
            
            <Button 
              onClick={handleExport}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}