import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles, AlertTriangle, ChevronDown, Trash2, Share2, MoreHorizontal, X, Archive, Edit3, Copy } from "lucide-react";
import { MyMindLayout } from "./MyMindLayout";
import { format } from "date-fns";
import { useLogEntries } from "@/hooks/use-firestore";
import { getAiAnalysis, deleteAiAnalysis } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GalleryItem {
  id: string;
  dateOfContact: Date;
  clientContactHours: number;
  notes: string;
  analysis?: any;
}

interface GalleryViewProps {
  userId: string;
}

export function GalleryView({ userId }: GalleryViewProps) {
  const { user } = useAuth();
  const { entries: logEntries, loading: isLoading, refetch } = useLogEntries();
  const [expandedCard, setExpandedCard] = useState<GalleryItem | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);
  const { toast } = useToast();

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (!logEntries) return;

    const processItems = async () => {
      const items: GalleryItem[] = [];

      for (const entry of logEntries) {
        if (!entry.notes || entry.notes.trim().length === 0) continue;

        try {
          const analysis = await getAiAnalysis(user?.uid || "", entry.id);
          items.push({
            id: entry.id,
            dateOfContact: new Date(entry.dateOfContact),
            clientContactHours: entry.clientContactHours,
            notes: entry.notes,
            analysis: analysis || undefined,
          });
        } catch (error) {
          items.push({
            id: entry.id,
            dateOfContact: new Date(entry.dateOfContact),
            clientContactHours: entry.clientContactHours,
            notes: entry.notes,
          });
        }
      }

      items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
      setGalleryItems(items);
    };

    processItems();
  }, [logEntries]);

  const handleDeleteAnalysis = async (itemId: string) => {
    try {
      await deleteAiAnalysis(user?.uid || "", itemId);
      
      setGalleryItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, analysis: undefined }
            : item
        )
      );

      toast({
        title: "Analysis Deleted",
        description: "The AI analysis has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Error",
        description: "Failed to delete the analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <MyMindLayout 
        galleryItems={galleryItems}
        onItemClick={setExpandedCard}
        onRefresh={refetch}
      />

      {/* Full Page MyMind Style Modal */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <DialogTitle className="sr-only">Session Details</DialogTitle>
            <div className="flex flex-col h-full">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExpandedCard(null)}
                  className="p-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Session from {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => {
                        toast({
                          title: "Auto-organize",
                          description: "This session will be automatically tagged and organized into Smart Spaces based on therapeutic modalities and client presentations.",
                        });
                      }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Auto-organize to Space
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        toast({
                          title: "Edit mode",
                          description: "Edit functionality coming soon!",
                        });
                      }}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit session
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(`Session: ${format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}\n\n${expandedCard.notes}`);
                        toast({
                          title: "Copied",
                          description: "Session content copied to clipboard",
                        });
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setExpandedCard(null)}
                    className="p-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-none p-6 space-y-8">
                  {/* Main Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-6 leading-tight">
                      Session: {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                      {expandedCard.notes || "No notes available for this session."}
                    </p>
                  </div>

                  {/* TL;DR Box */}
                  {expandedCard.analysis && expandedCard.analysis.summary && (
                    <div className="border border-blue-300 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">TL;DR</div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {expandedCard.analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Mind Tags Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">MIND TAGS</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
                        onClick={() => {
                          toast({
                            title: "Add tag",
                            description: "Tag functionality coming soon!",
                          });
                        }}
                      >
                        + Add tag
                      </Button>
                      
                      {/* Auto-generated tags */}
                      {expandedCard.analysis?.therapeuticModalities && Array.isArray(expandedCard.analysis.therapeuticModalities) && 
                        expandedCard.analysis.therapeuticModalities.map((mod: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {mod}
                          </Badge>
                        ))
                      }
                      
                      {expandedCard.analysis?.clientPresentation && Array.isArray(expandedCard.analysis.clientPresentation) && 
                        expandedCard.analysis.clientPresentation.map((pres: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {pres}
                          </Badge>
                        ))
                      }
                      
                      {expandedCard.analysis?.competencyAreas && Array.isArray(expandedCard.analysis.competencyAreas) && 
                        expandedCard.analysis.competencyAreas.map((comp: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {comp}
                          </Badge>
                        ))
                      }
                      
                      {/* Fallback to themes */}
                      {(!expandedCard.analysis?.therapeuticModalities && !expandedCard.analysis?.clientPresentation && !expandedCard.analysis?.competencyAreas) && 
                       expandedCard.analysis?.themes && Array.isArray(expandedCard.analysis.themes) && 
                        expandedCard.analysis.themes.map((theme: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {theme}
                          </Badge>
                        ))
                      }
                      
                      {/* Session metadata tags */}
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # {expandedCard.clientContactHours}h Session
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # {format(new Date(expandedCard.dateOfContact), "MMMM yyyy")}
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Professional Development
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Therapy Session
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Counseling
                      </Badge>
                    </div>
                  </div>

                  {/* Mind Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">MIND NOTES</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <input 
                        type="text"
                        placeholder="Type here to add a note..."
                        className="w-full bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Additional space for content */}
                  <div className="h-32"></div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-center gap-8">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteDialogItem(expandedCard)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Share",
                        description: "Share functionality coming soon!",
                      });
                    }}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      {deleteDialogItem && (
        <Dialog open={!!deleteDialogItem} onOpenChange={() => setDeleteDialogItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete AI Analysis
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the AI analysis for the session from{" "}
                {format(new Date(deleteDialogItem.dateOfContact), "MMMM d, yyyy")}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogItem(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await handleDeleteAnalysis(deleteDialogItem.id);
                  setDeleteDialogItem(null);
                }}
              >
                Delete Analysis
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}