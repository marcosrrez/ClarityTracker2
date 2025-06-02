import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles, AlertTriangle, ChevronDown, Trash2, Share2, MoreHorizontal, X, Archive, Edit3, Copy } from "lucide-react";
import { MyMindLayout } from "./MyMindLayout";
import { format } from "date-fns";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
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
  const { cards: insightCards, loading: cardsLoading, refetch: refetchCards } = useInsightCards();
  const [expandedCard, setExpandedCard] = useState<GalleryItem | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);
  const { toast } = useToast();

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const processItems = async () => {
      const items: GalleryItem[] = [];

      // Add session entries with AI analysis
      if (logEntries) {
        for (const entry of logEntries) {
          if (!entry.notes || entry.notes.trim().length === 0) continue;
          
          // Filter out entries with insufficient content for meaningful insights
          const wordCount = entry.notes.trim().split(/\s+/).length;
          if (wordCount < 10) continue;

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
      }

      // Add standalone insight cards (notes, article summaries)
      if (insightCards) {
        for (const card of insightCards) {
          items.push({
            id: `card-${card.id}`,
            dateOfContact: new Date(card.createdAt),
            clientContactHours: 0, // Not applicable for insight cards
            notes: card.content,
            analysis: {
              type: 'insight-card',
              cardType: card.type,
              title: card.title,
              tags: card.tags,
              originalUrl: card.originalUrl
            }
          });
        }
      }

      items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
      setGalleryItems(items);
    };

    processItems();
  }, [logEntries, insightCards, user?.uid]);

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

  if (isLoading || cardsLoading) {
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
        onRefresh={async () => {
          await refetch();
          await refetchCards();
        }}
      />

      {/* Full Page MyMind Style Modal */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900 [&>button]:hidden overflow-hidden" aria-describedby="session-description">
            <DialogTitle className="sr-only">Session Details</DialogTitle>
            <DialogDescription id="session-description" className="sr-only">
              View and manage session details with AI analysis and tags
            </DialogDescription>
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
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain">
                <div className="max-w-none p-6 space-y-8 min-h-full">
                  {/* Main Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-6 leading-tight">
                      Session: {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                    </h1>
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

                  {/* Comprehensive AI Analysis */}
                  {expandedCard.analysis && (
                    <div className="space-y-6">
                      {/* Therapeutic Insights */}
                      {expandedCard.analysis.therapeuticModalities && Array.isArray(expandedCard.analysis.therapeuticModalities) && expandedCard.analysis.therapeuticModalities.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Therapeutic Modalities</h3>
                          <div className="flex flex-wrap gap-2">
                            {expandedCard.analysis.therapeuticModalities.map((mod: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Presentation */}
                      {expandedCard.analysis.clientPresentation && Array.isArray(expandedCard.analysis.clientPresentation) && expandedCard.analysis.clientPresentation.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Client Presentation</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.clientPresentation.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Competency Areas */}
                      {expandedCard.analysis.competencyAreas && Array.isArray(expandedCard.analysis.competencyAreas) && expandedCard.analysis.competencyAreas.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Competency Development</h3>
                          <div className="flex flex-wrap gap-2">
                            {expandedCard.analysis.competencyAreas.map((comp: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Learnings */}
                      {expandedCard.analysis.keyLearnings && Array.isArray(expandedCard.analysis.keyLearnings) && expandedCard.analysis.keyLearnings.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Key Learnings</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.keyLearnings.map((learning: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {learning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Supervision Topics */}
                      {expandedCard.analysis.supervisionTopics && Array.isArray(expandedCard.analysis.supervisionTopics) && expandedCard.analysis.supervisionTopics.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Supervision Topics</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.supervisionTopics.map((topic: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reflective Prompts */}
                      {expandedCard.analysis.reflectivePrompts && Array.isArray(expandedCard.analysis.reflectivePrompts) && expandedCard.analysis.reflectivePrompts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Reflective Questions</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.reflectivePrompts.map((prompt: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300 italic">• {prompt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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

                  {/* Original Session Note */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">ORIGINAL SESSION NOTE</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div 
                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                        style={{ 
                          fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                          lineHeight: '1.75',
                          fontWeight: '400',
                          letterSpacing: '0.015em'
                        }}
                      >
                        {expandedCard.notes || "No notes available for this session."}
                      </div>
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