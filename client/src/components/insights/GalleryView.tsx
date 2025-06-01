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

      {/* Expanded card modal */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Session from {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
              </DialogTitle>
              <DialogDescription>
                {expandedCard.clientContactHours} hours of client contact
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Session Notes */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Session Notes</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {expandedCard.notes || "No notes available for this session."}
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              {expandedCard.analysis && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI Analysis
                    </h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogItem(expandedCard)}
                    >
                      Delete Analysis
                    </Button>
                  </div>

                  {expandedCard.analysis.summary && (
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {expandedCard.analysis.summary}
                      </p>
                    </div>
                  )}

                  {expandedCard.analysis.themes && Array.isArray(expandedCard.analysis.themes) && expandedCard.analysis.themes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Key Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {expandedCard.analysis.themes.map((theme: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {expandedCard.analysis.keyLearnings && Array.isArray(expandedCard.analysis.keyLearnings) && expandedCard.analysis.keyLearnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-purple-600 mb-2">Key Learnings</h4>
                      <ul className="space-y-2">
                        {expandedCard.analysis.keyLearnings.map((learning: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{learning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {expandedCard.analysis.reflectivePrompts && Array.isArray(expandedCard.analysis.reflectivePrompts) && expandedCard.analysis.reflectivePrompts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Reflective Prompts</h4>
                      <ul className="space-y-2">
                        {expandedCard.analysis.reflectivePrompts.map((prompt: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{prompt}</span>
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