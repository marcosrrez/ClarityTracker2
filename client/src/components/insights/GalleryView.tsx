import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles, AlertTriangle } from "lucide-react";
import { MyMindLayout } from "./MyMindLayout";
import { format } from "date-fns";
import { useLogEntries } from "@/hooks/use-firestore";
import { getAiAnalysis, deleteAiAnalysis } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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

      {/* Expanded card modal - MyMind Style */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
                  Session: {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {expandedCard.notes || "No notes available for this session."}
                </p>
              </div>

              {/* TL;DR Box - like in MyMind screenshot */}
              {expandedCard.analysis && expandedCard.analysis.summary && (
                <div className="border border-orange-300 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                  <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">TL;DR</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {expandedCard.analysis.summary}
                  </p>
                </div>
              )}

              {/* Mind Tags Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500 uppercase tracking-wide">MIND TAGS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs"
                    onClick={() => {
                      toast({
                        title: "Add tag",
                        description: "Tag functionality coming soon!",
                      });
                    }}
                  >
                    + Add tag
                  </Button>
                  
                  {/* Enhanced Auto-Tags */}
                  {expandedCard.analysis?.therapeuticModalities && Array.isArray(expandedCard.analysis.therapeuticModalities) && 
                    expandedCard.analysis.therapeuticModalities.map((mod: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        # {mod}
                      </Badge>
                    ))
                  }
                  
                  {expandedCard.analysis?.clientPresentation && Array.isArray(expandedCard.analysis.clientPresentation) && 
                    expandedCard.analysis.clientPresentation.map((pres: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        # {pres}
                      </Badge>
                    ))
                  }
                  
                  {expandedCard.analysis?.competencyAreas && Array.isArray(expandedCard.analysis.competencyAreas) && 
                    expandedCard.analysis.competencyAreas.map((comp: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        # {comp}
                      </Badge>
                    ))
                  }
                  
                  {/* Fallback to themes if enhanced tags not available */}
                  {(!expandedCard.analysis?.therapeuticModalities && !expandedCard.analysis?.clientPresentation && !expandedCard.analysis?.competencyAreas) && 
                   expandedCard.analysis?.themes && Array.isArray(expandedCard.analysis.themes) && 
                    expandedCard.analysis.themes.map((theme: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        # {theme}
                      </Badge>
                    ))
                  }
                  
                  {/* Session Info Tags */}
                  <Badge variant="outline" className="text-xs">
                    # {expandedCard.clientContactHours}h Session
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    # {format(new Date(expandedCard.dateOfContact), "MMMM yyyy")}
                  </Badge>
                </div>
              </div>

              {/* Additional Analysis Sections if available */}
              {expandedCard.analysis && (
                <div className="space-y-4">
                  {expandedCard.analysis.keyLearnings && Array.isArray(expandedCard.analysis.keyLearnings) && expandedCard.analysis.keyLearnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-purple-600 mb-2">Key Learnings</h4>
                      <ul className="space-y-1">
                        {expandedCard.analysis.keyLearnings.map((learning: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {learning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {expandedCard.analysis.reflectivePrompts && Array.isArray(expandedCard.analysis.reflectivePrompts) && expandedCard.analysis.reflectivePrompts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Reflective Questions</h4>
                      <ul className="space-y-1">
                        {expandedCard.analysis.reflectivePrompts.map((prompt: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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